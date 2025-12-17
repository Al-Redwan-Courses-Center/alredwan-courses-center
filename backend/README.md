# Back-end of the onsite web application of Redwan Courses Center


## Don't forget to use: `pip3 install -r requirements.txt` to install the required packages, and `pip3 freeze > requirements.txt` to update the requirements file.

## Don't Migrate until all the models are ready.

```bash
docker build --tag django-backend .
docker run -d -p 8000:8000 django-backend
```
[cleaning docker images](https://www.hostinger.com/tutorials/docker-cheat-sheet?utm_campaign=Generic-Tutorials-DSA-t5|NT:Se|Lang:EN|LO:AE-Tier1&utm_medium=ppc&gad_source=1&gad_campaignid=20502237566&gclid=Cj0KCQiAgP_JBhD-ARIsANpEMxznXJ5bAcKd-_eF-YhtUQnvlhHGiLgR7e5qqycL2vQqgGrUr1MJmQIaAn3-EALw_wcB)

Stop all running containers:
```bash
docker stop $(docker ps -q)
docker rm $(docker ps -a -q --filter "status=exited")
docker image prune -a
docker rmi -f $(docker images -a -q)
```

Example Workflow

```bash

# Start your containers (if they're not already running):
docker compose up -d  # Starts the services in detached mode

# Run makemigrations:

docker compose exec app python3 manage.py makemigrations


#Apply migrations:

docker compose exec app python3 manage.py migrate

# Create a superuser (optional):
docker compose exec app python3 manage.py createsuperuser
```



## Installation
* ### 1. **Clone the repository**:
   ```bash
   git clone https://github.com/eyadfattah23/critics-spot.git
   cd critics-spot
   ```

* ### 2. **install python3 and pip3 if not already installed**:
    ```bash
    sudo apt install -y software-properties-common
    sudo add-apt-repository -y ppa:deadsnakes/ppa
    sudo apt update
    sudo apt install -y python3.10 python3.10-venv python3.10-dev

    python3 --version
    ```
* ### 3. **install and setup postgresql-14 if not already installed**:
    ```bash
    sudo apt update
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
    echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" | sudo tee /etc/apt/sources.list.d/postgresql-pgdg.list > /dev/null
    sudo apt update
    sudo apt install postgresql-14
    sudo apt install postgresql postgresql-contrib
    sudo service postgresql start
    ```
* ### 4. **prepare the databases**:
    ```bash
    ./database_creation.sh
    ```
    **if `FATAL: Peer authentication failed for user "postgres"` arises refer to this [link](https://stackoverflow.com/questions/18664074/getting-error-peer-authentication-failed-for-user-postgres-when-trying-to-ge) and [this one](https://stackoverflow.com/questions/18664074/getting-error-peer-authentication-failed-for-user-postgres-when-trying-to-ge)**

* ### 5. **Set up a virtual environment**:
   ```bash
   apt install python3-venv
   python3.10 -m venv venv
   source venv/bin/activate
   ```

* ### 6. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

* ### 7. **migrate the tables**:
   ```bash
   python3.10 manage.py makemigrations
   python3.10 manage.py migrate
   ```
   if any error is encountered delete all migrations using the following command:
   `find . -path "*/migrations/*.py" ! -path "./.env/*" ! -name "__init__.py" -delete`.

   [then migrate the tables again.](#7-migrate-the-tables)

* ### 8. **Create a superuser**:
    ```bash
        python manage.py createsuperuser
    ```
and enter your credentials for this superuser/admin account.
* ### 9. **Start the development server**:
   ```bash
   python3.10 manage.py runserver;
   ```



later:

Add a boolean is_phone_verified.

Add a verification code model linked to CustomUser.

Use a library like django-phonenumber-field

Add a signal to notify the primary parent when a new link request is made.



Tests / checklist
Create a course and schedule several lectures (past, today, future).

Create an enrollment for a child:

Enrollment created before a future lecture → attendance rows created for that lecture.

Enrollment created within 5 minutes to lecture end (simulate by setting lecture.start_dt <= now) → no attendance created.

Attempt to submit attendance for a future lecture → API returns 403.

Submit attendance for today's lecture:

Missing rating → API returns 400.

All present/rating provided → creates/updates LectureAttendance rows and sets lecture.attendance_taken = True.

Try to delete a lecture with attendance_taken = True → fails with ValidationError.

Delete enrollment → verify future LectureAttendance rows deleted; past rows stay.

Attempt to resubmit attendance after 25 hours → only admin allowed.

Test UniqueConstraint behavior: creating two LectureAttendance rows for same (lecture, child) should fail.
---


Backend enforcement helpers and submission workflow
```py
def submit_attendance(request, lecture_id):
    user = request.user
    lecture = Lecture.objects.select_for_update().get(pk=lecture_id)

    # 1) permission: only instructor of the lecture or admin
    if not user.is_admin and lecture.instructor and lecture.instructor.user != user:
        return 403

    # 2) allow marking only if LectureAttendance.can_mark_now(lecture) OR user.is_admin
    if not user.is_admin and not LectureAttendance.can_mark_now(lecture):
        return 403 (explain allowed window)

    payload = request.data  # either manual list or batch tokens

    # 3) resolve participants -> list of (attendance_obj, present, rating, notes)
    # for batch tokens: resolve by parsing token -> find child/student -> find attendance row for lecture
    # if attendance row missing (participant not enrolled) include in `not_enrolled` list and skip or signal to admin

    # 4) Validate: EVERY targeted participant must have present in {True, False}. Also rating must be provided.
    for row in rows:
        if row.present is None:
            return 400 "All participants must have attendance value"
        if row.rating is None:
            return 400 "Rating required for each participant"

    # 5) Atomic write
    with transaction.atomic():
        for row in rows:
            att = row.attendance_obj
            att.present = row.present
            att.rating = Decimal(row.rating)
            att.notes = row.notes
            att.marked_by = user
            att.marked_at = timezone.now()
            att.save()

        lecture.attendance_taken = True
        lecture.save()

        # create audit log entry

    # 6) return response with created/updated counts and not_enrolled list
```
Absolutely! Let’s break down a **Docker Compose file** (`docker-compose.yml`) and understand every section step by step. I'll cover the purpose of each directive and explain how you can create and customize a Docker Compose setup for your project.

---

### 1. **File Structure**

A Docker Compose file is written in **YAML** format and is typically named `docker-compose.yml`. This file defines the configuration of multi-container Docker applications, specifying services, networks, and volumes. Each section plays a crucial role in how the containers will be built and interact.

### Basic Structure of a `docker-compose.yml` File:

```yaml
version: '3.8'  # Specify the version of the Compose file format

services:
  <service_name>:  # Each service represents a container in your app
    <key-value>  # Specific configurations for that service

volumes:
  <volume_name>:  # Define volumes to persist data

networks:
  <network_name>:  # Define networks for communication between containers
```

Let’s go over each of these components.

---

### 2. **`version` Directive**

The `version` defines the version of the Docker Compose file format. It tells Docker how to interpret the rest of the file. The most commonly used version today is `3.8`, but you might see `3.7`, `3.9`, or even `2` depending on the features you need.

* `version: '3.8'` — This uses the Compose file format version 3.8, which is compatible with Docker 18.06.0+.

### 3. **`services` Section**

This is where you define your containers (services) and their configurations. A **service** represents a container or a group of containers running a specific part of your application (e.g., Django, PostgreSQL).

#### Example with Django and PostgreSQL:

```yaml
services:
  web:
    image: python:3.14-slim  # Docker image to use (Python with Slim variant)
    container_name: django_app  # Optional name for the container
    command: python manage.py runserver 0.0.0.0:8000  # Command to run inside the container
    volumes:
      - .:/app  # Mount your local project directory into the container
    working_dir: /app  # Working directory inside the container
    ports:
      - "8000:8000"  # Map port 8000 on the host to port 8000 on the container
    environment:
      - DEBUG=True  # Set environment variables inside the container
    depends_on:
      - db  # This service depends on the database service

  db:
    image: postgres:13  # Docker image to use for PostgreSQL
    container_name: postgres_db  # Optional name for the container
    environment:
      POSTGRES_USER: user  # Set the PostgreSQL username
      POSTGRES_PASSWORD: password  # Set the PostgreSQL password
      POSTGRES_DB: django_db  # Set the name of the database
    volumes:
      - postgres_data:/var/lib/postgresql/data  # Persist data across container restarts
    ports:
      - "5432:5432"  # Map port 5432 for PostgreSQL access
```

#### Explanation of the Service Configuration:

* **`web`** (Django service):

  * **`image`**: Specifies the Docker image for the container. Here, `python:3.14-slim` is used, which is a slim version of Python. You can replace this with any other Python image (or custom-built image).
  * **`container_name`**: Sets a custom name for the container. If omitted, Docker generates one automatically.
  * **`command`**: Defines the command that will be run when the container starts. In this case, it starts the Django development server (`python manage.py runserver`).
  * **`volumes`**: Mounts the current directory (`.`) from your local machine to `/app` inside the container. This makes your local project files available in the container for development.
  * **`working_dir`**: Specifies the working directory where commands will be executed inside the container (in this case, `/app`).
  * **`ports`**: Maps port `8000` on the host machine to port `8000` on the container. This allows you to access the Django app via `localhost:8000` in your browser.
  * **`environment`**: Sets environment variables that will be available inside the container (like `DEBUG=True` for Django).
  * **`depends_on`**: Specifies that this service depends on the `db` service (PostgreSQL). Docker Compose will ensure the `db` container starts before `web` starts.

* **`db`** (PostgreSQL service):

  * **`image`**: Specifies the Docker image for the PostgreSQL database. Here we are using the official `postgres:13` image.
  * **`container_name`**: Sets a custom name for the PostgreSQL container.
  * **`environment`**: Defines environment variables like `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` for the PostgreSQL database credentials and database name.
  * **`volumes`**: Mounts a named volume (`postgres_data`) to `/var/lib/postgresql/data` inside the container. This ensures your PostgreSQL data persists even if the container is removed.
  * **`ports`**: Exposes port `5432` on the host machine, allowing access to the database outside the container.

---

### 4. **`volumes` Section**

Docker volumes are used to persist data on the host machine so that it can be reused across container restarts or removals.

```yaml
volumes:
  postgres_data:
    driver: local  # Default driver
```

* **`postgres_data`** is a named volume that is used by the `db` service to persist PostgreSQL data.
* Volumes are automatically created when the Compose file is first run. If you use `volumes` in your services, Docker Compose will ensure they are created and used correctly.

---

### 5. **`networks` Section (Optional)**

By default, Docker Compose creates a **default network** for communication between containers, so you don’t always need to specify networks. However, if you want more control over the networks, you can define them.

```yaml
networks:
  my_network:
    driver: bridge
```

* **`my_network`**: Defines a custom network that containers can connect to. This is optional if you want more control over communication between services.
* **`driver: bridge`**: Specifies the network driver. The `bridge` driver is the default and allows containers to communicate with each other.

---

### Example of a Complete `docker-compose.yml` File

```yaml
version: '3.8'

services:
  web:
    image: python:3.14-slim
    container_name: django_app
    command: python manage.py runserver 0.0.0.0:8000
    volumes:
      - .:/app
    working_dir: /app
    ports:
      - "8000:8000"
    environment:
      - DEBUG=True
    depends_on:
      - db

  db:
    image: postgres:13
    container_name: postgres_db
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: django_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
    driver: local
```

---

### Running Your Docker Compose Setup

Once you have the `docker-compose.yml` file ready, here are the steps to run your setup:

1. **Build and start the containers**:

   ```bash
   docker-compose up --build
   ```

   * The `--build` flag ensures Docker rebuilds the images (if needed).

2. **Stop the containers**:

   ```bash
   docker-compose down
   ```

   This will stop and remove the containers, but the volumes will persist (your PostgreSQL data won’t be lost).

3. **Access the Django app**: Open `http://localhost:8000` in your browser to see the Django app running.

---

### Conclusion

This breakdown covers the essential components of a `docker-compose.yml` file and explains the configuration options available for Docker Compose. You can customize this file further based on your needs, like adding more services, configuring additional networks, or adding other environment variables for production environments.

Let me know if you have any specific parts you'd like more detail on!
