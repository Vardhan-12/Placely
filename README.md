<div align="center">

# Placely

### Learn from seniors who cracked it. Prepare for your campus placements with real, verified experiences.

**Built by [Bala Vardhan Utla](<your-github-link>)** · B.Tech CSE, Lovely Professional University

![React](https://img.shields.io/badge/React-Vite-2563EB?style=flat-square&logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-102A43?style=flat-square&logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-06B6D4?style=flat-square&logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-2563EB?style=flat-square)
![AI](https://img.shields.io/badge/AI-Gemini%20%2B%20Groq-102A43?style=flat-square)

[Live Demo](<your-vercel-link>) · [Report a Bug](<your-repo-link>/issues)

</div>

---

## About

Campus placements repeat every year: the same companies visit with similar rounds, yet the knowledge lives in scattered WhatsApp groups and disappears when seniors graduate.

**Placely** is a placement experience portal where **verified seniors** share company-wise interview experiences, and **juniors** read them, ask questions, and prepare with real data. Seniors prove their placement with an offer document, an admin reviews it, and only then can they post. That keeps the content trustworthy.

## Developer

**Bala Vardhan Utla**
B.Tech Computer Science and Engineering, Lovely Professional University

- GitHub: `<your-github-link>`
- LinkedIn: `<your-linkedin-link>`

Designed, built, tested and deployed end to end as a full-stack MERN project.

## Features

### Junior (student)
- Browse companies with search, filters and sorting
- Read round-by-round interview experiences with difficulty, topics, tips and mistakes
- Upvote and bookmark experiences
- Ask company-specific questions, and mark the best answer
- Generate an AI summary of a company's experiences

### Senior (placed student)
- Sign up with placement proof (PDF, JPG or PNG)
- Get notified when verified or rejected, and re-upload proof if rejected
- Post experiences with dynamic rounds, optionally anonymously
- Manage posts in **My Posts** (edit, delete)
- Answer juniors' questions from a **Questions for Me** inbox

### Admin
- Review pending seniors, view their proof, approve, or reject with a reason
- Add, edit and delete companies and their rounds
- Moderate experiences and see platform statistics
- Receive notifications for new verification requests

## Highlights

| | |
|---|---|
| **Proof-based verification** | Seniors are approved only after an admin reviews their document |
| **In-app notifications** | Bell with unread count for verification updates and requests |
| **Anonymous posting** | The author's identity is hidden on the server, not only in the UI |
| **AI company summary** | Gemini summarizes common rounds, topics, tips and mistakes, with a Groq fallback and database caching |
| **Dark and light theme** | Saved preference, follows the system default |
| **Live refresh** | Status and lists refresh on focus and on an interval, so there is no need to log in again |

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), React Router, Axios, plain CSS with design tokens |
| Backend | Node.js, Express |
| Database | MongoDB Atlas with Mongoose |
| Authentication | JWT, bcrypt, role-based middleware (junior, senior, admin) |
| File uploads | Multer with type and size validation |
| AI | Google Gemini (primary), Groq (fallback), cached summaries |
| Security | Helmet, rate limiting, CORS allow-list |

## Architecture

```
placely/
├── client/                 React app
│   └── src/
│       ├── api/            Axios instance
│       ├── components/     Navbar, bell, tabs, shared UI
│       ├── context/        Auth and theme providers
│       ├── hooks/          Auto-refresh hook
│       ├── pages/          Home, Companies, Experiences, Admin, Profile
│       └── styles/         Design tokens and page styles
└── server/                 Express API
    └── src/
        ├── config/         Database connection
        ├── controllers/    Request logic
        ├── middleware/     Auth, roles, uploads, errors
        ├── models/         Mongoose schemas
        ├── routes/         URL definitions
        └── services/       AI provider calls
```

**Request flow:** React → Axios → Express → middleware (auth, role, validation) → controller → Mongoose → MongoDB

## Getting Started

### Prerequisites
- Node.js 18 or later
- A MongoDB Atlas cluster (free tier is enough)
- Optional: a Gemini API key and a Groq API key for the AI summary

### Run locally

```bash
# 1. Clone
git clone <your-repo-link>
cd placely

# 2. Backend
cd server
npm install
cp .env.example .env      # then fill in your own values
npm run dev

# 3. Frontend (new terminal)
cd client
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and proxies `/api` to the backend on port 5000.

### Environment variables

**server/.env**

| Name | Purpose |
|---|---|
| `PORT` | Server port |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret used to sign tokens |
| `JWT_EXPIRES_IN` | Token lifetime, for example `7d` |
| `ADMIN_SIGNUP_CODE` | Invite code required to create an admin account |
| `CLIENT_URL` | Allowed frontend origin(s) for CORS |
| `GEMINI_API_KEY` | Gemini API key |
| `GEMINI_MODEL` | Primary Gemini model name |
| `GEMINI_FALLBACK_MODEL` | Lighter Gemini model used if the primary is busy |
| `GROQ_API_KEY` | Groq API key (second fallback) |
| `GROQ_MODEL` | Groq model name |

**client/.env**

| Name | Purpose |
|---|---|
| `VITE_API_URL` | Backend API base URL in production |

> Never commit `.env` files. Only `.env.example` files with empty values belong in the repository.

## Security

- Passwords are hashed with **bcrypt** before storage and never returned
- **JWT** authentication; the user is re-loaded from the database on every protected request
- **Role middleware** separates junior, senior and admin actions
- Admin accounts can only be created with a server-side **invite code**
- Placement proofs are validated for type and size, stored under random names, and viewable only by admins
- Anonymous authors are hidden by the API itself
- **Helmet**, request size limits, and **rate limiting** on login and signup
- Secrets live only in environment variables

## Screenshots

| Home | Companies |
|---|---|
| `<add screenshot>` | `<add screenshot>` |

| Experience | AI Insights |
|---|---|
| `<add screenshot>` | `<add screenshot>` |

| Admin Dashboard | Dark Mode |
|---|---|
| `<add screenshot>` | `<add screenshot>` |

## Future Work

- Threaded replies in Q&A
- Analytics charts per company (result split, difficulty, topic frequency)
- Cloud storage for placement proofs
- Email notifications
- Sign in with Google restricted to college email domains

## Credits

Created by **Bala Vardhan Utla** as a full-stack MERN project at Lovely Professional University.
Demo data in screenshots is sample data and does not represent real students.