const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { types } = require('pg');

// ✅ Force PostgreSQL DATE (OID 1082) to return as plain string (no UTC conversion)
types.setTypeParser(1082, value => value);

const authRoutes = require('./routes/auth');
const flightRoutes = require('./routes/flights');
const bookingsRoutes = require('./routes/bookings');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/bookings', bookingsRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`FlySphere Node backend running on port ${PORT}`);
});
