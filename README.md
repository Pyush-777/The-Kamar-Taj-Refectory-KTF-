# The Kamar-Taj Refectory (KTF)

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
