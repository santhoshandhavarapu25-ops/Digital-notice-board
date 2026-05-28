# Smart Digital Notice Board

A modern full-stack smart notice board for colleges and universities with separate Student and Admin flows, role-based dashboards, JWT authentication, realtime hooks, and a PostgreSQL-ready backend.

## Project Structure

- `client/` - React + Vite frontend with routed auth and dashboards
- `server/` - Express backend with JWT auth, seeded store, and PostgreSQL schema

## Features

- Separate Student and Admin login/register flows
- Public landing page and role selection screen
- Protected dashboards for students and admins
- Notice feed, categories, departments, subscriptions, notifications, and analytics
- Dark/light theme toggle
- Socket.io-backed realtime event hooks
- PostgreSQL schema and in-memory seed fallback for local development

## Getting Started

### 1. Install dependencies

```bash
cd client
npm install

cd ../server
npm install
```

### 2. Configure the backend

Create a `.env` file in `server/` if you want to connect to PostgreSQL:

```env
PORT=5001
JWT_SECRET=dnb-secret
DATABASE_URL=postgresql://user:password@localhost:5432/digital_notices_board
CLIENT_URL=http://localhost:5173
PGSSL=false
```

If `DATABASE_URL` is not set, the backend runs from the in-memory seed store.

### 3. Run the app

Start the backend:

```bash
cd server
npm start
```

Start the frontend:

```bash
cd client
npm run dev
```

## Default Seed Credentials

Admin:

- Email: `admin@nvit.edu`
- Password: `Admin@123`
- College code: `NVIT`

Student:

- Email: `student1@nvit.edu`
- Password: `Student@123`
- College code: `NVIT`

## API Notes

- Health check: `GET /api/health`
- Auth: `POST /api/auth/login`, `POST /api/auth/register`
- Notices: `GET /api/notices`, `GET /api/notices/feed`, `POST /api/notices`
- Categories, departments, subscriptions, notifications, and users are available under `/api/*`

## Database

The PostgreSQL schema is in `server/database/schema.sql`.

## Development Notes

- The frontend currently uses role-aware mock data for the dashboards.
- The backend is already wired to the new shared controller/store layer and can be swapped to a real PostgreSQL repository later without changing the route surface.
