# ✈ FlySphere - Full Stack Airline Management System

FlySphere is a full-stack airline booking and management system built using Angular, Node.js, Express, and PostgreSQL.

---
## 🚀 Tech Stack
### Frontend
- Angular
- TypeScript
- HTML / CSS
### Backend
- Node.js
- Express.js
- JWT Authentication
- Role-Based Access Control
### Database
- PostgreSQL
---
## ✅ Features
- User Registration & Login
- Role-Based Authentication (USER / ADMIN)
- Protected Routes
- Admin Dashboard
- JWT Token Security
- Backend Middleware Protection
---
## 📁 Project Structure
```
FlySphere/
│
├── flysphere-frontend/        # Angular Application
│
└── flysphere-node-backend/    # Express Backend API
```
## 🛠 Setup Instructions

### 1️⃣ Clone Repository
git clone https://github.com/buildwithrahulg/FlySphere.git

### 2️⃣ Start Backend

```
cd flysphere-node-backend
npm install
node server.js
```

### 3️⃣ Start Frontend

```
cd flysphere-frontend
npm install
ng serve
```

Open:
```
http://localhost:4200
```
---
## 🔐 Authentication Flow

- JWT generated on login
- Role stored in token
- Route Guard checks role
- Backend middleware protects admin routes

---
## 👥 Team Collaboration Workflow

✅ Never push directly to `main`  
✅ Always create a branch  

### Example:

```
git checkout -b feature-admin-improvement
git add .
git commit -m "Improved admin panel"
git push origin feature-admin-improvement
```

Then create a Pull Request.

---
## 📌 Future Improvements
- Flight Booking System
- Payment Gateway Integration
- Deployment to Cloud
- CI/CD Integration
---
## 👨‍💻 Developed By

Rahul Kumar Gupta  
GitHub: https://github.com/buildwithrahulg

## 🚀 Version 1.0 - Initial Release


Database tables 

USERS TABLE ────────────────────────────────────────

CREATE TABLE users ( UserId VARCHAR(50) PRIMARY KEY, FirstName VARCHAR(50) NOT NULL, LastName VARCHAR(50) NOT NULL, Phone VARCHAR(15) NOT NULL, Email VARCHAR(100) UNIQUE NOT NULL, Password VARCHAR(255) NOT NULL, Role VARCHAR(20) DEFAULT 'USER' );

──────────────────────────────────────── 2️⃣ FlightMGTable ────────────────────────────────────────

CREATE TABLE FlightMGTable ( FlightId SERIAL PRIMARY KEY, AirlineName VARCHAR(100) NOT NULL, FlightType VARCHAR(50) NOT NULL, FlightNo VARCHAR(10) NOT NULL, DepartureAirport VARCHAR(10) NOT NULL, ArrivalAirport VARCHAR(10) NOT NULL, DepartureDate DATE NOT NULL, ArrivalDate DATE NOT NULL, DepartureTime TIME NOT NULL, ArrivalTime TIME NOT NULL,

```javascript
TotalEconomySeats INTEGER NOT NULL,
TotalBusinessSeats INTEGER NOT NULL,
TotalFirstClassSeats INTEGER NOT NULL,

EconomyAdultFare NUMERIC(10,2),
EconomyChildFare NUMERIC(10,2),
BusinessAdultFare NUMERIC(10,2),
BusinessChildFare NUMERIC(10,2),
FirstAdultFare NUMERIC(10,2),
FirstChildFare NUMERIC(10,2),

FlightStatus VARCHAR(30) DEFAULT 'Scheduled',
aircraft_type VARCHAR(50)
```

);

──────────────────────────────────────── 3️⃣ BOOKINGS TABLE ────────────────────────────────────────

CREATE TABLE bookings ( id SERIAL PRIMARY KEY, booking_id VARCHAR(20) UNIQUE NOT NULL, user_id VARCHAR(50) REFERENCES users(UserId) ON DELETE CASCADE, flight_id INTEGER REFERENCES FlightMGTable(FlightId), total_amount NUMERIC(10,2) NOT NULL, status VARCHAR(30) DEFAULT 'CONFIRMED', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP );

──────────────────────────────────────── 4️⃣ BOOKING_SEGMENTS TABLE ────────────────────────────────────────

CREATE TABLE booking_segments ( id SERIAL PRIMARY KEY, booking_id VARCHAR(20) REFERENCES bookings(booking_id) ON DELETE CASCADE, segment_no INTEGER NOT NULL, flight_id INTEGER REFERENCES FlightMGTable(FlightId) ON DELETE CASCADE );

──────────────────────────────────────── 5️⃣ PASSENGERS TABLE ────────────────────────────────────────

CREATE TABLE passengers ( id SERIAL PRIMARY KEY, booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE, title VARCHAR(10), first_name VARCHAR(50) NOT NULL, last_name VARCHAR(50) NOT NULL, age INTEGER NOT NULL, type VARCHAR(20) NOT NULL, -- Adult / Child seat_preference VARCHAR(20), meal_preference VARCHAR(50), baggage BOOLEAN DEFAULT FALSE );

──────────────────────────────────────── ✅ DATABASE SUMMARY ────────────────────────────────────────

Tables in FlySphere database:

• users\
• FlightMGTable\
• bookings\
• booking_segments\
• passengers

Relationships:

users (1) → (many) bookings\
bookings (1) → (many) passengers\
bookings (1) → (many) booking_segments\
booking_segments (many) → (1) FlightMGTable

This represents the full relational structure used by your backend system.





