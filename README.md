# 🚀 AI-Powered Space Debris Collision Prediction & Orbital Risk Management System

An end-to-end intelligent **Space Situational Awareness (SSA)** platform for satellite monitoring, orbital propagation, collision risk prediction, mission analysis, and AI-assisted avoidance decision support.

The system combines:

- 🛰️ Real orbital data from CelesTrak
- 📡 TLE-based orbit propagation
- 🧠 Artificial Intelligence
- ⚠️ Collision probability estimation
- 🚀 Avoidance maneuver recommendation
- 📊 Mission operations analytics

Built using **MERN Stack + Python Scientific Microservices + Docker**.

---

# 🏗️ System Architecture

<p align="center">
  <img src="docs/images/architecture.png" alt="System Architecture" width="100%">
</p>

## Architecture Components

- 🌐 React + Vite Mission Control Dashboard
- 🟢 Node.js + Express API Gateway
- 🐍 Python Scientific Microservices
- 🍃 MongoDB Data Persistence
- 🛰️ CelesTrak TLE Synchronization
- 📡 SGP4 Orbit Propagation Engine
- 🤖 AI Collision Prediction Service
- ⚠️ Risk Assessment Engine
- 🚀 Avoidance Recommendation Engine
- 📊 Mission Audit & Reporting System

---

# ✨ Core Features

---

## 🔐 Authentication & Security

- JWT Authentication
- Role-Based Access Control

Roles:

- Admin
- Analyst
- Operator

Features:

- Protected APIs
- Secure mission operations access
- Authorization middleware

---

# 🛰️ Orbital Object Management

Manage and monitor satellites and debris objects.

Features:

- Orbital object database
- Satellite metadata management
- Search and filtering
- Object comparison
- CelesTrak synchronization
- NORAD catalog support
- International designator support

Stored orbital data:

- TLE Line 1
- TLE Line 2
- Epoch
- Inclination
- Eccentricity
- RAAN
- Argument of Perigee
- Mean Motion

---

# 📡 Scientific Orbit Propagation

Real orbital mechanics integration using SGP4.

Pipeline:

```
CelesTrak TLE
        |
        ↓
SGP4 Propagation Engine
        |
        ↓
ECI Position / Velocity Vectors
        |
        ↓
Trajectory Generation
        |
        ↓
Visualization + Prediction Engine
```

Generated trajectory data:

- Timestamp
- Latitude
- Longitude
- Altitude
- Velocity
- ECI Position Vector
- ECI Velocity Vector

---

# ☄️ Collision Prediction Engine

Scientific conjunction analysis using propagated orbital states.

Process:

1. Propagate primary object orbit
2. Propagate secondary object orbit
3. Compare ECI vectors over time
4. Find Time of Closest Approach (TCA)
5. Calculate:

- Minimum miss distance
- Relative velocity
- Collision probability

Output:

- Risk level
- Collision probability
- Closest approach time
- Mission impact
- Confidence score

Risk categories:

- Low
- Medium
- High
- Critical

---

# 🧠 AI Prediction Engine

Machine learning assisted collision assessment.

AI Pipeline:

```
SGP4 Conjunction Data

        ↓

Feature Extraction

        ↓

Random Forest Model

        ↓

AI Risk Classification
```

Features used:

- Minimum distance
- Relative velocity
- Collision probability
- Orbital parameters

AI Output:

- Risk prediction
- Confidence score
- Probability estimation
- Explainability information

---

# 🚀 Avoidance Recommendation Engine

AI-assisted maneuver planning.

Uses:

- Collision probability
- Closest approach distance
- Relative velocity
- Time before conjunction

Generates:

- Recommended maneuver
- Delta-V requirement
- Execution timing
- Fuel impact
- Risk reduction estimate

Example:

```json
{
  "optimalManeuver": "Raise orbit",
  "deltaVRequiredMs": 8.7,
  "riskBefore": "Critical",
  "riskAfter": "Medium"
}
```

---

# 📊 Mission Operations Center

Operational dashboard features:

- Collision monitoring
- Live alerts
- Risk analytics
- Mission timeline
- Prediction history
- Decision support
- System health monitoring

---

# 🧾 Mission Audit System

MongoDB-based audit logging.

Tracks:

- Collision predictions
- Risk assessments
- Avoidance recommendations
- Mission events

Features:

- Persistent database storage
- Severity classification
- Event timeline

---

# 📑 Mission Reports

Automated mission reporting system.

Reports include:

- Total predictions
- Risk statistics
- Collision history
- Mission summaries
- Operational analytics

API:

```http
GET /api/collision/reports/summary
```

---

# 🌍 Visualization

Visualization pipeline:

```
SGP4 ECI Coordinates
        |
        ↓
Visualization Adapter
        |
        ↓
Mission Control Interface
```

Features:

- Orbit visualization
- Object tracking
- Collision analysis display
- Digital Twin interface

---

# 🛠️ Technology Stack


## Frontend

- React
- Vite
- Tailwind CSS
- Axios


## Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT


## AI & Scientific Services

- Python
- Flask
- NumPy
- Scikit-learn
- SGP4 Library


## Infrastructure

- Docker
- Docker Compose
- Microservice Architecture


---

# 📁 Project Structure


```text
space-debris-ai-system

├── client/
│   └── React Mission Dashboard
│
├── server/
│   └── Express API Server
│
├── services/
│
│   ├── collision-prediction/
│   │       └── SGP4 + AI Engine
│   │
│   ├── risk-assessment/
│   │       └── Risk Engine
│   │
│   ├── avoidance-recommendation/
│   │       └── Maneuver Engine
│   │
│   └── data-ingestion/
│           └── Orbital Data Service
│
├── docs/
│
└── docker-compose.yml
```

---

# 🚀 Installation

## Clone Repository

```bash
git clone <repository-url>

cd space-debris-ai-system
```

---

# Run With Docker

Recommended:

```bash
docker compose up --build
```

Services:

| Component | Port |
|-|-|
| Frontend | 5173 |
| Backend API | 5000 |
| Data Ingestion | 5001 |
| Collision Prediction | 5002 |
| Risk Assessment | 5003 |
| Avoidance Engine | 5004 |
| MongoDB | 27017 |

---

# Environment Variables

Server `.env`

```env
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
PORT=5000
```

---

# Current Development Status

| Module | Status |
|-|-|
| Authentication | ✅ Complete |
| TLE Sync | ✅ Complete |
| SGP4 Propagation | ✅ Complete |
| Collision Engine | ✅ Complete |
| AI Prediction | ✅ Complete |
| Avoidance Engine | ✅ Complete |
| Audit Logging | ✅ Complete |
| Mission Reports API | ✅ Complete |
| Docker Deployment | ✅ Complete |
| Advanced 3D Visualization | 🚧 Improving |

---

# Future Enhancements

- React Three Fiber Earth visualization
- Space weather integration
- Advanced covariance based Pc model
- Real-time satellite streaming
- Extended ML training datasets

---

# 📜 License

This project is developed for academic research and educational purposes.

---

# 👩‍💻 Author

**Tanvi Sharma**

AI-Powered Space Technology Research Project

---