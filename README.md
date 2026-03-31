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

