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
    cabin_class
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
      const CABIN_COLUMN_MAP = {
        Economy: 'TotalEconomySeats',
        Business: 'TotalBusinessSeats',
        First: 'TotalFirstClassSeats'
      };

      const selectedCabin = cabin_class || 'Economy';
      const columnName = CABIN_COLUMN_MAP[selectedCabin];

      if (!columnName) {
        throw new Error(`Unsupported cabin_class: ${selectedCabin}`);
      }

      if (outbound_flight_id) {
        await decrementSeatsForFlight(client, outbound_flight_id, columnName, seatsToBook);
      }

      if (return_flight_id) {
        await decrementSeatsForFlight(client, return_flight_id, columnName, seatsToBook);
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

/* ✅ Get All Bookings (Admin Dashboard) */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM bookings ORDER BY created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Fetch All Bookings Error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
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

    const doc = new PDFDocument({ margin: 40 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=ticket-${booking.booking_id}.pdf`
    );

    doc.pipe(res);

    doc.fontSize(22).text('FlySphere E-Ticket', { align: 'center' });
    doc.moveDown();

    doc.fontSize(14).text(`Booking ID: ${booking.booking_id}`);
    doc.text(`Total Amount: ₹ ${booking.total_amount}`);
    doc.text(`Date: ${new Date(booking.created_at).toLocaleString()}`);
    doc.moveDown();

    doc.fontSize(16).text('Passengers:', { underline: true });
    doc.moveDown(0.5);

    passengers.forEach((p, index) => {
      doc.fontSize(12).text(
        `${index + 1}. ${p.title} ${p.first_name} ${p.last_name} | Age: ${p.age} | Type: ${p.type}`
      );
      doc.text(
        `Seat: ${p.seat_preference || 'N/A'} | Meal: ${p.meal_preference || 'N/A'} | Baggage: ${p.baggage ? 'Yes' : 'No'}`
      );
      doc.moveDown();
    });

    doc.moveDown();
    doc.fontSize(12).text('Thank you for choosing FlySphere!', {
      align: 'center'
    });

    doc.end();

  } catch (error) {
    console.error('Ticket Generation Error:', error);
    res.status(500).json({ error: 'Failed to generate ticket' });
  }
});

module.exports = router;
