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