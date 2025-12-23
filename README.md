# Grindex

Grindex is an activity tracking and social productivity platform. It allows users to track their time, join rooms with shared objectives, view leaderboards, and view others' progress in real-time.

[**Website**](https://grindex.vercel.app/) ·
[**Presentation**](https://grindex-presentation.vercel.app/)


## Local startup instructions

### Prerequisites

- **Docker**
- **Node.js** (v20+)
- **Python** (v3.13+) & `uv` [(install)](https://docs.astral.sh/uv/getting-started/installation/)
- **Local copy of this repository** (via `git clone`)

### 1. Environment setup

**Root (for backend):**
```bash
cp .env.example .env
# edit .env and set secure SECRET_KEY and database credentials
```

**Frontend:**
```bash
cp frontend/.env.example frontend/.env
# default values should work out of the box
```

### 2. Start backend

```bash
docker compose up -d
```

### 3. Start frontend

Run the frontend application locally:

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

### Default URLs

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- WebSocket Server: http://localhost:8001
- Database: localhost:5432


## Running tests

Tests are meant to be run in local environment, not inside Docker containers.

### Main backend (Python)

```bash
cd backend
uv sync
uv run pytest
```

### WebSocket backend (Node.js)

```bash
cd ws-backend
npm install
npm run test
```

### Frontend

```bash
cd frontend
npm install --legacy-peer-deps
npm run test
npm run test:e2e   # or test:e2e:ui for Playwright UI to open
# do not forget to have a running backend for e2e tests
```


## Usage

1. Register a new account or login to an existing one
2. In the dashboard, create one or multiple activities
   - activities have a _resolution_ parameter: it indicates the period of time for which
     the activity time is summarized in charts (day, week, month)
3. Add time logs to the activities or start tracking one of them - a chart will appear
   in the dashboard
4. Switch to the **Rooms** page to create a room and invite friends
5. Inside the room, create objectives to track and map your activities to them
   - this approach provides the most flexible way for users with different personal tracking
     preferences can compare their progress smoothly
6. In **Participants** tab: charts similar to the one in the dashboard
   (but with the room's objectives) will be displayed for each room member
7. In **Leaderboard** tab: a leaderboard for each of the room's objectives is displayed
8. **Killer-feature:** you can see when other room members are tracking their activities
   and view their progress in real-time!


## Project structure

- **`backend/`**: FastAPI (Python) REST API handling core logic, database interactions, and user management
- **`frontend/`**: React (TypeScript) + Vite SPA for the user interface
- **`ws-backend/`**: Node.js + Socket.IO server handling real-time WebSocket connections and events

## Architecture & key decisions

- **Monorepo**: All services are contained in a single repository for simplicity and easier coordination (such as one-shot backend startup)
- **Separation of concerns**:
  - The **REST API** (`backend`) focuses on data persistence and business logic using robust Python tools (FastAPI, SQLAlchemy, Pydantic)
  - The **WebSocket Server** (`ws-backend`) is decoupled to handle the high concurrency of real-time connections independently, using Node.js which excels at I/O-bound tasks
  - The **Frontend** is a modern React application using Redux Toolkit for efficient state management and Vite for a fast development experience
- **Database**: PostgreSQL is the primary source of truth, used by the backend
- **Testing**: A "test pyramid" approach is adopted with _unit_, _integration_, and _e2e_ tests across all services to ensure reliability
