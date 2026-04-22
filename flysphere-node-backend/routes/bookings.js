const express = require('express');
const router = express.Router();
const pool = require('../db');
const PDFDocument = require('pdfkit');

// ✅ Generate Booking ID
function generateBookingId() {
  return 'FS' + Math.floor(100000 + Math.random() * 900000);
}

async function decrementSeatsForFlight(client, flightId, columnName, seatsToBook) {
  const res = await client.query(
    'SELECT * FROM FlightMGTable WHERE FlightId = $1 FOR UPDATE',
    [flightId]
  );

  if (res.rows.length === 0) {
    throw new Error('Flight not found');
  }

  const row = res.rows[0];

  // pg returns column names in lower-case by default
  const lowerKey = columnName.toLowerCase();
  const currentSeats =
    typeof row[lowerKey] === 'number'
      ? row[lowerKey]
      : Number(row[columnName]) || 0;

  if (currentSeats < seatsToBook) {
    throw new Error('Not enough seats left');
  }

  const newSeats = currentSeats - seatsToBook;

  await client.query(
    `UPDATE FlightMGTable SET ${columnName} = $1 WHERE FlightId = $2`,
    [newSeats, flightId]
  );
}

// ✅ Create Booking
router.post('/', async (req, res) => {
  const {
    user_id,
    outbound_flight_id,
    return_flight_id,
    passengers,
    total_amount,
    trip_type,
    cabin_class, // legacy support
    outbound_cabin_class,
    return_cabin_class
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const bookingId = generateBookingId();

    // Insert into bookings table - keep outbound flight_id for backward compatibility
    const bookingResult = await client.query(
      `INSERT INTO bookings (booking_id, user_id, flight_id, total_amount)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [bookingId, user_id, outbound_flight_id, total_amount]
    );

    const booking = bookingResult.rows[0];

    // Insert outbound segment (segment_no = 1)
    await client.query(
      `INSERT INTO booking_segments (booking_id, segment_no, flight_id)
       VALUES ($1, $2, $3)`,
      [booking.booking_id, 1, outbound_flight_id]
    );

    // Insert return segment if provided (segment_no = 2)
    if (return_flight_id) {
      await client.query(
        `INSERT INTO booking_segments (booking_id, segment_no, flight_id)
         VALUES ($1, $2, $3)`,
        [booking.booking_id, 2, return_flight_id]
      );
    }

    // Insert passengers
    for (let p of passengers) {
      await client.query(
        `INSERT INTO passengers 
        (booking_id, title, first_name, last_name, age, type, seat_preference, meal_preference, baggage)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          booking.id,
          p.title,
          p.firstName,
          p.lastName,
          p.age,
          p.type,
          p.seatPreference,
          p.mealPreference,
          p.baggage
        ]
      );
    }

    /* ======================================
       2) DECREMENT SEAT COUNTS PER BOOKING
       ====================================== */

    const seatsToBook = Array.isArray(passengers) ? passengers.length : 0;

    if (seatsToBook > 0) {

      const getColumnFromCabin = (cabin) => {
        const normalized = (cabin || 'Economy').toLowerCase().trim();

        if (normalized.includes('economy')) return 'TotalEconomySeats';
        if (normalized.includes('business')) return 'TotalBusinessSeats';
        if (normalized.includes('first')) return 'TotalFirstClassSeats';

        throw new Error(`Unsupported cabin_class: ${cabin}`);
      };

      // ✅ One-way support (backward compatible)
      if (!return_flight_id) {
        const columnName = getColumnFromCabin(
          outbound_cabin_class || cabin_class
        );

        if (outbound_flight_id) {
          await decrementSeatsForFlight(
            client,
            outbound_flight_id,
            columnName,
            seatsToBook
          );
        }
      }

      // ✅ Round-trip support (separate cabin classes)
      if (return_flight_id) {

        // Outbound segment
        if (outbound_flight_id) {
          const outboundColumn = getColumnFromCabin(
            outbound_cabin_class || cabin_class
          );

          await decrementSeatsForFlight(
            client,
            outbound_flight_id,
            outboundColumn,
            seatsToBook
          );
        }

        // Return segment
        const returnColumn = getColumnFromCabin(
          return_cabin_class || outbound_cabin_class || cabin_class
        );

        await decrementSeatsForFlight(
          client,
          return_flight_id,
          returnColumn,
          seatsToBook
        );
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      booking: booking
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Booking Error:', error);
    res.status(500).json({ error: 'Booking failed' });
  } finally {
    client.release();
  }
});

