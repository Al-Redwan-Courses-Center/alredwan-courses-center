# Back-end of the onsite web application of Redwan Courses Center


## Don't forget to use: `pip3 install -r requirements.txt` to install the required packages, and `pip3 freeze > requirements.txt` to update the requirements file.

## Don't Migrate until all the models are ready.



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
