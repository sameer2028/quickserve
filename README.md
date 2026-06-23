# QuickServe

QuickServe is a full-stack restaurant ordering and management platform (similar to Zomato/Swiggy). It allows customers to browse local restaurants, place live or scheduled orders, and enables restaurant owners to manage their menus and order queues in real-time.

The project is split into three main applications:
- **Frontend (`/frontend`)**: The React application for customers to browse and order food.
- **Admin (`/admin`)**: The React dashboard for restaurant owners and staff to manage menus and process orders.
- **Backend (`/backend`)**: The Node.js/Express API that powers the platform, backed by MongoDB.

## Prerequisites

Before starting, ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v16 or higher)
- [Git](https://git-scm.com/)
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (or a local MongoDB instance)

---

## 🚀 Local Setup Guide

Follow these steps to run the complete platform on your own PC.

### Step 1: Clone the Repository

Open a terminal and clone the repository:
```bash
git clone https://github.com/sameer2028/quickserve.git
cd quickserve
```

### Step 2: Set up the Backend Server

The backend handles the database, authentication, and all API requests.

1. Open a terminal in the `backend` directory:
   ```bash
   cd backend
   npm install
   ```
2. Create a file named `.env` inside the `backend` folder and add these essential variables:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=super_secret_key_123
   JWT_REFRESH_SECRET=super_secret_refresh_key_123
   JWT_EXPIRE=15m
   JWT_REFRESH_EXPIRE=7d
   ```
3. *(Optional)* Seed the database with sample restaurants and menus so you have data to play with:
   ```bash
   node src/utils/seed_pizza.js
   ```
4. Start the backend server:
   ```bash
   npm run dev
   ```
   *The backend will now be running on `http://localhost:5000`*

### Step 3: Set up the Customer App (Frontend)

This is the application where customers browse restaurants and order food.

1. Open a **new** terminal and go to the `frontend` folder:
   ```bash
   cd frontend
   npm install
   ```
2. Create a `.env` file inside the `frontend` folder:
   ```env
   VITE_API_URL=http://localhost:5000/api/v1
   ```
3. Start the customer app:
   ```bash
   npm run dev
   ```
   *The customer app will now be running on `http://localhost:3000`*

### Step 4: Set up the Restaurant Dashboard (Admin)

This is the dashboard where owners manage their menus, staff, and real-time order queues.

1. Open a **third** terminal and go to the `admin` folder:
   ```bash
   cd admin
   npm install
   ```
2. Create a `.env` file inside the `admin` folder:
   ```env
   VITE_API_URL=http://localhost:5000/api/v1
   ```
3. Start the admin dashboard:
   ```bash
   npm run dev
   ```
   *The admin dashboard will now be running on `http://localhost:3001`*

---

## 🛠 Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Redux Toolkit
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
