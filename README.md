# HireFlow HRMS

**AI-Powered Human Resource Management System**

HireFlow is a modern HRMS platform built with Next.js 14 and Express.js, featuring deep Claude AI integration for resume screening, job description generation, performance summaries, and an intelligent HR chatbot. It provides a full-featured suite for managing employees, attendance, payroll, performance reviews, and recruitment — all in one platform.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router) |
| Backend | Express.js (Node.js) |
| Database | MongoDB Atlas |
| Authentication | Firebase Auth |
| AI | Anthropic Claude API |
| Styling | TailwindCSS |
| Charts | Recharts |

---

## Prerequisites

Before you begin, ensure you have the following:

- **Node.js 18+** installed
- A **MongoDB Atlas** account with a cluster and connection string
- A **Firebase project** with Authentication enabled (Email/Password)
- An **Anthropic API key** for Claude AI features

---

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/hireflow-hrms.git
   cd hireflow-hrms
   ```

2. **Setup the server**
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Open .env and fill in your MongoDB URI, Firebase credentials, and Anthropic API key
   ```

3. **Setup the client**
   ```bash
   cd ../client
   npm install
   cp .env.example .env
   # Open .env and fill in your Firebase client config and backend API URL
   ```

4. **Seed the database**
   ```bash
   cd ../server
   node seed.js
   ```

5. **Start the server**
   ```bash
   npm run dev
   # Server runs on http://localhost:5000
   ```

6. **Start the client**
   ```bash
   cd ../client
   npm run dev
   # Client runs on http://localhost:3000
   ```

---

## Demo Accounts

After running the seed script, the following accounts are available:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hireflow.com | demo1234 |
| Manager | manager@hireflow.com | demo1234 |
| HR | hr@hireflow.com | demo1234 |
| Employee | employee@hireflow.com | demo1234 |

---

## API Endpoints

### Core Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Health check |
| GET | /api/users/me | Get current user |

### Employees

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/employees | List all employees |
| POST | /api/employees | Create employee |
| GET | /api/employees/stats | Employee statistics |

### Attendance

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/attendance | List attendance records |
| POST | /api/attendance | Mark attendance |

### Payroll

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/payroll | List payroll records |
| POST | /api/payroll/generate | Generate monthly payroll |

### Performance

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/performance | List performance reviews |
| POST | /api/performance | Create review |

### Recruitment

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/recruitment | List job postings |
| POST | /api/recruitment | Create job posting |

### AI Features

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/ai/screen-resume | AI resume screening |
| POST | /api/ai/generate-jd | AI job description generator |
| POST | /api/ai/performance-summary | AI performance summary |
| POST | /api/ai/chat | HR chatbot |

---

## AI Features

HireFlow integrates Anthropic's Claude API to bring intelligent automation to four key HR workflows:

### 1. Resume Screener (`POST /api/ai/screen-resume`)
Paste a candidate's resume text and the target job title. Claude analyzes the resume against the role requirements and returns a structured evaluation: a match score, key strengths, gaps, and a hiring recommendation. Saves hours of manual screening per role.

### 2. Job Description Generator (`POST /api/ai/generate-jd`)
Provide a job title and a few bullet points about the role, and Claude generates a complete, professionally written job description — including responsibilities, requirements, preferred qualifications, and company culture notes. Ready to post immediately.

### 3. Performance Summary (`POST /api/ai/performance-summary`)
Feed in an employee's performance metrics (scores, goals, KPIs, peer feedback) and Claude produces a concise, balanced narrative summary suitable for annual reviews and HR records. Reduces manager writing time and improves consistency across reviews.

### 4. HR Chatbot (`POST /api/ai/chat`)
An always-on HR assistant that can answer employee questions about policies, benefits, leave entitlements, and HR processes. Maintains conversation context and provides accurate, policy-aligned responses to reduce routine HR query volume.

---

## Deployment

### Frontend — Vercel

1. Push your repository to GitHub.
2. Import the project into [Vercel](https://vercel.com).
3. Set the **Root Directory** to `client`.
4. Add all environment variables from `client/.env.example` in the Vercel dashboard.
5. Deploy. Vercel auto-deploys on every push to `main`.

### Backend — Render

1. Create a new **Web Service** on [Render](https://render.com).
2. Connect your GitHub repository.
3. Set the **Root Directory** to `server`.
4. Set the **Build Command** to `npm install`.
5. Set the **Start Command** to `npm start`.
6. Add all environment variables from `server/.env.example` in the Render dashboard.
7. Deploy. Render provides a public HTTPS URL for your API.

> **Note:** Update `NEXT_PUBLIC_API_URL` in your Vercel environment variables to point to your Render backend URL once it is deployed.

---

## License

MIT
