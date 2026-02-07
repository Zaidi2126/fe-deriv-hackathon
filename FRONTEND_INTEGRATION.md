# Frontend integration

This document describes how the frontend demo console integrates with the backend, Slack for daily summary reports, and the Admin (weights and conflicted decisions) APIs.

## Slack daily summary

The **frontend** is responsible for sending the Slack webhook URL to the backend when the user requests a daily summary report.

- **Where:** Metrics tab → “Send daily summary to Slack” section.
- **User flow:** User pastes their Slack Incoming Webhook URL into the text field and clicks **Send report**.
- **Request:** The frontend sends a `POST` request to the backend:
  - **URL:** `{API_BASE}/api/reports/send-daily-summary`
  - **Body:** `{ "slack_webhook_url": "<the URL from the input>" }`
- **Response handling:**
  - **200** → Success; daily summary was sent to Slack.
  - **400** → Missing or invalid webhook URL (e.g. empty or malformed).
  - **404** → No data to report (e.g. no metrics yet).
  - **502** → Backend’s request to Slack failed (e.g. invalid webhook, Slack down).

The frontend does not store or persist the webhook URL; it is sent in the request body only when the user clicks **Send report**.

---

## Admin tab

The **Admin** tab provides:

1. **Signal weights** — GET weights on load and after any change; show all signals (0–100). If `pending_suggestion` exists: "Apply suggestion" (PATCH with `pending_suggestion`) or "Dismiss". Optional manual edit + "Save" (PATCH with only changed keys).
2. **Conflicted decisions list** — GET list; each row shows when, who, system vs human decision, human note, AI explanation, risk score, triggered signals, payout summary, and "Approved for learning" status. "Approve for learning" → POST approve; on 200, optional modal "Apply these weights" then PATCH weights, or refetch weights so the top section shows pending.

When a human overturns a decision, the backend **create review** flow (`POST /api/reviews`) should include a **note** (required or strongly encouraged when overturning). That note is what appears as **human_note** on the Admin conflicted decisions list.

---

## API summary (admin & reviews)

| Purpose | Method | Path | Notes |
|--------|--------|------|--------|
| List conflicted decisions | GET | `/api/admin/conflicted-decisions` | Returns list of overrides with human note, system explanation, etc. |
| Get signal weights | GET | `/api/admin/weights` | Returns `weights` and optional `pending_suggestion`. |
| Apply / update weights | PATCH | `/api/admin/weights` | Body: `weights` and/or `pending_suggestion`. |
| Approve override for learning | POST | `/api/admin/conflicted-decisions/<human_review_id>/approve` | 200 may return `suggested_weights`. 400/404 handled with clear messages. |
| Create human review (overturn) | POST | `/api/reviews` | **Must include `note`** when overturning; this becomes `human_note` on the admin page. |
