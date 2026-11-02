# Placely

A placement experience portal for LPU students where verified seniors share company-wise placement experiences and juniors can read them and ask questions.

## Tech Stack
- **Backend**: Node.js, Express, MongoDB (Mongoose)

## Getting Started

### 1. Install dependencies
```bash
cd server
npm install
```

### 2. Configure environment
```bash
# Copy the example env file
cp .env.example .env
# Then open .env and fill in your MongoDB Atlas URI
```

### 3. Run the server

**Development (with auto-restart):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The server runs on `http://localhost:5000` by default.

### 4. Verify it's working
```
GET http://localhost:5000/api/health
```
Expected response:
```json
{ "status": "ok", "message": "Placely API running" }
```
