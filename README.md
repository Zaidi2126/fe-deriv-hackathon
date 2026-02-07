# AI Payments Approval & Fraud Intelligence — Frontend Demo

Demo console for a fintech fraud and payments approval system. This React app visualizes decisions, risk trajectory, fraud-readiness simulations, and metrics from a Django backend.

## Tech

- React 19 + Vite 7 + TypeScript
- Tailwind CSS, Axios
- No authentication; backend base URL configurable via env

## How to run

1. **Backend** must be running and reachable (see backend repo). Set base URL if needed:
   ```bash
   # optional; default is http://127.0.0.1:8000
   echo "VITE_API_BASE_URL=http://127.0.0.1:8000" > .env
   ```
2. **Install and start frontend:**
   ```bash
   npm install
   npm run dev
   ```
3. Open **http://localhost:5173**

## Required backend endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Health check |
| POST | `/api/payouts/decision` | Single payout decision |
| GET | `/api/users/<user_id>/risk-trajectory?days=7\|14\|30` | Risk trajectory over time |
| POST | `/api/fraud-readiness/simulate` | Fraud readiness scenario simulation |
| GET | `/api/metrics/daily` | Daily metrics list |
| GET | `/api/metrics/calibration` | Calibration stats list |

## Demo script (~60 seconds)

Use this order to run the full demo in about a minute.

1. **Decision Simulator**
   - Click **Clean Approve** (Quick Fill), then **Get decision**.
   - Click **Geo VPN Anomaly**, then **Get decision** (or run 2 presets of your choice).

2. **Risk Trajectory**
   - Open the **Risk Trajectory** tab.
   - Keep `demo_user_0_0` (or use another seeded user), click **Load trajectory**.
   - Check chart and “Last 10 points” table.

3. **Fraud Readiness**
   - Open the **Fraud Readiness** tab.
   - Click **Run simulation** (all scenarios selected).
   - Review result cards per pattern.

4. **Metrics**
   - Open the **Metrics** tab.
   - Tables auto-load; use **Refresh metrics** if needed.
   - Confirm Daily Metrics and Calibration Stats tables.

## Demo Mode panel

In the app, open the **Demo Mode** panel (under the header) for copy-paste commands to start backend and frontend and links to the app and backend health.