/* ✅ Get Full Booking Details (Production Safe) */
router.get('/:bookingId', async (req, res) => {
  const bookingId = req.params.bookingId;

  try {
    // 1) Fetch main booking row
    const bookingResult = await pool.query(
      `SELECT 
        b.id,
        b.booking_id,
        b.user_id,
        b.total_amount,
        b.status,
        b.created_at,
        b.flight_id
      FROM bookings b
      WHERE b.booking_id = $1`,
      [bookingId]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const bookingRow = bookingResult.rows[0];

    let outboundFlight = null;
    let returnFlight = null;

    // 2) Try to fetch segments joined to flightmgtable
    try {
      const segmentsResult = await pool.query(
        `SELECT 
           s.segment_no,
           f.flightid,
           f.airlinename,
           f.flighttype,
           f.departureairport,
           f.arrivalairport,
           f.departuredate,
           f.arrivaldate,
           f.departuretime,
           f.arrivaltime,
           f.flightno
         FROM booking_segments s
         JOIN flightmgtable f
           ON s.flight_id = f.flightid
         WHERE s.booking_id = $1
         ORDER BY s.segment_no ASC`,
        [bookingRow.booking_id]
      );

      console.log('✅ Segments for booking', bookingId, segmentsResult.rows);

      for (const row of segmentsResult.rows) {
        const flightObj = {
          id: row.flightid,
          airlinename: row.airlinename,
          flighttype: row.flighttype,
          departureairport: row.departureairport,
          arrivalairport: row.arrivalairport,
          departuredate: row.departuredate,
          arrivaldate: row.arrivaldate,
          departuretime: row.departuretime,
          arrivaltime: row.arrivaltime,
          flightnumber: row.flightno
        };

        if (row.segment_no === 1) {
          outboundFlight = flightObj;
        } else if (row.segment_no === 2) {
          returnFlight = flightObj;
        }
      }
    } catch (segErr) {
      console.error('⚠️ Error while loading booking segments', segErr);
      // We will fall back to legacy behavior below
    }

    // 3) Fallback for legacy/edge cases: if no outboundFlight from segments,
    //    use the original bookings.flight_id join with flightmgtable
    if (!outboundFlight && bookingRow.flight_id) {
      const legacyResult = await pool.query(
        `SELECT 
           f.flightid,
           f.airlinename,
           f.flighttype,
           f.departureairport,
           f.arrivalairport,
           f.departuredate,
           f.arrivaldate,
           f.departuretime,
           f.arrivaltime,
           f.flightno
         FROM bookings b
         JOIN flightmgtable f
           ON b.flight_id = f.flightid
         WHERE b.booking_id = $1`,
        [bookingId]
      );

      if (legacyResult.rows.length > 0) {
        const r = legacyResult.rows[0];
        outboundFlight = {
          id: r.flightid,
          airlinename: r.airlinename,
          flighttype: r.flighttype,
          departureairport: r.departureairport,
          arrivalairport: r.arrivalairport,
          departuredate: r.departuredate,
          arrivaldate: r.arrivaldate,
          departuretime: r.departuretime,
          arrivaltime: r.arrivaltime,
          flightnumber: r.flightno
        };
      }
    }

    const tripType = returnFlight ? 'round' : 'oneway';

    // 4) Fetch passengers
    const passengersResult = await pool.query(
      'SELECT * FROM passengers WHERE booking_id = $1',
      [bookingRow.id]
    );

    res.json({
      success: true,
      booking: {
        id: bookingRow.id,
        booking_id: bookingRow.booking_id,
        user_id: bookingRow.user_id,
        total_amount: bookingRow.total_amount,
        status: bookingRow.status,
        created_at: bookingRow.created_at,
        trip_type: tripType,
        outbound_flight: outboundFlight,
        return_flight: returnFlight
      },
      passengers: passengersResult.rows
    });

  } catch (error) {
    console.error('Fetch Booking Error:', error);
    res.status(500).json({ error: 'Failed to fetch booking details' });
  }
});


/* ✅ Generate PDF Ticket */
router.get('/:id/ticket', async (req, res) => {
  const bookingId = req.params.id;

  try {
    const bookingResult = await pool.query(
      'SELECT * FROM bookings WHERE id = $1',
      [bookingId]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookingResult.rows[0];

    const passengersResult = await pool.query(
      'SELECT * FROM passengers WHERE booking_id = $1',
      [booking.id]
    );

    const passengers = passengersResult.rows;

    const doc = new PDFDocument({ margin: 0 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=ticket-${booking.booking_id}.pdf`
    );

    doc.pipe(res);

    /* ================= HEADER BAR ================= */
    doc.rect(0, 0, doc.page.width, 100).fill('#1f3b64');

    doc
      .fillColor('#ffffff')
      .fontSize(28)
      .text('FlySphere E‑Ticket', 40, 35);


    doc
      .fontSize(12)
      .text(`Booking ID: ${booking.booking_id}`, 40, 65);

    doc
      .text(
        `Issued On: ${new Date(booking.created_at).toLocaleString()}`,
        350,
        65
      );

    doc.fillColor('#000000');

    let y = 120;

    /* ================= FLIGHT DETAILS ================= */
    const segments = await pool.query(
      `SELECT 
         s.segment_no,
         f.airlinename,
         f.flightno,
         f.departureairport,
         f.arrivalairport,
         f.departuretime,
         f.arrivaltime
       FROM booking_segments s
       JOIN flightmgtable f
         ON s.flight_id = f.flightid
       WHERE s.booking_id = $1
       ORDER BY s.segment_no ASC`,
      [booking.booking_id]
    );

    doc
      .fontSize(16)
      .fillColor('#1f3b64')
      .text('FLIGHT DETAILS', 40, y);

    y += 20;
    doc.moveTo(40, y).lineTo(550, y).stroke('#e2e8f0');
    y += 15;

    segments.rows.forEach((seg) => {
      const fromMatch = (seg.departureairport || '').match(/\((.*?)\)/);
      const toMatch = (seg.arrivalairport || '').match(/\((.*?)\)/);

      const fromCode = fromMatch
        ? fromMatch[1].toUpperCase()
        : (seg.departureairport || '').substring(0, 3).toUpperCase();

      const toCode = toMatch
        ? toMatch[1].toUpperCase()
        : (seg.arrivalairport || '').substring(0, 3).toUpperCase();

      doc.fontSize(18).fillColor('#1f3b64');
      doc.text(`${fromCode}  -  ${toCode}`, 50, y);

      y += 22;

      const depTime = String(seg.departuretime).substring(0,5);
      const arrTime = String(seg.arrivaltime).substring(0,5);

      doc.fontSize(12).fillColor('#000000');
      doc.text(
        `${seg.airlinename} (${seg.flightno})`,
        60,
        y
      );

      y += 15;

      doc.fontSize(12).fillColor('#475569');
      doc.text(`Departure: ${depTime}    Arrival: ${arrTime}`, 60, y);

      y += 30;
    });

    /* ================= PASSENGERS ================= */
    doc
      .fontSize(16)
      .fillColor('#1f3b64')
      .text('PASSENGERS', 40, y);

    y += 20;
    doc.moveTo(40, y).lineTo(550, y).stroke('#e2e8f0');
    y += 15;

    passengers.forEach((p, index) => {
      doc
        .fontSize(12)
        .fillColor('#000000')
        .text(
          `${index + 1}. ${p.title || ''} ${p.first_name} ${p.last_name} (${p.type})`,
          50,
          y
        );

      y += 15;

      doc
        .fontSize(10)
        .fillColor('#475569')
        .text(
          `Age: ${p.age}  |  Seat: ${p.seat_preference || 'N/A'}  |  Meal: ${p.meal_preference || 'N/A'}  |  Baggage: ${
            p.baggage ? 'Yes' : 'No'
          }`,
          60,
          y
        );

      y += 25;
    });

    /* ================= PAYMENT SUMMARY ================= */
    y += 10;
    doc
      .fontSize(16)
      .fillColor('#1f3b64')
      .text('PAYMENT SUMMARY', 40, y);

    y += 20;
    doc.moveTo(40, y).lineTo(550, y).stroke('#e2e8f0');
    y += 15;

    const baseAmount = Number(booking.total_amount);
    const tax = Math.round(baseAmount * 0.12);
    const convenience = 249;
    const grand = baseAmount + tax + convenience;

    const rightAlignX = 400;

    doc.fontSize(11).fillColor('#000000');
    doc.text('Base Fare:', 50, y);
    doc.text(`Rs. ${baseAmount}`, rightAlignX, y);

    y += 15;

    doc.text('Taxes (12%):', 50, y);
    doc.text(`Rs. ${tax}`, rightAlignX, y);

    y += 15;

    doc.text('Convenience Fee:', 50, y);
    doc.text(`Rs. ${convenience}`, rightAlignX, y);

    y += 20;

    doc.moveTo(50, y).lineTo(550, y).stroke('#e2e8f0');
    y += 10;

    doc.fontSize(14).fillColor('#1f3b64');
    doc.text('TOTAL PAID:', 50, y);
    doc.text(`Rs. ${grand}`, rightAlignX, y);

    y += 40;

    /* ================= FOOTER ================= */
    doc
      .fontSize(10)
      .fillColor('#64748b')
      .text(
        'Please arrive at the airport at least 2 hours before departure. Carry valid ID proof.\nThank you for choosing FlySphere. Have a pleasant journey!',
        40,
        y,
        { align: 'center', width: 500 }
      );

    doc.end();

  } catch (error) {
    console.error('Ticket Generation Error:', error);
    res.status(500).json({ error: 'Failed to generate ticket' });
  }
});

/* ✅ Get All Bookings (For Admin Dashboard) */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM bookings ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch All Bookings Error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

module.exports = router;
