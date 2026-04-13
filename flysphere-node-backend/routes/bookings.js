const express = require('express');
const router = express.Router();
const pool = require('../db');
const PDFDocument = require('pdfkit');

// ✅ Generate Booking ID
function generateBookingId() {
  return 'FS' + Math.floor(100000 + Math.random() * 900000);
}

// ✅ Create Booking
router.post('/', async (req, res) => {
  const { user_id, flight_id, passengers, total_amount } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const bookingId = generateBookingId();

    // Insert into bookings table
    const bookingResult = await client.query(
      `INSERT INTO bookings (booking_id, user_id, flight_id, total_amount)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [bookingId, user_id, flight_id, total_amount]
    );

    const booking = bookingResult.rows[0];

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

/* ✅ Get All Bookings (For Admin Dashboard Count) */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bookings');
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
    console.log('✅ USING JOIN QUERY WITH FLIGHTMGTABLE');
    // ✅ Join bookings + flights
    const bookingResult = await pool.query(
      `SELECT 
        b.id,
        b.booking_id,
        b.total_amount,
        b.created_at,
        f.airlinename,
        f.flighttype,
        f.departureairport,
        f.arrivalairport,
        f.departuredate,
        f.arrivaldate,
        f.departuretime,
        f.arrivaltime
      FROM bookings b
      LEFT JOIN flightmgtable f 
        ON b.flight_id = f.flightid
      WHERE b.booking_id = $1`,
      [bookingId]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookingResult.rows[0];

    // ✅ Fetch passengers
    const passengersResult = await pool.query(
      'SELECT * FROM passengers WHERE booking_id = $1',
      [booking.id]
    );

    res.json({
      success: true,
      booking: booking,
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
