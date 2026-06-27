# 🚀 AI-Powered Space Debris Collision Prediction and Orbital Risk Management System

An end-to-end intelligent platform for **space debris monitoring, collision prediction, orbital risk assessment, mission operations, and decision support** using the **MERN Stack**, **Python Microservices**, and **Artificial Intelligence**.

---

# 🏗️ System Architecture

<p align="center">
  <img src="docs/images/architecture.png" alt="System Architecture" width="100%">
</p>

The architecture consists of:

- 🌐 React + Vite Frontend
- 🟢 Node.js + Express Backend
- 🐍 Python AI Microservices
- 🍃 MongoDB Database
- 🛰️ TLE Processing Engine
- ⚠️ Collision Prediction Engine
- 📊 Mission Operations Dashboard
- 🌍 Future Scientific Orbit Propagation Interface

---

# ✨ Features

## 🔐 Authentication & Security

- JWT Authentication
- Role-Based Access Control (Admin, Analyst, Operator)
- Protected APIs

## 🛰️ Orbital Object Management

- Create Orbital Objects
- Search & Advanced Filtering
- Orbit Comparison Workspace
- TLE Validation
- Public TLE Import
- Public CelesTrak Synchronization
- Automatic Background Synchronization

## ☄️ Collision Prediction

- Collision Risk Prediction
- Maneuver Simulation
- Mission Impact Analysis
- Explainable AI
- Confidence Scoring
- Prediction Validation
- Recommendation Engine

## 📊 Mission Operations

- Mission Operations Center
- Live Alert Center
- Analytics Dashboard
- Timeline View
- Priority Queue
- Prediction History
- Scenario Workspace
- Report Export
- System Health Dashboard

## 🌍 Scientific Layer

- Scientific Engine Interface
- Orbit Propagation Interface
- Placeholder Scientific Engine
- Ready for SGP4 Integration

---

# 🛠️ Technology Stack

### Frontend

- React
- Vite
- Axios
- Tailwind CSS

### Backend

- Node.js
- Express.js
- JWT
- MongoDB
- Mongoose

### AI & Scientific Layer

- Python
- Flask
- TLE Processing
- Orbit Propagation Interface
- Scientific Engine Interface

### Database

- MongoDB

---

# 📁 Project Structure

```
space-debris-ai-system
│
├── client/
├── server/
├── services/
│   ├── collision-prediction/
│   ├── risk-assessment/
│   ├── avoidance-recommendation/
│   └── data-ingestion/
│
├── docs/
│   └── images/
│       └── architecture.png
│
└── docker-compose.yml
```

---

# 🚀 Installation

## Prerequisites

- Node.js
- npm
- Python
- Docker
- Docker Compose
- MongoDB

## Clone

```bash
git clone https://github.com/yourusername/space-debris-ai-system.git
cd space-debris-ai-system
```

## Backend

```bash
cd server
npm install
```

Create `.env`

```
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_secret_key
```

---

## Frontend

```bash
cd client
npm install
npm run dev
```

---

## Python Services

```bash
cd services
docker-compose up --build
```

---

# 🌐 Default URLs

| Service | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:5000 |
| MongoDB | mongodb://localhost:27017 |

---

# 📌 Future Enhancements

- Real SGP4 Orbit Propagation
- React Three Fiber 3D Earth Visualization
- AI-based Collision Prediction
- Live Satellite Tracking
- Space Weather Integration
- Digital Twin Simulation

---

# 📜 License

This project is developed for academic research and educational purposes.

---

# 👩‍💻 Author

**Tanvi Sharma**
