# The Kamar-Taj Refectory (KTF)
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
