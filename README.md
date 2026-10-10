# TaskFlow

TaskFlow is a team-oriented task and project management application built with React, Express, and MongoDB. It provides cookie-based authentication, project workspaces, task workflows, team assignments, and a responsive dashboard backed by the API.

## Features

- Sign up, sign in, sign out, and restore the current session using an HTTP-only JWT cookie.
- Create and manage projects, invite existing TaskFlow users by email, manage project membership, and archive or restore projects.
- Create, edit, duplicate, and delete project tasks with a confirmation step.
- Organize tasks across Backlog, To do, In progress, In review, and Done; move cards on the board or use status controls.
- Add assignees, priorities, due dates, labels, checklists, subtasks, comments, and activity history.
- Search and filter project tasks; sort by update/creation date, due date, or priority.
- View tasks as a kanban board, list, or deadline calendar.
- Review database-derived project and workspace statistics, upcoming deadlines, and in-app notifications.
- Update the profile name and notification preferences.
- Enforce project membership and task ownership on the server; passwords are hashed and credentials are not stored in browser storage.

## Technology

- **Frontend:** React 19, Vite, Tailwind CSS v4, Lucide React
- **Backend:** Node.js, Express 5, Mongoose
- **Authentication:** bcryptjs password hashing and JWT in HTTP-only cookies
- **Validation and configuration:** server-side request validation, dotenv, environment validation
- **Tests:** Node.js built-in test runner

## Requirements

- Node.js 20.19+ or 22.12+ (required by the installed Vite version)
- npm
- MongoDB, either a local server or a reachable MongoDB URI

## Local setup

1. Install dependencies in each application directory:

   ```powershell
   cd backend
   npm install
   cd ..\frontend
   npm install
   ```

2. Create `backend/.env` from `backend/.env.example` if it does not already exist. Set `MONGODB_URI` to a database you can access and replace `JWT_SECRET` with a unique random value of at least 32 bytes. Do not commit `.env`.

   The example defaults target a local MongoDB database at `mongodb://127.0.0.1:27017/taskflow`. Ensure MongoDB is running before starting the API. `MONGODB_TEST_URI` is optional for tests that use a database.

3. The frontend defaults to the Vite `/api` proxy, which forwards requests to `http://localhost:5001`. This matches the backend example port. If using a different API URL, set `VITE_API_URL` in `frontend/.env` (for example `VITE_API_URL=http://localhost:5001/api`) and set `FRONTEND_ORIGIN` in the backend environment to the exact frontend origin.

4. Start the backend and frontend in separate terminals:

   ```powershell
   # Terminal 1
   cd backend
   npm run dev
   ```

   ```powershell
   # Terminal 2
   cd frontend
   npm run dev
   ```

5. Open <http://localhost:5173>. The API health endpoint is <http://localhost:5001/api/health>.

## Environment variables

| Variable | Application | Purpose |
| --- | --- | --- |
| `NODE_ENV` | Backend | Runtime mode; production enables secure cookies. |
| `PORT` | Backend | API listening port (example: `5001`). |
| `MONGODB_URI` | Backend | MongoDB connection string for the application. |
| `MONGODB_TEST_URI` | Backend | Optional separate database URI for database-backed tests. |
| `JWT_SECRET` | Backend | Random signing secret, at least 32 bytes; never commit it. |
| `JWT_EXPIRES_IN` | Backend | JWT lifetime such as `1d` or `12h`. |
| `FRONTEND_ORIGIN` | Backend | Exact frontend origin allowed by credentialed CORS. |
| `VITE_API_URL` | Frontend | API base path; defaults to `/api` and uses the Vite development proxy. |

Safe templates are provided in [`backend/.env.example`](./backend/.env.example) and [`frontend/.env.example`](./frontend/.env.example). The root `.gitignore` excludes `.env` files, dependencies, and build output.

## API overview

All application routes are prefixed with `/api`. Authenticated endpoints use the HTTP-only `taskflow_token` cookie.

| Method and path | Purpose |
| --- | --- |
| `GET /health` | API and MongoDB readiness. |
| `POST /auth/register`, `POST /auth/login` | Register or authenticate and set the session cookie. |
| `POST /auth/logout`, `GET /auth/me`, `PATCH /auth/me` | End session, restore session, or update profile/preferences. |
| `GET /auth/notifications`, `PATCH /auth/notifications/read` | List the signed-in user's notifications and mark them read. |
| `GET /tasks`, `POST /tasks`, `GET /tasks/:id`, `PATCH /tasks/:id`, `DELETE /tasks/:id` | Personal task CRUD and filters. |
| `GET /tasks/stats` | Personal task statistics. |
| `GET /projects`, `POST /projects`, `GET /projects/:projectId`, `PATCH /projects/:projectId`, `DELETE /projects/:projectId` | List, create, view, update, archive a project; set `status: "active"` to restore. |
| `GET /projects/stats` | Statistics for projects the current user belongs to. |
| `POST /projects/:projectId/members`, `DELETE /projects/:projectId/members/:memberId` | Owner-managed membership; invited users must already have accounts. |
| `GET /projects/:projectId/tasks`, `POST /projects/:projectId/tasks` | List and create project tasks; supports search, filters, and sorting. |
| `GET /projects/:projectId/tasks/:taskId`, `PATCH /projects/:projectId/tasks/:taskId`, `DELETE /projects/:projectId/tasks/:taskId` | Read, update, and delete a project task. |
| `POST /projects/:projectId/tasks/:taskId/duplicate` | Duplicate a task. |
| `POST /projects/:projectId/tasks/:taskId/comments` | Add a comment and activity entry. |

Errors use a consistent `{ "error": { "code": "...", "message": "..." } }` response. Project task reads and writes are scoped to a project the authenticated user belongs to.

## Checks and verification

Run from the corresponding directory:

```powershell
# backend
npm test

# frontend
npm run lint
npm run build
```

The automated backend suite covers configuration and validation, authentication requirements, user-scoped task operations and statistics, project membership scoping, and archived-project mutation behavior.

The local implementation was also smoke-tested in a browser against the running API: registration/session restoration, project creation, task creation, task details, comment submission, and the calendar view. Health was checked through the API and the Vite proxy. These checks are not a substitute for testing with multiple real user accounts or a production deployment.

## Current limitations

- Project members must register before an owner can add them; there is no email invitation service.
- Notifications are in-app and periodically refreshed; no email delivery or push/WebSocket realtime transport is configured.
- Profile avatars use initials; image upload is not implemented.
- Projects are archived and restorable rather than permanently deleted.
- Subtasks are limited to one level.

## AI Development Experience

**AI tool used: Code0.**

Code0 assisted during development as a coding and problem-solving tool. I used it to explore the existing codebase, implement and refine features, investigate errors, and run through verification steps. I reviewed and tested the resulting changes rather than treating generated output as automatically correct.

Specific tasks where Code0 helped:

1. Developing reusable React components and refining the responsive dashboard, task views, forms, and dialogs.
2. Building Express API routes and connecting project, membership, task, and notification workflows to MongoDB.
3. Debugging authentication/session handling, API integration issues, and project/task access rules.
4. Adding backend tests for request validation, task ownership, project membership scoping, and archived-project behavior.
5. Improving setup documentation and checking the frontend lint/build and backend test workflows.
