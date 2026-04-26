# TradeScore (Flask API + Next.js)

Minimal Flask API for lead ingestion and a Next.js (`web/`) app for the TradeScore product UI.

## Requirements

- Python 3.10+
- MongoDB connection string in `MONGO_URI` (Flask; default `mongodb://localhost:27017/tradeforce`)

## Setup

```bash
pip install -r requirements.txt
```

## Run locally

```bash
python app.py
```

Server starts on `http://localhost:5000` unless `PORT` is set.

## API endpoints (Flask)

- `GET /health` — liveness
- `GET /api/health` — same payload under `/api/*`
- `POST /api/leads` — create a homeowner lead (requires `name`, `phone`, `postcode` among other fields)
- `GET /api/leads/unmatched` — open leads for trades
- `POST /api/tradesman-signup` — tradesperson self-registration; returns a `tradesperson_id` (`TS-` + 6 chars)
- `GET /api/tradesman/<id>/validate` — validate a tradesperson ID
- (Additional routes: bids, email notify, admin metrics, internal webhook, etc. — see `app.py`.)

**Removed (security / cleanup):** the unauthenticated **`GET /api/leads`** route that listed all leads was removed. Do not rely on it in clients or tools.

**Next.js tRPC:** the unused **`chat.getHistory`** procedure was removed; the chat UI uses `chat.sendMessage` and client storage.

## Recent changes

- Removed unauthenticated `GET /api/leads` endpoint (security)
- Removed unused `chat.getHistory` tRPC procedure
- Added `POST /api/tradesman-signup` and `GET /api/tradesman/:id/validate` endpoints

## Example `POST /api/leads` payload

```json
{
  "name": "Jane Doe",
  "phone": "+44 7700 900000",
  "postcode": "G1 1AA",
  "email": "jane@example.com"
}
```

## Production start (Flask)

`gunicorn app:app`

## Next.js app

See `web/README.md` or `package.json` in `web/` for `npm run dev` / `npm run build`.
