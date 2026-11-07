# Placely

Placely is a dedicated campus placement preparation and knowledge-sharing platform that bridges the gap between aspiring students and placed seniors. It enables verified seniors to share authentic round-by-round interview experiences, compensation details, and preparation tips while empowering juniors to browse company archives, ask targeted questions, and consume AI-generated hiring insights.

---

## Features by Role

### Junior
- **Browse & Search**: Explore companies, eligibility requirements, selection patterns, CTC packages, and interview rounds.
- **Read Experiences**: Read comprehensive, round-by-round interview experiences shared by seniors.
- **Bookmarks**: Save important interview experiences for quick reference during placement preparation.
- **Ask Questions**: Post company-specific interview questions on Q&A discussion tabs.
- **AI Summary**: View instant AI-generated synthesis of multiple interview experiences per company.
- **Public Profiles**: Browse seniors' placed companies, credentials, and published experiences.

### Senior
- **Verification Workflow**: Upload proof of placement (offer letter or email screenshot) during registration or re-upload upon rejection.
- **Post Experiences**: Publish detailed placement stories covering preparation strategies, difficulty levels, round descriptions, and tips.
- **Manage Experiences**: Create, edit, and delete personal interview experience posts.
- **Answer Questions**: Provide verified answers to junior questions and earn best-answer recognitions.
- **Profile & Status**: Track proof verification status with live in-app notifications.

### Admin
- **Senior Approvals**: Review uploaded placement proof documents, approve verified seniors, or reject with custom feedback reasons.
- **Company Management**: Create, edit, update eligibility criteria, packages, and manage company listings.
- **Experience Moderation**: Oversee, monitor, and remove inappropriate or policy-violating interview experiences.
- **Platform Analytics**: Monitor platform user distribution, verified counts, and post activity.

---

## Tech Stack

- **Frontend**: React 18, React Router v6, Axios, Vite, Vanilla CSS with custom design system and dark/light themes.
- **Backend**: Node.js, Express.js (REST API architecture).
- **Database**: MongoDB with Mongoose ODM.
- **Authentication & Security**: JSON Web Tokens (JWT), bcryptjs, Helmet, Express Rate Limit, Multer file upload filters, CORS whitelist.
- **AI Integration**: Google Gemini API with automatic Groq (Llama) fallback and MongoDB caching.

---

## AI Feature

Placely features an intelligent company interview summarizer:
- **Engine**: Primary generation powered by Google Gemini API with automated fallback to Groq when quota or rate limits are reached.
- **Cached Architecture**: Summaries are cached in MongoDB with hash signatures of underlying experiences so costly LLM calls only run when new experiences are published or existing ones are modified.
- **Structure**: Generates round breakdowns, common technical and HR themes, difficulty ratings, and high-impact preparation recommendations.

---

## Folder Structure

```
PLACELY/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── api/            # Axios instance and interceptors
│   │   ├── components/     # Reusable UI components (Navbar, Toast, Skeleton, Q&A, etc.)
│   │   ├── context/        # Auth, Theme, and Toast contexts
│   │   ├── hooks/          # Custom hooks (page title, responsive helpers)
│   │   ├── pages/          # Application views & Admin dashboard
│   │   ├── styles/         # Global styles, variables, theme definitions
│   │   ├── App.jsx         # App router and layout
│   │   └── main.jsx        # Entry point
│   ├── .env.example
│   ├── vercel.json
│   └── package.json
├── server/
│   ├── src/
│   │   ├── config/         # Database and third-party configs
│   │   ├── controllers/    # Request handlers for auth, companies, experiences, QA, AI
│   │   ├── middleware/     # Auth, role check, upload, error handler, rate limiters
│   │   ├── models/         # Mongoose schemas (User, Company, Experience, Question, etc.)
│   │   ├── routes/         # Express route definitions
│   │   ├── utils/          # AI providers and helper functions
│   │   └── app.js          # Express app configuration
│   ├── uploads/            # Local document storage for proof validation
│   ├── server.js           # Server bootstrap and database connection
│   ├── .env.example
│   └── package.json
└── README.md
```

---

## Setup Steps

### 1. Backend (Server)

```bash
cd server
npm install
```

Create `.env` inside `server/` (see `server/.env.example`):
```env
PORT
MONGO_URI
JWT_SECRET
JWT_EXPIRES_IN
ADMIN_SIGNUP_CODE
GEMINI_API_KEY
GEMINI_MODEL
GROQ_API_KEY
GROQ_MODEL
CLIENT_URL
```

Run commands:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### 2. Frontend (Client)

```bash
cd client
npm install
```

Create `.env` inside `client/` (see `client/.env.example`):
```env
VITE_API_URL
```

Run commands:
```bash
# Development server
npm run dev

# Production build
npm run build
```

---

## Security Notes

- **JWT Authentication**: Stateless authentication with tokens stored securely on the client and validated on protected endpoints via Authorization Bearer headers.
- **Password Hashing**: Passwords are encrypted using `bcryptjs` with salt rounds prior to persistence.
- **Role-Based Access Control**: Strict `authorizeRoles` middleware guarantees route isolation among juniors, seniors, and administrators.
- **Verification Guard**: Verified middleware restricts interview publishing and senior answering strictly to approved seniors.
- **File Upload Protection**: Multer enforces strict MIME-type whitelisting (PDF, JPEG, PNG), a 5 MB maximum file size limit, and randomized UUID/crypto storage names to prevent path traversal.
- **Rate Limiting & Headers**: `express-rate-limit` prevents brute-force login/signup attacks, `helmet` configures essential HTTP security headers, and JSON request bodies are capped at 100kb.

---

## Screenshots

<!-- Add screenshots below by updating image sources -->
- **Home & Company Directory**: `![Home Page](screenshots/home.png)`
- **Experience View & Round Breakdown**: `![Experience Details](screenshots/experience-detail.png)`
- **AI Placement Insights**: `![AI Summary Card](screenshots/ai-summary.png)`
- **Senior Proof Upload & Admin Review**: `![Admin Verification](screenshots/admin-seniors.png)`
- **Company Q&A Discussion**: `![QA Discussion](screenshots/qa-tab.png)`
- **Light & Dark Theme**: `![Theme Toggle](screenshots/theme-preview.png)`

---

## Future Work

- **Threaded Replies**: Multi-level nested replies and thread discussions on Q&A answers.
- **Advanced Analytics**: Placement trends, package percentiles, and preparation success analytics dashboards.
- **Cloud Proof Storage**: Migration from local disk storage to cloud storage (e.g. AWS S3 or Cloudinary) with signed URLs.
- **Email Notifications**: Transactional emails for proof approval/rejection notices and responses to questions.
