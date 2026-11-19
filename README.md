# TaskFlow — Employee Task Dashboard

TaskFlow is an employee task dashboard for teams to assign, organize, and track project work. Admins manage employees and projects, add employees to project workspaces, and assign tasks. Employees can review their assigned work, due dates, priorities, and checklist progress, then move tasks through the workflow. The application is built with React, Express, and PostgreSQL, with separate Admin and Employee roles.

## Features

- Sign up, sign in, sign out, and restore the current session using an HTTP-only JWT cookie.
- First registered account becomes the workspace Admin.
- Admins manage employees, workspace roles, account status, projects, members, and task assignment.
- Employees work inside their assigned projects and tasks, update workflow status, and track checklist progress.
- Disable or re-enable employee accounts and promote/demote team roles from the Admin team panel.
- Create and manage projects, invite existing TaskFlow users by email, manage project membership, and archive or restore projects.
- Create, edit, duplicate, and delete project tasks with a confirmation step.
- Organize tasks across Backlog, To do, In progress, In review, and Done; move cards on the board or use status controls.
- Add assignees, priorities, due dates, labels, checklists, and subtasks.
- Search and filter project tasks; sort by update/creation date, due date, or priority.
- View tasks as a kanban board, list, or deadline calendar.
- Review database-derived project and workspace statistics and upcoming deadlines.
- Update the profile name.
- Enforce project membership and task ownership on the server; passwords are hashed and credentials are not stored in browser storage.

## Technology

- **Frontend:** React 19, Vite, Tailwind CSS v4, Lucide React
- **Backend:** Node.js, Express 5, PostgreSQL
- **Authentication:** bcryptjs password hashing and JWT in HTTP-only cookies
- **Validation and configuration:** server-side request validation, dotenv, environment validation
- **Tests:** Node.js built-in test runner

## Requirements

- Node.js 20.19+ or 22.12+ (required by the installed Vite version)
- npm
- PostgreSQL 18 or a reachable PostgreSQL database

## Local setup

1. Install dependencies in each application directory:

   ```powershell
   cd backend
   npm install
   cd ..\frontend
   npm install
   ```

2. Create `backend/.env` from `backend/.env.example` if it does not already exist. Set `DATABASE_URL` to a PostgreSQL database you can access and replace `JWT_SECRET` with a unique random value of at least 32 bytes. Do not commit `.env`.

   The example defaults target a local PostgreSQL database at `postgresql://postgres@127.0.0.1:5432/taskflow`. Ensure PostgreSQL is running before starting the API. `DATABASE_TEST_URL` is optional for tests that use a database.

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

## Vercel deployment

This repository deploys as two Vercel Services in one project. In Vercel project settings, select **Services** as the project framework. The Services feature may require access to its beta.

- `backend` builds from `backend/` with the Express framework and `src/server.js` entrypoint.
- `frontend` builds from `frontend/` with the Vite framework.
- `/api/(.*)` is routed publicly to `backend`; all other paths are routed to `frontend`.
- The frontend uses the same-origin `/api` path, so there is no service-to-service binding. The browser reaches the backend through the public rewrite.

Set these runtime environment variables for the backend service in Vercel:

- `DATABASE_URL`: a reachable PostgreSQL connection string.
- `JWT_SECRET`: a unique secret with at least 32 bytes.
- `JWT_EXPIRES_IN`: optional; defaults to `1d`.
- `NODE_ENV`: set to `production` for production deployments.
- `FRONTEND_ORIGIN`: optional comma-separated list of allowed HTTPS origins. If omitted, the backend allows the current Vercel deployment URL and the project production URL. Add any custom domains here.

The backend initializes the PostgreSQL schema on its first API request in each runtime instance. The database must allow connections from Vercel and provide the privileges needed by `backend/src/db/schema.sql`.

See [Vercel Services](https://vercel.com/docs/services), [Services routing](https://vercel.com/docs/services/routing), and [Express on Vercel](https://vercel.com/docs/frameworks/backend/express) for platform setup details.
## Environment variables

| Variable | Application | Purpose |
| --- | --- | --- |
| `NODE_ENV` | Backend | Runtime mode; production enables secure cookies. |
| `PORT` | Backend | API listening port (example: `5001`). |
| `DATABASE_URL` | Backend | PostgreSQL connection string for the application. |
| `DATABASE_TEST_URL` | Backend | Optional separate database URI for database-backed tests. |
| `JWT_SECRET` | Backend | Random signing secret, at least 32 bytes; never commit it. |
| `JWT_EXPIRES_IN` | Backend | JWT lifetime such as `1d` or `12h`. |
| `FRONTEND_ORIGIN` | Backend | Exact frontend origin allowed by credentialed CORS. |
| `VITE_API_URL` | Frontend | API base path; defaults to `/api` and uses the Vite development proxy. |

Safe templates are provided in [`backend/.env.example`](./backend/.env.example) and [`frontend/.env.example`](./frontend/.env.example). The root `.gitignore` excludes `.env` files, dependencies, and build output.

## API overview

All application routes are prefixed with `/api`. Authenticated endpoints use the HTTP-only `taskflow_token` cookie.

| Method and path | Purpose |
| --- | --- |
| `GET /health` | API and PostgreSQL readiness. |
| `POST /auth/register`, `POST /auth/login` | Register or authenticate and set the session cookie. |
| `POST /auth/logout`, `GET /auth/me`, `PATCH /auth/me` | End session, restore session, or update the profile. |
| `GET /auth/admin/team`, `POST /auth/admin/employees` | Admin-only team listing and employee creation. |
| `PATCH /auth/admin/team/:memberId` | Admin-only role/status updates for a team member. |
| `GET /tasks`, `POST /tasks`, `GET /tasks/:id`, `PATCH /tasks/:id`, `DELETE /tasks/:id` | Personal task CRUD and filters. |
| `GET /tasks/stats` | Personal task statistics. |
| `GET /projects`, `POST /projects`, `GET /projects/:projectId`, `PATCH /projects/:projectId`, `DELETE /projects/:projectId` | List, create, view, update, archive a project; set `status: "active"` to restore. |
| `GET /projects/stats` | Statistics for projects the current user belongs to. |
| `POST /projects/:projectId/members`, `DELETE /projects/:projectId/members/:memberId` | Owner-managed membership; invited users must already have accounts. |
| `GET /projects/:projectId/tasks`, `POST /projects/:projectId/tasks` | List and create project tasks; supports search, filters, and sorting. |
| `GET /projects/:projectId/tasks/:taskId`, `PATCH /projects/:projectId/tasks/:taskId`, `DELETE /projects/:projectId/tasks/:taskId` | Read, update, and delete a project task. |
| `POST /projects/:projectId/tasks/:taskId/duplicate` | Duplicate a task. |


Errors use a consistent JSON error response. Project task reads and writes are scoped to a project the authenticated user belongs to.

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

The local implementation was also smoke-tested in a browser against the running API: registration/session restoration, project creation, task creation, task details, and the calendar view. Health was checked through the API and the Vite proxy. These checks are not a substitute for testing with multiple real user accounts or a production deployment.

## Current limitations

- Project members must register before an owner can add them; there is no email invitation service.

- Profile avatars use initials; image upload is not implemented.
- Projects are archived and restorable rather than permanently deleted.
- Subtasks are limited to one level.
- The first public registration becomes Admin; later public registrations become Employees.
- Admin-created employees use an initial password that should be changed through a future password-reset feature.

