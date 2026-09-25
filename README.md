# Alredwan-courses-center

## Standard Branch Naming

```php-template
feature/<short_description>
fix/<short_description>
docs/<short_description>
```

example:

```php-template
feature/add-student-attendance
fix/fix-enrollment-logic
docs/update-api-endpoints
```

## Useful Docker Commands

This section provides a comprehensive guide for managing the project via Docker. You can choose to run the entire application stacked together, or run the frontend and backend services separately.

---

### 1. Running the Entire Application (Frontend & Backend)

#### Development Mode (With Live-Reload / Hot-Reload)

- **Build and Start:**
  ```bash
  docker compose -f docker-compose.dev.yml up --build
  ```
- **Start (Without Rebuilding):**
  ```bash
  docker compose -f docker-compose.dev.yml up
  ```
- **Start in Background (Detached):**
  ```bash
  docker compose -f docker-compose.dev.yml up -d
  ```

#### Production Mode

- **Build and Start:**
  ```bash
  docker compose up --build
  ```
- **Start:**
  ```bash
  docker compose up -d
  ```

---

### 2. Running Backend & Frontend Separately

If you are only working on one part of the stack, you can run services independently to save system resources.

#### Running Backend Only (with DB & Redis dependencies)

- **Using root dev compose:**
  ```bash
  docker compose -f docker-compose.dev.yml up --build redwan-backend
  ```
- **Using backend-specific compose:**
  ```bash
  docker compose -f backend/docker-compose.yml up --build
  ```

#### Running Frontend Only

- **Using root dev compose (without starting backend automatically):**
  ```bash
  docker compose -f docker-compose.dev.yml up --no-deps --build redwan-frontend
  ```
- **Using frontend-specific compose:**
  ```bash
  docker compose -f frontend/docker-compose.yml up --build
  ```

---

### 3. Running Commands Inside the Backend Container

Use these commands while the backend container (`redwan-backend-dev`) is running:

- **Create Superuser:**

  ```bash
  docker compose -f docker-compose.dev.yml exec redwan-backend python manage.py createsuperuser
  ```

- **Apply Database Migrations:**
  ```bash
  docker compose -f docker-compose.dev.yml exec redwan-backend python manage.py migrate
  ```
- **Create New Migrations:**
  ```bash
  docker compose -f docker-compose.dev.yml exec redwan-backend python manage.py makemigrations
  ```
- **Seed Database:**
  ```bash
  docker compose -f docker-compose.dev.yml exec redwan-backend python manage.py seed_db
  ```
- **Create Django Superuser:**
  ```bash
  docker compose -f docker-compose.dev.yml exec redwan-backend python manage.py createsuperuser
  ```
- **Open Django Shell:**
  ```bash
  docker compose -f docker-compose.dev.yml exec redwan-backend python manage.py shell
  ```

---

### 4. Stopping and Cleanup

- **Soft Stop (Stops containers, keeps data intact):**
  ```bash
  docker compose -f docker-compose.dev.yml down
  ```
- **Hard Stop & Clean (Deletes database volumes, resetting the DB):**
  ```bash
  docker compose -f docker-compose.dev.yml down -v
  ```
- **Force Rebuild & Clean Containers:**
  ```bash
  docker compose -f docker-compose.dev.yml down && \
  docker rmi -f alredwan-courses-center-redwan-frontend alredwan-courses-center-redwan-backend && \
  docker compose -f docker-compose.dev.yml up -d --build
  ```

---

### 5. Quick Commands Cheat Sheet

| Action                  | Command                                                                                         |
| :---------------------- | :---------------------------------------------------------------------------------------------- |
| **Start Dev Stack**     | `docker compose -f docker-compose.dev.yml up --build`                                           |
| **Stop Dev Stack**      | `docker compose -f docker-compose.dev.yml down`                                                 |
| **Reset DB & Stack**    | `docker compose -f docker-compose.dev.yml down -v`                                              |
| **Backend Only**        | `docker compose -f docker-compose.dev.yml up redwan-backend`                                    |
| **Frontend Only**       | `docker compose -f docker-compose.dev.yml up --no-deps redwan-frontend`                         |
| **Create Superuser**    | `docker compose -f docker-compose.dev.yml exec redwan-backend python manage.py createsuperuser` |
| **Run Migrations**      | `docker compose -f docker-compose.dev.yml exec redwan-backend python manage.py migrate`         |
| **Seed Database**       | `docker compose -f docker-compose.dev.yml exec redwan-backend python manage.py seed_db`         |
| **Clean Docker System** | `docker system prune -a --volumes`                                                              |
