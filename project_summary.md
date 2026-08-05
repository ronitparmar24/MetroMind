### 1. Project Overview
* **Project Name:** MetroMind
* **Purpose of the Project:** An Intelligent Urban Transit Ticket-Booking Platform designed specifically for the Gujarat Metro Rail Corporation (GMRC) in Ahmedabad.
* **What real-world problem it solves:** It modernizes traditional metro transit operations by integrating digital ticket booking, real-time journey planning, smart wallets, and gamified eco-friendly tracking, while simultaneously using machine learning to predict crowd congestion and help commuters make informed travel decisions.
* **Target Users:** Daily metro commuters, casual riders, tourists, and transit administrators in Ahmedabad.

### 2. Project Summary
MetroMind is a comprehensive, AI-powered smart transit application tailored for modern urban mobility. It is designed to streamline metro operations and drastically enhance the commuter experience by offering real-time ticket booking, dynamic journey planning, and AI-driven crowd density predictions. 

The platform bridges the gap between standard transactional systems and intelligent analytics by employing a robust dual-backend architecture. It utilizes a secure Node.js/Express backend as the primary "Product API" to handle user authentication, digital wallets, and database operations. Simultaneously, a dedicated Python/Django backend acts as the "Intelligence API," executing machine learning models to forecast crowd levels. These services communicate via an API Gateway pattern to serve a responsive, elegantly styled React single-page application (SPA). Furthermore, MetroMind gamifies sustainability through a unique Carbon Passport feature, making it a state-of-the-art solution for modern smart cities.

### 3. Technology Stack
* **Frontend Framework:** React (v19) configured with Vite
* **Backend Framework(s):** Node.js with Express.js (Product API) & Python with Django/Django REST Framework (Intelligence API)
* **Database:** MongoDB (via Mongoose)
* **Authentication:** JWT (jsonwebtoken), `bcryptjs` for password hashing, Google Auth Library, Firebase Admin
* **APIs:** RESTful internal APIs, Google OAuth
* **Libraries:** Recharts, Axios, QRCode, PDFKit, Pandas, Numpy, Scikit-learn, Seaborn, Matplotlib
* **DevOps Tools:** Docker, Docker Compose, Nodemon
* **Deployment Tools:** Vercel (Frontend deployment)

### 4. Project Architecture
The platform is built on a tightly coupled microservices architecture utilizing an **API Gateway Pattern**:
* The React frontend **never interacts with the Python Django server directly**. 
* All client requests are routed through the Node.js/Express backend (port 5000). 
* Node handles authentication (JWT validation) and standard database operations. 
* When AI predictions or deep analytics are required, Node acts as a proxy, securely forwarding the request to the Django "Intelligence API" (port 8000) server-to-server. 
* This isolates computationally heavy machine learning pipelines from transactional UI requests, ensuring maximum security and independent deployability orchestrated via Docker Compose.

### 5. Folder Structure Summary
* **`frontend/`**: Contains the React Vite Single Page Application. The `src/pages` directory houses 24 distinct feature views (Dashboard, BookTicket, CarbonPassport, etc.), alongside reusable components and a glassmorphism design system.
* **`backend-node/`**: The Express server housing business logic. It includes `src/models` for MongoDB schemas, `src/controllers` for route logic (auth, tickets, wallet), and `src/utils` for utilities like QR code generation.
* **`backend-python/`**: The Django backend managing AI workflows. The `apps/predict/ml` folder contains machine learning training pipelines, while `notebooks/` holds Jupyter notebooks for exploratory data analysis (EDA) and model training.
* **`docker-compose.yml`**: Root configuration file enabling a one-command spin-up of the complete environment (MongoDB, Node, Django, and React).

### 6. Core Features
* **Smart Ticket Booking:** End-to-end ticket generation with dynamic QR codes and downloadable PDF receipts.
* **AI Crowd Prediction:** Real-time forecasting of train and station congestion using machine learning regression and classification models.
* **Journey Planner & Fare Calculator:** Intelligent routing across the metro network with automated fare calculation.
* **Wallet & Pass Management:** Digital wallets, physical MetroCard linking, and monthly pass subscriptions.
* **Carbon Passport:** Gamified tracking of CO₂ saved by using public transit, rewarding users with achievements.
* **Live Trains & Analytics:** Dashboards tracking live trains, spending habits, and historical travel data.
* **Safety & Support:** Emergency SOS functionality, feedback collection, and a Lost & Found reporting system.

### 7. Backend Responsibilities (Node.js)
The Node.js backend serves as the core "Product API." It securely manages user authentication (JWT & OAuth) and handles all transactional database queries using Mongoose models. It implements the primary business logic for fare calculation, wallet deductions, and ticket generation. Crucially, it operates as an API Gateway, validating and sanitizing requests before proxying predictive queries to the Python service.

### 8. Python Service Responsibilities (Django)
The Python Django backend acts exclusively as the "Intelligence API." It manages the data science ecosystem, executing machine learning models to predict station crowd densities. It hosts analytical endpoints that process historical transit data and serves prediction inferences back to the Node.js backend upon request. It is never exposed directly to the public internet.

