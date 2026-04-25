# TradeScore (Flask API)

Minimal Flask API for lead ingestion and retrieval.

## Requirements

- Python 3.10+
- MongoDB connection string in `MONGO_URI`

## Setup

```bash
pip install -r requirements.txt
```

## Run locally

```bash
python app.py
```

Server starts on `http://localhost:5000` unless `PORT` is set.

## Endpoints

- `GET /health`
- `GET /api/leads`
- `POST /api/leads`

Example `POST /api/leads` payload:

```json
{
  "name": "Jane Doe",
  "phone": "+15551234567",
  "email": "jane@example.com"
}
```

## Production start

`gunicorn app:app`
