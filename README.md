# LMS Frontend — Angular 17

Modern Modular Learning Management System — frontend built with Angular 17 (standalone components), Angular Material, and Tailwind CSS.

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Docker Desktop | Latest | Required for docker-compose setup |
| Node.js | 20+ | Only needed if running without Docker |
| npm | 9+ | Comes with Node.js |

---

## Running (Docker — Recommended)

Start from the `lms-backend` repo — docker-compose starts the frontend automatically:

```bash
cd ../lms-backend
docker-compose up
```

Frontend available at: **http://localhost:4200**

Hot reload is enabled — save a file and the browser refreshes automatically.

---

## Running without Docker

```bash
npm install
npm start
# App runs at http://localhost:4200
# API must be running at http://localhost:5001
```

---

## Project Structure

```
src/app/
  core/                   # Singleton services, guards, interceptors
    auth/                 # AuthService, authGuard, roleGuard
    interceptors/         # authInterceptor (token + 401 refresh), errorInterceptor
    services/             # ApiService (HTTP wrapper), feature services
  shared/                 # Reusable across features
    components/shell/     # Sidebar + navbar layout
    models/               # TypeScript interfaces matching all backend DTOs
  features/               # One folder per module
    auth/                 # Login, forgot-password
    dashboard/            # Role-aware dashboard
    courses/              # Course list + detail
    assignments/          # Assignment list + detail + submission
    grades/               # Grade viewer
    users/                # Admin user management
    timetable/            # Weekly schedule
    attendance/           # Attendance recording and summary
    notifications/        # Notification inbox
    enrollment/           # Admin enrollment management
```

---

## Implementing Your Module

1. Find your feature service in `src/app/core/services/feature-services.ts`
2. Move it to its own file (e.g. `course.service.ts`)
3. Replace `throw new Error(...)` with a real `this.api.get/post/put/delete` call
4. Find your stub component (e.g. `course-list.component.ts`)
5. Inject your service and build the UI

**The worked example is `auth.service.ts` and `login/login.component.ts` — read these first.**

---

## Patterns to Follow

```typescript
// Calling the API
getCourses(): Observable<Course[]> {
  return this.api.get<Course[]>('/courses');
}

// In a component
ngOnInit() {
  this.courseService.getCourses().subscribe({
    next: courses => this.courses.set(courses),
    error: () => {}  // errorInterceptor handles the snackbar automatically
  });
}

// Local state — always use signals
isLoading = signal(false);
courses = signal<Course[]>([]);
```

---

## Code Standards

- All components are **standalone** — add imports explicitly, no shared module
- Use **signals** for local state — not plain properties
- Use **reactive forms** for any form with validation
- Never call HttpClient directly — always use `ApiService`
- Branch naming: `feature/your-name/module-name`
- Open a PR when done — lead reviews before merge to `main`