### 9. Frontend Responsibilities (React)
The React SPA delivers a highly responsive, modern user interface. It securely consumes the Node.js REST APIs, manages complex interactive workflows (like booking tickets and viewing maps), and visualizes analytical data using `Recharts`. It implements a unified, premium design system focused on glassmorphism, micro-animations, and seamless user experience.

### 10. API Summary
* **Auth APIs** (`/api/auth`): Handles secure user registration, login, and OAuth validation.
* **Ticket & Journey APIs** (`/api/tickets`, `/api/routes`, `/api/liveTrains`): Manages booking transactions, journey planning, and real-time transit tracking.
* **Finance APIs** (`/api/wallet`, `/api/pass`, `/api/metrocard`): Controls wallet balances, financial transaction logs, and physical card subscriptions.
* **Intelligence APIs** (`/api/predict`, `/api/analytics`): Fetches ML crowd predictions and statistical travel data (proxied to Django).
* **Utility APIs** (`/api/feedback`, `/api/lostfound`, `/api/weather`): Manages user feedback, lost items, and environmental data.

### 11. Database Summary
The project utilizes **MongoDB** via Mongoose, structured into 11 relational-style collections:
* **Core:** `User` (profiles, auth), `Ticket` (bookings, QR data), `Transaction` (payment logs).
* **Financial:** `Wallet` (user balances), `MetroCard` (linked physical cards), `MonthlyPass` (active subscriptions).
* **Operational:** `SavedRoute` (user preferences), `Feedback`, `LostFound`, `Notification`, and `AuditLog`.
**Relationships:** Tickets, Transactions, Cards, and Feedback are explicitly linked to specific `User` IDs via reference `ObjectId`s, ensuring strict data integrity.

### 12. Authentication & Security
* **Authentication Flow:** Dual strategy using standard Email/Password and Google OAuth.
* **JWT Usage:** JSON Web Tokens are issued upon login, stored securely on the client, and verified by Node.js middleware on every protected route.
* **Security Practices:** Passwords are hashed using `bcryptjs`. The Node app utilizes `helmet` for HTTP header security and `express-rate-limit` to prevent brute-force attacks. Input data is strictly sanitized using `express-validator`.
* **Environment Variables:** Sensitive keys (JWT secrets, Mongo URIs, API keys) are safely managed via `.env` files and excluded from version control.

### 13. Workflow
1. **Onboarding:** A user registers or logs in via the React frontend. Node authenticates and returns a secure JWT.
2. **Planning:** The user navigates to the Journey Planner and selects a source and destination.
3. **Prediction:** Node calculates the fare, simultaneously asking Django for the predicted crowd density, and returns the aggregated data to the user.
4. **Transaction:** The user books the ticket. Node deducts the fare from the user's digital Wallet, creates a Ticket record in MongoDB, and generates a QR code.
5. **Tracking:** The user views their active ticket, earns gamified Carbon Passport achievements, and completes their journey.

### 14. Advantages
* **Separation of Concerns:** Exceptional separation between transactional operations (Node.js) and compute-heavy AI/ML tasks (Python).
* **Highly Scalable:** Dockerized microservices architecture allows independent scaling of the web and AI servers.
* **Modern UX/UI:** Rich, interactive dashboards with gamification (Carbon Passport) drive high user retention and engagement.
* **Data-Driven Intelligence:** Built-in machine learning models elevate the platform from a simple booking tool to an intelligent, predictive transit assistant.

### 15. Challenges
* **Network Latency:** Managing the overhead of the API Gateway pattern where requests must chain from React to Node to Django.
* **Data Synchronization:** Ensuring the transactional data continuously generated in MongoDB aligns correctly with the static datasets used to train the Python ML models.
* **Operational Complexity:** Maintaining a dual-backend ecosystem requires broader full-stack expertise and complex deployment pipelines.

### 16. Future Scope
* Integration of real-world Payment Gateways (Stripe/Razorpay) for live digital wallet top-ups.
* Development of native iOS and Android applications using React Native.
* Real-time IoT hardware integration on trains for hyper-accurate GPS tracking.
* Expanding ML capabilities to adjust crowd predictions dynamically based on live weather patterns and city events.

### 17. Key Highlights
* 🚄 Comprehensive intelligent transit platform built for the Gujarat Metro.
* ⚛️ Modern React (Vite) frontend with Recharts-powered interactive analytics.
* 🛡️ Dual-backend microservices architecture (Node.js + Python/Django).
* 🧠 Built-in machine learning pipelines for real-time station crowd prediction.
* 🔒 Secure API Gateway pattern preventing direct exposure of the ML server.
* 💳 Complete financial ecosystem (Digital Wallet, MetroCard, Monthly Passes).
* 🌱 Gamified 'Carbon Passport' tracking CO₂ savings for sustainable commuting.
* 🔑 Secure JWT Authentication combined with Google OAuth support.
* 🐳 Fully containerized, one-command startup ecosystem using Docker Compose.
* 📈 Enterprise-grade database design with robust auditing and transactional logs.

### 18. One-Line Elevator Pitch
**MetroMind is an AI-powered, full-stack urban transit platform that modernizes ticket booking, gamifies sustainable commuting, and leverages machine learning to predict crowd density for a seamless and intelligent metro experience.**
