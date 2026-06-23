# QuickServe - Restaurant Pre-Ordering System

**Project Name**: QuickServe  
**Theme Selection**: Restaurant Pre-Ordering System  

## Team Details
**Team Name**: Quantum Coders  
**Teammates List with TechIDs**:
- Saurabh Gupta - SAUR506D37
- Sameer Upadhyay - SAME502942
- Kanak Sonkar - KANA48A52D
- Vishal Kumar - VISH69A14C


---

QuickServe is a full-stack restaurant ordering and management platform (similar to Zomato/Swiggy). It allows customers to browse local restaurants, place live or scheduled orders, and enables restaurant owners to manage their menus and order queues in real-time.

The project is split into three main applications:
- **Frontend (`/frontend`)**: The React application for customers to browse and order food.
- **Admin (`/admin`)**: The React dashboard for restaurant owners and staff to manage menus and process orders.
- **Backend (`/backend`)**: The Node.js/Express API that powers the platform, backed by MongoDB.

---

## 🛠 Complete Tech Stack

**Frontend (Customer App)**
- React 19, Vite, React Router DOM
- Tailwind CSS v4, Lucide React (Icons)
- Redux Toolkit, React Redux
- Axios, Socket.io-client, React Hot Toast, Date-fns

**Admin (Dashboard App)**
- React 19, Vite, React Router DOM
- Tailwind CSS v4, Lucide React
- Redux Toolkit, React Redux
- Recharts (for analytics), Axios

**Backend (API Server)**
- Node.js, Express.js
- MongoDB & Mongoose (Database)
- Socket.io (Real-time communication)
- JWT (JSON Web Tokens) & Passport (Google OAuth) for Authentication
- Bcryptjs (Password Hashing)
- Stripe (Payments), Twilio (SMS), Nodemailer (Emails)
- Cloudinary & Multer (Image uploads)
- PDFKit (Invoice Generation), QRCode (QR Code generation)

**Infrastructure / Other Tools**
- Docker & Docker Compose (MongoDB, Redis)
- ESLint (Linting)

---

## 🚀 Setup & Run Instructions

Follow these steps to run the complete platform locally on your machine.

### Prerequisites
- Node.js (v16 or higher)
- Docker Desktop (Optional, for running MongoDB and Redis easily)
- MongoDB Atlas account (or a local MongoDB instance)

### Step 1: Clone the Repository
Open a terminal and run:
```bash
git clone https://github.com/sameer2028/quickserve.git
cd quickserve
```

*(Optional) Start MongoDB and Redis using Docker:*
```bash
docker-compose up -d
```

### Step 2: Set up and Run the Backend Server
1. Open a terminal in the `backend` directory:
   ```bash
   cd backend
   npm install
   ```
2. Create a `.env` file inside the `backend` folder and add essential variables:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=super_secret_key_123
   JWT_REFRESH_SECRET=super_secret_refresh_key_123
   JWT_EXPIRE=15m
   JWT_REFRESH_EXPIRE=7d
   ```
3. Start the backend server:
   ```bash
   npm run dev
   ```

### Step 3: Set up and Run the Customer App (Frontend)
1. Open a new terminal in the `frontend` directory:
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

### Step 4: Set up and Run the Restaurant Dashboard (Admin)
1. Open a new terminal in the `admin` directory:
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
