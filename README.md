# The Kamar-Taj Refectory (KTF)
<<<<<<< HEAD
### A Smart College Mess Management System with QR-Based Meal Check-In

**Team Name:** OPM (OPM ID: 57)  
**Team Members:**  
- Mradul Kumar (20253161)  
- Pyush Kumar Singh (20253214)  
- Om Narayan Dubey (20253178)  

---

## 📌 Executive Overview
**The Kamar-Taj Refectory** is a full-stack MERN web application engineered to solve long dining queues, manual paper register errors, unverified meal claims, and food waste in college mess facilities. It bridges student reservations with an entrance turnstile QR verification system featuring **atomic duplicate-redemption prevention**, **automated cancellation rebate calculations**, and **kitchen food-waste intelligence**.

---

## 🚀 Core Implemented Modules

### 1. Role-Based Authentication & Access Control
- Secure JWT-based sessions and `bcrypt` password hashing (12 rounds).
- Differentiated user permissions: **Student** vs **Mess Administrator / Staff**.
- **1-Click Demo Login** buttons on the sign-in screen for evaluation:
  - **Student Demo:** `student@kamartaj.edu` / `Student@12345` (Mradul Kumar)
  - **Mess Admin Demo:** `admin@kamartaj.edu` / `Admin@12345` (Ancient One - Mess Warden)

### 2. Meal Management & Capacity Rules (Admin)
- Schedule daily meal categories: **Breakfast, Lunch, Snacks, Dinner**.
- Configurable **Service Windows** (e.g., `07:30 - 09:45 AM`, `12:30 - 02:30 PM`).
- Strict **Booking Cutoff Deadlines** and seat capacity thresholds with real-time capacity progress trackers.
- Pre-set **1-Click Scheduling Templates** (South Indian Breakfast, North Indian Thali, Evening Snacks, Feast Dinner).
- Toggle meal booking open/closed status and schedule deletion safeguards.

### 3. Student Reservation & QR Pass Issuance
- Browse scheduled meals with itemized dish tags, meal prices, and cancellation rebate values.
- Real-time seat reservation with instant overcapacity and cutoff deadline validation.
- High-contrast **Digital QR Pass** generated upon reservation with download capability (`Save Pass`) for offline presentation.

### 4. Turnstile QR Check-In & Strict Duplicate-Redemption Prevention
- **Camera-Enabled Entrance Scanner:** Live webcam scanner, image upload scanner, and manual code entry fallback.
- **Server-Side Atomic Controlled Operation:** Uses MongoDB `findOneAndUpdate({ bookingCode, status: "booked" })` to ensure concurrent check-in scans can **never** redeem a ticket twice.
- **Diagnostic Feedback:**
  - `APPROVED`: Audio chime + confetti celebration + student identification banner.
  - `DUPLICATE REDEMPTION BLOCKED`: Audio warning + exact timestamp and student identity of previous check-in.
  - `CANCELLED`: Clear notice that the student cancelled their reservation.
- Live entrance check-in stream logging turnstile traffic in real time.

### 5. Records & Analytics Dashboard (Admin)
- Real-time Executive Summary: Total Bookings, Meals Redeemed, Check-in Conversion Rate (%), and Rebates Processed.
- **Recharts Visualizations:**
  - Attendance breakdown by Meal Type (Booked vs Redeemed vs Cancelled).
  - Reservation Status Distribution (Donut Chart).
  - 7-Day dining attendance trends.
- One-click **Export to CSV** for complete mess attendance records.

### 6. Level 2 Enhancements
- **Billing & Rebate Ledger:**
  - Automated rebate credits applied to the student's dining wallet whenever meals are cancelled before cutoff deadlines.
  - Student monthly mess billing breakdown (Base monthly plan, rebate deductions, net payable dues).
- **Food-Waste Telemetry & Tracking:**
  - Automatic calculation of unredeemed meal surplus (kg and economic cost).
  - Kitchen staff daily leftover logging (portions prepared vs served).
  - Environmental sustainability impact telemetry.
- **Notification Center & Email Alerts:**
  - In-app notification center (bell dropdown with unread badge).
  - Real-time email dispatch integration via `nodemailer` for booking confirmations, check-in receipts, and rebate credits.

---

## 🛠️ Technology Stack
- **Frontend:** React 19, Vite, Recharts, `html5-qrcode`, `canvas-confetti`, `lucide-react`, Vanilla CSS tokens.
- **Backend:** Node.js, Express.js, MongoDB Atlas (Mongoose), JWT, Bcrypt, QRcode, Nodemailer.

---

## ⚡ Running the Project Locally

### 1. Start the Backend Server:
```bash
cd server
npm install
node seed.js    # (Optional) Reseeds sample meals and demo users
node server.js  # Runs Express API on http://localhost:5000
```

### 2. Start the Frontend Client:
```bash
cd client
npm install
npm run dev     # Runs Vite web app on http://127.0.0.1:5173
```
=======

**The Kamar-Taj Refectory (KTF)** is a full-stack web application designed to simplify and digitize the campus mess booking process. It provides students with a convenient platform to view daily meal menus, book meals in advance, and manage their reservations, while administrators can manage meal schedules, control booking capacity, and verify student bookings.

The project is built using the **MERN stack — MongoDB, Express.js, React.js, and Node.js**. React.js provides an interactive and responsive user interface, while Node.js and Express.js handle backend operations and API requests. MongoDB stores user accounts, meal information, and booking records.

### Key Features

- **User Authentication:** Students can register and log in securely. Passwords are hashed, and JSON Web Tokens (JWT) are used for authentication and access control.
- **Meal Menu Management:** Students can view available meals, including meal types, dates, menus, booking deadlines, and availability.
- **Online Meal Booking:** Students can reserve meals in advance, helping them plan their meals more efficiently.
- **Booking Management:** Students can view their bookings and cancel eligible reservations.
- **QR Code Generation:** Each booking receives a unique booking code and QR code to support identification and verification.
- **Admin Dashboard:** Administrators can create meal schedules, define menus, set booking deadlines, and manage meal capacities.
- **Booking Verification:** Administrators can retrieve booking records and verify bookings using their unique booking codes.
- **Database Integration:** MongoDB maintains persistent records of users, meals, and reservations.

### Technology Stack

| Component | Technology |
|---|---|
| Frontend | React.js, Vite, CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB |
| Authentication | JWT, bcrypt |
| API Communication | Axios, REST APIs |
| QR Code Generation | QR code library |

### Project Objective

The primary objective of KTF is to reduce the inconvenience of manual mess booking and make the process more organized, accessible, and efficient. By bringing meal schedules, reservations, and booking verification into a single web application, the system aims to improve the experience for both students and mess administrators.

### Future Scope

Future enhancements may include online payments, email or notification reminders, QR-code scanning, meal-demand analytics, automated cancellation handling, and improved administrative reports.

**KTF aims to provide a practical, scalable foundation for a digital campus mess management system using modern full-stack web development technologies.**
>>>>>>> d758517698ca09a24f3d59834fc36da7946dfd64
