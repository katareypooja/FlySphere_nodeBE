const express = require('express');
const router = express.Router();
const pool = require('../db');

/* ===============================
   FLIGHT CRUD ROUTES
=============================== */

// ✅ Create Flight
router.post('/', async (req, res) => {
  try {
    const {
      AirlineName,
      FlightType,
      FlightNo,
      DepartureAirport,
      ArrivalAirport,
      DepartureDate,
      ArrivalDate,
      DepartureTime,
      ArrivalTime,
      TotalEconomySeats,
      TotalBusinessSeats,
      TotalFirstClassSeats,
      EconomyAdultFare,
      EconomyChildFare,
      BusinessAdultFare,
      BusinessChildFare,
      FirstAdultFare,
      FirstChildFare,
      FlightStatus
    } = req.body;

    // ✅ Use FlightNo received from frontend (random 2 letters + 3 digits)
    const generatedFlightNo = FlightNo;

    const result = await pool.query(
      `INSERT INTO FlightMGTable
      (AirlineName, FlightType, FlightNo, DepartureAirport, ArrivalAirport,
       DepartureDate, ArrivalDate, DepartureTime, ArrivalTime,
       TotalEconomySeats, TotalBusinessSeats, TotalFirstClassSeats,
       EconomyAdultFare, EconomyChildFare,
       BusinessAdultFare, BusinessChildFare,
       FirstAdultFare, FirstChildFare,
       FlightStatus)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
      RETURNING *`,
      [
        AirlineName,
        FlightType,
        generatedFlightNo,
        DepartureAirport,
        ArrivalAirport,
        DepartureDate,
        ArrivalDate,
        DepartureTime,
        ArrivalTime,
        TotalEconomySeats,
        TotalBusinessSeats,
        TotalFirstClassSeats,
        EconomyAdultFare,
        EconomyChildFare,
        BusinessAdultFare,
        BusinessChildFare,
        FirstAdultFare,
        FirstChildFare,
        FlightStatus
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Create Flight Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get Flights (with optional filtering)
router.get('/', async (req, res) => {
  try {
    const { from, to, date } = req.query;

    // ✅ Admin should see ALL flights (including Cancelled)
    let query = 'SELECT * FROM FlightMGTable WHERE 1=1';
    const values = [];
    let index = 1;

    if (from) {
      query += ` AND DepartureAirport = $${index++}`;
      values.push(from);
    }

    if (to) {
      query += ` AND ArrivalAirport = $${index++}`;
      values.push(to);
    }

    if (date) {
      query += ` AND DepartureDate = $${index++}`;
      values.push(date);
    }

    query += ' ORDER BY FlightId DESC';

    const result = await pool.query(query, values);

    const now = new Date();

    // ✅ Dynamic lifecycle calculation (DB as source of truth)
    for (const flight of result.rows) {
      try {
        const currentStatus = flight.flightstatus;

        // ✅ Do NOT override manually controlled statuses
        if (
          currentStatus === 'Cancelled' ||
          currentStatus === 'Delayed' ||
          currentStatus === 'Rescheduled'
        ) continue;

        const departureDate = flight.departuredate;
        const arrivalDate = flight.arrivaldate;
        const departureTime = flight.departuretime;
        const arrivalTime = flight.arrivaltime;

        if (!departureDate || !arrivalDate || !departureTime || !arrivalTime) continue;

        // ✅ Build local datetime safely (avoid timezone shift issues)

        const depDate = new Date(departureDate);
        const arrDate = new Date(arrivalDate);

        const [depHours, depMinutes, depSeconds = 0] = departureTime.split(':').map(Number);
        const [arrHours, arrMinutes, arrSeconds = 0] = arrivalTime.split(':').map(Number);

        const departureDateTime = new Date(depDate);
        departureDateTime.setHours(depHours, depMinutes, depSeconds, 0);

        const arrivalDateTime = new Date(arrDate);
        arrivalDateTime.setHours(arrHours, arrMinutes, arrSeconds, 0);

        let calculatedStatus = currentStatus;

        // ✅ Only auto-manage lifecycle for Scheduled / Departed
        if (currentStatus === 'Scheduled') {
          if (now >= departureDateTime && now < arrivalDateTime) {
            calculatedStatus = 'Departed';
          } else if (now >= arrivalDateTime) {
            calculatedStatus = 'Completed';
          }
        }

        if (currentStatus === 'Departed') {
          if (now >= arrivalDateTime) {
            calculatedStatus = 'Completed';
          }
        }

        // Update DB only if status changed
        if (calculatedStatus !== currentStatus) {
          await pool.query(
            `UPDATE FlightMGTable 
             SET FlightStatus = $1 
             WHERE FlightId = $2`,
            [calculatedStatus, flight.flightid]
          );

          flight.flightstatus = calculatedStatus;
        }

      } catch (e) {
        console.error('Lifecycle calculation failed:', e);
      }
    }

    res.json(result.rows);

  } catch (err) {
    console.error('Get Flights Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get Flight By ID
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM FlightMGTable WHERE FlightId = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Flight not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get Flight By ID Error:', err);
    res.status(500).json({ error: err.message });
  }
});

 // ✅ Update Flight (Used for Edit + Cancel)
router.put('/:id', async (req, res) => {
  try {
    const {
      AirlineName,
      FlightType,
      FlightNo,
      DepartureAirport,
      ArrivalAirport,
      DepartureDate,
      ArrivalDate,
      DepartureTime,
      ArrivalTime,
      TotalEconomySeats,
      TotalBusinessSeats,
      TotalFirstClassSeats,
      EconomyAdultFare,
      EconomyChildFare,
      BusinessAdultFare,
      BusinessChildFare,
      FirstAdultFare,
      FirstChildFare,
      FlightStatus
    } = req.body;

    const result = await pool.query(
      `UPDATE FlightMGTable SET
        AirlineName=$1,
        FlightType=$2,
        FlightNo=$3,
        DepartureAirport=$4,
        ArrivalAirport=$5,
        DepartureDate=$6,
        ArrivalDate=$7,
        DepartureTime=$8,
        ArrivalTime=$9,
        TotalEconomySeats=$10,
        TotalBusinessSeats=$11,
        TotalFirstClassSeats=$12,
        EconomyAdultFare=$13,
        EconomyChildFare=$14,
        BusinessAdultFare=$15,
        BusinessChildFare=$16,
        FirstAdultFare=$17,
        FirstChildFare=$18,
        FlightStatus=$19
       WHERE FlightId=$20
       RETURNING *`,
      [
        AirlineName,
        FlightType,
        FlightNo,
        DepartureAirport,
        ArrivalAirport,
        DepartureDate,
        ArrivalDate,
        DepartureTime,
        ArrivalTime,
        TotalEconomySeats,
        TotalBusinessSeats,
        TotalFirstClassSeats,
        EconomyAdultFare,
        EconomyChildFare,
        BusinessAdultFare,
        BusinessChildFare,
        FirstAdultFare,
        FirstChildFare,
        FlightStatus,
        req.params.id
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update Flight Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Delete Flight
router.delete('/:id', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM FlightMGTable WHERE FlightId = $1',
      [req.params.id]
    );
    res.json({ message: 'Flight deleted successfully' });
  } catch (err) {
    console.error('Delete Flight Error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
