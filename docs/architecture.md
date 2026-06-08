# HireFlow HRMS — Architecture Overview

---

## System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    HireFlow HRMS Architecture                │
└─────────────────────────────────────────────────────────────┘

  [Browser / Mobile]
         │
         │ HTTPS
         ▼
  ┌──────────────────────────────┐
  │  Next.js Frontend (Vercel)   │
  │  ┌────────────────────────┐  │
  │  │  Firebase Auth Client  │  │◄──► [Firebase Auth]
  │  │  (Login / Token Mgmt)  │  │     (Google Cloud)
  │  └────────────────────────┘  │
  │  ┌────────────────────────┐  │
  │  │   Axios API Client     │──┼──┐
  │  │   (with JWT Bearer)    │  │  │
  │  └────────────────────────┘  │  │
  └──────────────────────────────┘  │
                                    │ REST API (HTTPS)
                                    ▼
  ┌──────────────────────────────────────────────────┐
  │           Express.js API Server (Render)          │
  │                                                   │
  │  ┌─────────────────────────────────────────────┐ │
  │  │          Firebase Admin SDK                  │ │
  │  │    (Verifies JWT tokens on every request)    │ │
  │  └─────────────────────────────────────────────┘ │
  │                                                   │
  │  Routes:                                          │
  │  ├── /api/employees    (CRUD)                     │
  │  ├── /api/attendance   (CRUD + summary)           │
  │  ├── /api/payroll      (CRUD + generate)          │
  │  ├── /api/performance  (CRUD + AI summary)        │
  │  ├── /api/recruitment  (CRUD + apply)             │
  │  └── /api/ai           (4 Claude AI endpoints)    │
  │                                                   │
  │  ┌─────────────────┐  ┌────────────────────────┐ │
  │  │  MongoDB Atlas  │  │   Anthropic Claude API │ │
  │  │  (Data Store)   │  │   (AI Features)        │ │
  │  └─────────────────┘  └────────────────────────┘ │
  └──────────────────────────────────────────────────┘

Data Flow:
1. User logs in via Firebase Auth → receives JWT token
2. Frontend includes JWT in every API request header
3. Express server verifies JWT with Firebase Admin SDK
4. Authorized requests → MongoDB for data operations
5. AI requests → Claude API for intelligent responses
6. Responses flow back to frontend → rendered to user
```

---

## Component Descriptions

### Next.js Frontend (Vercel)
The client is a Next.js 14 application using the App Router. It is responsible for all user-facing pages and UI: dashboards, employee management views, attendance tracking, payroll tables, performance review forms, recruitment boards, and AI feature interfaces. It communicates with Firebase Auth directly for login/logout and token acquisition, then attaches the resulting JWT to all backend API calls via an Axios interceptor.

Key directories:
- `src/app/` — App Router pages and layouts
- `src/components/` — Shared UI components
- `src/context/` — AuthContext providing user state globally
- `src/lib/` — Firebase initialization and Axios API client

### Express.js API Server (Render)
The backend is a Node.js/Express server hosted on Render. It acts as the single source of truth for business logic and data access. Every route is protected by the Firebase Admin SDK middleware, which decodes and verifies the JWT on every request. The server connects to MongoDB Atlas for persistent storage and calls the Anthropic Claude API for AI-powered features.

Key directories:
- `middleware/` — Firebase auth verification
- `models/` — Mongoose schema definitions
- `routes/` — Modular Express routers per domain

### Firebase Auth (Google Cloud)
Firebase Authentication handles user identity. The frontend SDK manages the login flow (email/password) and issues short-lived JWT tokens. The backend Firebase Admin SDK independently verifies these tokens without requiring a round-trip to Firebase on every request — verification is done locally using Firebase's public keys.

### MongoDB Atlas
MongoDB Atlas is the cloud-hosted database. Mongoose is used on the server for schema validation and querying. Each domain (employees, attendance, payroll, performance, recruitment) has its own collection and Mongoose model.

### Anthropic Claude API
The Claude API powers the four AI features via the `/api/ai` route group. Requests are made server-side only — the Anthropic API key is never exposed to the browser. Each AI endpoint constructs a structured prompt from the incoming request data and returns Claude's parsed response to the client.

---

## Data Models Summary

| Model | Collection | Key Fields |
|-------|------------|------------|
| User | users | firebaseUid, email, role, name |
| Employee | employees | employeeId, department, salary, managerId |
| Attendance | attendance | employeeId, date, checkIn, checkOut, status |
| Payroll | payroll | employeeId, month, year, baseSalary, allowances, deductions, netPay |
| Performance | performance | employeeId, reviewerId, period, scores, goals, aiSummary |
| JobPosting | jobpostings | title, department, description, status, applicants[] |

---

## Security Model

### Authentication
All API routes (except `/api/health`) require a valid Firebase JWT token in the `Authorization: Bearer <token>` header. The `middleware/auth.js` file runs `firebaseAdmin.auth().verifyIdToken()` on every request. Invalid or expired tokens receive a `401 Unauthorized` response immediately.

### Authorization
Role-based access control (RBAC) is enforced at the route level. The middleware attaches the decoded user record (including role) to `req.user`. Route handlers check `req.user.role` to determine whether the requesting user is permitted to perform the action (e.g., only Admins and HR can generate payroll; Employees can only view their own records).

### Environment Variables
All sensitive credentials — MongoDB connection string, Firebase service account JSON, and the Anthropic API key — are stored exclusively as environment variables on the server. They are never committed to source control (covered by `.gitignore`) and never sent to or accessed by the frontend.

### CORS
The Express server configures CORS to only allow requests from the production Vercel domain and `localhost:3000` during development, preventing unauthorized cross-origin access.

---

## AI Features Integration

The four Claude AI endpoints follow the same pattern:

1. **Request arrives** at an `/api/ai/*` route, authenticated and authorized.
2. **Prompt construction** — the route handler extracts relevant fields from `req.body` and assembles a structured prompt with clear instructions for Claude.
3. **Claude API call** — the server calls Anthropic's Messages API using the `@anthropic-ai/sdk` package. All calls are made server-side with the `ANTHROPIC_API_KEY` environment variable.
4. **Response parsing** — Claude's text response is parsed (and optionally structured into JSON) before being returned to the client.
5. **Persistence** (where applicable) — for the performance summary endpoint, the AI-generated summary is saved back to the `Performance` document in MongoDB.

| Endpoint | Input | Claude Task | Output |
|----------|-------|-------------|--------|
| `/api/ai/screen-resume` | Resume text + job title | Evaluate candidate fit | Score, strengths, gaps, recommendation |
| `/api/ai/generate-jd` | Job title + key points | Write job description | Full formatted JD |
| `/api/ai/performance-summary` | Metrics + peer feedback | Summarize performance | Narrative review summary |
| `/api/ai/chat` | User message + history | Answer HR questions | Conversational response |
