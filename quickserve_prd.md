# Project Requirements Document (PRD)

## 1. Project Overview
**Project Name:** QuickServe
**Description:** A comprehensive restaurant pre-ordering and management platform. It allows users to discover restaurants, pre-order meals, make payments, and track their orders. It includes a user-facing frontend, a backend API, and a dedicated admin portal for restaurant staff/management.

## 2. System Architecture
The platform is built using a modern JavaScript stack (MERN stack with Redis).
*   **Frontend User App:** React 19 + Vite + Tailwind CSS v4
*   **Admin Dashboard:** React 19 + Vite + Tailwind CSS v4
*   **Backend Server:** Node.js + Express.js
*   **Database:** MongoDB (using Mongoose ODM)
*   **Caching layer:** Redis (containerized via Docker)

## 3. Technology Stack & Dependencies
### 3.1 Backend
*   **Core Framework:** Express.js, Node.js
*   **Database:** MongoDB (Mongoose)
*   **Authentication & Security:** JWT (JSON Web Tokens), Passport (Google OAuth 2.0), bcryptjs, Helmet, Express Rate Limit, express-mongo-sanitize.
*   **Real-time Communication:** Socket.io (implied by frontend client presence)
*   **Payments:** Stripe
*   **Communications:** Twilio (SMS), Nodemailer (Emails), Web-Push (Push Notifications)
*   **Media Storage:** Cloudinary, Multer
*   **Other utilities:** PDFKit (receipt generation), QRCode (QR code generation)

### 3.2 Frontend (User App)
*   **Framework:** React 19, Vite
*   **State Management:** Redux Toolkit (`@reduxjs/toolkit`, `react-redux`)
*   **Routing:** React Router v7 (`react-router-dom`)
*   **Styling:** Tailwind CSS v4
*   **UI Components:** Lucide React (icons), React Hot Toast (notifications)
*   **HTTP Client:** Axios
*   **Real-time Client:** Socket.io-client

### 3.3 Admin Portal
*   **Framework:** React 19, Vite
*   **State Management:** Redux Toolkit
*   **Styling:** Tailwind CSS v4
*   **Charts & Analytics:** Recharts
*   **HTTP Client:** Axios

## 4. Database Schema & Data Models
Based on the backend architecture, the system relies on the following core entities:
1.  **Users & Staff:** `User`, `Staff`
2.  **Restaurant Management:** `Restaurant`, `Branch`
3.  **Menu Management:** `MenuCategory`, `MenuItem`
4.  **Order Processing:** `Cart`, `Order`, `Payment`, `Coupon`, `Wallet`
5.  **Logistics & Kitchen:** `KitchenQueue`, `Delivery`, `Address`
6.  **Engagement:** `Review`, `Notification`

## 5. Core Features & Requirements

### 5.1 User App Features
*   **Authentication & Profile:**
    *   Email/Password and Google OAuth login/registration.
    *   Profile management, address book, and digital wallet.
*   **Restaurant & Menu Discovery:**
    *   Browse restaurants, view details, branches, and menus.
*   **Ordering System:**
    *   Add items to cart, apply coupons.
    *   Checkout process with Stripe payment integration.
*   **Order Tracking:**
    *   Real-time order status updates (via WebSockets/Socket.io).
*   **Reviews & Notifications:**
    *   Leave reviews for restaurants/menu items.
    *   Receive Email, SMS (Twilio), and Push notifications regarding order status.

### 5.2 Admin Portal Features
*   **Authentication:** Secure login for restaurant staff/admins.
*   **Dashboard:** High-level overview of sales, orders, and performance metrics (using Recharts).
*   **Order Management:** View, accept, update, and manage incoming orders in real-time.
*   **Future Scope (Implied by Database Models):**
    *   Menu management (adding/editing items and categories).
    *   Kitchen display queue management.
    *   Delivery management.
    *   Coupon & promotion generation.

### 5.3 Backend API Responsibilities
*   **RESTful endpoints** for all CRUD operations related to the models.
*   **Authentication and Authorization** middleware to protect routes based on roles (User vs Staff).
*   **Payment Gateway Integration:** Processing and verifying Stripe transactions securely.
*   **File Uploads:** Handling menu item images and restaurant logos via Cloudinary.
*   **Background Jobs/Events:** Triggering emails, SMS, and push notifications upon order state changes.
*   **Real-time Socket Server:** Emitting events for live order tracking and kitchen queue updates.

## 6. Infrastructure & Deployment
*   **Local Development:** `docker-compose.yml` is used to spin up MongoDB and Redis instances locally.
*   **Micro-services style repository:** The project uses a monorepo-style folder structure (`frontend`, `backend`, `admin`) to separate concerns but keep them accessible together.
