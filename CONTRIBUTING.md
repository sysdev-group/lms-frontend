# Contributing Guide

Read this before writing any code.

---

## Branch Naming

```
feature/your-name/what-youre-building
```

Examples:
- `feature/ahmed/course-service`
- `feature/fathu/assignment-list-component`
- `feature/niyaz/attendance-marking`

Never commit directly to `main`. Always branch, always PR.

---

## Workflow

```
1. Pull latest main
   git checkout main && git pull

2. Create your branch
   git checkout -b feature/your-name/module-name

3. Write code
   - Backend: implement StubServices.cs methods, one service at a time
   - Frontend: implement feature-services.ts methods + build the component

4. Commit often with clear messages
   git commit -m "feat: implement CourseService.getCourses with pagination"
   git commit -m "feat: build course list component with search"
   git commit -m "fix: correct null check in enrollment date validation"

5. Push and open a PR
   git push origin feature/your-name/module-name
   → Open PR on GitHub, assign Iyaadh as reviewer

6. Address review comments, then merge
```

---

## Commit Message Format

```
type: short description (under 72 chars)
```

Types: `feat` `fix` `refactor` `docs` `test` `chore`

---

## Backend Rules

**Always follow the worked example in `AuthService.cs` and `AuthController.cs`.**

- Inject `AppDbContext` via constructor — never instantiate it directly
- Always `async`/`await` — never `.Result` or `.Wait()`
- Map to DTOs before returning from service methods — never return domain entities
- Keep methods under ~30 lines — extract private helpers if needed
- XML doc comments on all public methods
- Throw typed exceptions (`UnauthorizedAccessException`, `KeyNotFoundException`, etc.)
  — the middleware maps these to HTTP status codes automatically

```csharp
// ✅ Correct
public async Task<CourseDto> GetByIdAsync(Guid id)
{
    var course = await _db.Courses
        .Include(c => c.Lecturer)
        .FirstOrDefaultAsync(c => c.Id == id)
        ?? throw new KeyNotFoundException($"Course {id} not found.");

    return MapToDto(course);
}

// ❌ Wrong — returns domain entity, uses .Result
public Course GetById(Guid id)
{
    return _db.Courses.FirstOrDefault(c => c.Id == id).Result!;
}
```

---

## Frontend Rules

**Always follow the worked example in `auth.service.ts` and `login.component.ts`.**

- All components are **standalone** — add imports explicitly
- Use **signals** for local UI state — not plain class properties
- Use **reactive forms** for forms with validation
- Never inject `HttpClient` directly — always use `ApiService`
- Never call `.subscribe()` in a service — only in components
- Handle errors in `subscribe({ error: ... })` — `errorInterceptor` shows the snackbar automatically

```typescript
// ✅ Correct — component handles subscription
ngOnInit() {
  this.isLoading.set(true);
  this.courseService.getCourses().subscribe({
    next: result => { this.courses.set(result.items); this.isLoading.set(false); },
    error: () => this.isLoading.set(false),
  });
}

// ❌ Wrong — subscribing in service, blocking call
getCourses() {
  let result: Course[] = [];
  this.http.get('/courses').subscribe(r => result = r as Course[]);
  return result;
}
```

---

## Code Review Checklist (Reviewer — Iyaadh)

Before approving a PR, verify:

- [ ] Does it build without errors?
- [ ] Does it follow the layer boundaries (no cross-layer shortcuts)?
- [ ] Are all new methods documented with XML/JSDoc comments?
- [ ] Are there no hardcoded strings that belong in config/env?
- [ ] Backend: are DTOs returned, not domain entities?
- [ ] Frontend: is HttpClient avoided in favour of ApiService?
- [ ] Frontend: are signals used for local state?
- [ ] No `.Result` / `.Wait()` calls anywhere

---

## Questions?

Ask Iyaadh on the group chat. Don't guess — wrong patterns spread fast.
