import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def make_user_admin(phone_number):
    try:
        # Get database credentials from environment variables
        db_name = os.getenv("DATABASE_NAME", "redwan_courses_center_dev_db")
        db_user = os.getenv("DATABASE_USERNAME", "redwan_courses_center_dev")
        db_pass = os.getenv("DATABASE_PASSWORD", "Redwan_courses_center_dev_pwd123")
        db_host = "localhost" # Assuming local DB
        db_port = os.getenv("DATABASE_PORT", "5432")

        # Connect to the database
        conn = psycopg2.connect(
            dbname=db_name,
            user=db_user,
            password=db_pass,
            host=db_host,
            port=db_port
        )
        cur = conn.cursor()

        # Update the user role and staff status
        query = """
            UPDATE users_customuser 
            SET role = 'admin', is_staff = true, is_superuser = true 
            WHERE phone_number1 = %s;
        """
        cur.execute(query, (phone_number,))
        
        if cur.rowcount > 0:
            conn.commit()
            print(f"✅ Success: User with phone {phone_number} is now an ADMIN.")
        else:
            print(f"❌ Error: No user found with phone {phone_number}.")

        cur.close()
        conn.close()

    except Exception as e:
        print(f"❌ Database error: {e}")

if __name__ == "__main__":
    # The phone number of the student account you are using
    target_phone = "+201069158744"
    make_user_admin(target_phone)
