const pool = require('./db');

const airlines = [
  'IndigoAir',
  'Bharat Wings',
  'SpiceSky',
  'VistaraX',
  'AkasaFly',
  'SkyEmir',
  'LuftWing',
  'Britannia Jet',
  'Singora Air',
  'Qatara Airways'
];

const routes = [
  { from: 'DEL', to: 'MUM' },
  { from: 'DEL', to: 'KOL' },
  { from: 'BLR', to: 'MUM' },
  { from: 'BLR', to: 'KOL' }
];

/* ✅ Final Approved Status System */
const statuses = [
  'Scheduled',
  'Delayed',
  'Rescheduled',
  'Departed',
  'Completed',
  'Cancelled'
];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate() {
  const today = new Date();
  const randomDays = Math.floor(Math.random() * 15);
  const date = new Date(today);
  date.setDate(today.getDate() + randomDays);
  return date.toISOString().split('T')[0];
}

function randomTime() {
  const hour = Math.floor(Math.random() * 24);
  const minute = Math.floor(Math.random() * 60);
  return `${hour.toString().padStart(2, '0')}:${minute
    .toString()
    .padStart(2, '0')}`;
}

async function seedFlights() {
  try {
    console.log('Seeding 20 randomized flights...');

    await pool.query('DELETE FROM FlightMGTable');

    let values = [];

    for (let i = 1; i <= 20; i++) {
      const airline = randomItem(airlines);
      const route = randomItem(routes);
      const status = randomItem(statuses);

      const departureDate = randomDate();
      const arrivalDate = departureDate;

      const departureTime = randomTime();
      const arrivalTime = randomTime();

      const economySeats = 50 + Math.floor(Math.random() * 20);
      const businessSeats = 20 + Math.floor(Math.random() * 10);
      const firstSeats = 5 + Math.floor(Math.random() * 5);

      const baseFare = 4000 + Math.floor(Math.random() * 2000);

      const economyChild = Math.round(baseFare * 0.75);
      const businessAdult = Math.round(baseFare * 1.8);
      const businessChild = Math.round(businessAdult * 0.75);
      const firstAdult = Math.round(baseFare * 2.5);
      const firstChild = Math.round(firstAdult * 0.75);

      const flightNo = `FS${100 + i}`;

      values.push(`(
        '${airline}',
        'Commercial',
        '${flightNo}',
        '${route.from}',
        '${route.to}',
        '${departureDate}',
        '${arrivalDate}',
        '${departureTime}',
        '${arrivalTime}',
        ${economySeats},
        ${businessSeats},
        ${firstSeats},
        ${baseFare},
        ${economyChild},
        ${businessAdult},
        ${businessChild},
        ${firstAdult},
        ${firstChild},
        '${status}'
      )`);
    }

    await pool.query(`
      INSERT INTO FlightMGTable
      (AirlineName, FlightType, FlightNo,
       DepartureAirport, ArrivalAirport,
       DepartureDate, ArrivalDate,
       DepartureTime, ArrivalTime,
       TotalEconomySeats, TotalBusinessSeats, TotalFirstClassSeats,
       EconomyAdultFare, EconomyChildFare,
       BusinessAdultFare, BusinessChildFare,
       FirstAdultFare, FirstChildFare,
       FlightStatus)
      VALUES
      ${values.join(',')}
    `);

    console.log('✅ 20 Flights seeded successfully');
    process.exit();
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seedFlights();
