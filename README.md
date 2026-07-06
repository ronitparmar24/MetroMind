# MetroMind

**Intelligent Urban Transit Ticket-Booking Platform** for Gujarat Metro Rail Corporation (GMRC), Ahmedabad.

## Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────────┐
│   React SPA  │────▶│  Node/Express    │────▶│  Django/DRF          │
│   (Vite)     │     │  "Product API"   │     │  "Intelligence API"  │
│   :5173      │     │  :5000           │     │  :8000               │
│              │◀────│  JWT Auth, CRUD  │◀────│  ML Predictions      │
│              │     │  MongoDB         │     │  Analytics, EDA      │
└──────────────┘     └──────────────────┘     └──────────────────────┘
```

### API Gateway Pattern
The React frontend **never calls Django directly**. All requests follow:
`React → Node/Express → Django (server-to-server) → back to React`

- Node handles JWT auth and attaches `userId` before forwarding to Django
- Django's URL/port is never exposed to the browser
- Node persists prediction results into MongoDB (audit trail) before returning

This mirrors how tightly-coupled-but-independently-deployable microservices are organized in companies like Uber/Swiggy (monorepo-per-domain).

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React + Vite | React 18 / Vite 5 |
| Routing | React Router | v6 |
| HTTP Client | Axios | 1.6 |
| Charts | Recharts | 2 |
| Backend Runtime | Node.js | 20 LTS |
| Web Framework | Express | 4 |
| Database | MongoDB + Mongoose | 7 / 8 |
| Auth | JWT (jsonwebtoken) | 9 |
| ML Backend | Django + DRF | 5.0 / 3.15 |
| Data Science | pandas, numpy, scikit-learn | 2.x / 1.26 / 1.4 |
| Visualization | Seaborn, Matplotlib | 0.13 / 3.8 |

## Quick Start

### Prerequisites
- Node.js 20+
- Python 3.11+
- MongoDB running on `localhost:27017`

### Terminal 1 — Frontend
```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

### Terminal 2 — Node Backend
```bash
cd backend-node
npm install
cp .env.example .env   # fill in values
npm run dev             # http://localhost:5000
```

### Terminal 3 — Django Backend
```bash
cd backend-python
python -m venv venv
# Windows: venv\Scripts\activate | Linux/Mac: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python apps/predict/ml/train.py   # ONE-TIME: train ML model
python manage.py runserver 8000   # http://localhost:8000
```

## Retraining the ML Model
```bash
cd backend-python
python apps/predict/ml/train.py
```
This regenerates `model.pkl`, `scaler.pkl`, and `feature_names.json` from the CSV dataset in `data/raw/`.

## Project Structure
```
metromind/
├── frontend/          React (Vite) SPA — port 5173
├── backend-node/      Node.js + Express, "Product API" — port 5000
├── backend-python/    Django + DRF, "Intelligence API" — port 8000
├── .gitignore
├── README.md
└── docker-compose.yml
```

## License
MIT
