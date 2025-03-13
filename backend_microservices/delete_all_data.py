import os
import mysql.connector
from mysql.connector import Error
import argparse

# List of databases to clear
DB_NAMES = ["edux_chat", "edux_course", "edux_files", "edux_user"]

# Default user details (preserving exact values)
DEFAULT_USER = {
    "nickname": "user",
    "email": "user@example.com",
    "password_hash": "$2b$12$rGn1sXi2xElqfikdjFcrI.ceFS.8EajL2Qr2G0qF5WVEtfdIaOl3G",  # Exact hash value
    "role": None,
}

def delete_tables(db_host, db_user, db_password, db_name):
    """Deletes all tables from the given database."""
    try:
        conn = mysql.connector.connect(
            host=db_host,
            user=db_user,
            password=db_password,
            database=db_name
        )
        if conn.is_connected():
            cursor = conn.cursor()
            cursor.execute("SHOW TABLES;")
            tables = cursor.fetchall()

            if not tables:
                return

            for (table_name,) in tables:
                cursor.execute(f"DROP TABLE IF EXISTS `{table_name}`;")
            
            conn.commit()
            print(f"All tables deleted from {db_name}.")

    except Error as e:
        print(f"Error in {db_name}: {e}")

    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

def create_default_user(db_host, db_user, db_password):
    """Creates a users table and inserts a default user into the edux_user database."""
    try:
        conn = mysql.connector.connect(
            host=db_host,
            user=db_user,
            password=db_password,
            database="edux_user"
        )
        if conn.is_connected():
            cursor = conn.cursor()
            
            # Create users table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    user_id INT AUTO_INCREMENT PRIMARY KEY,
                    nickname VARCHAR(255) NOT NULL,
                    role VARCHAR(50) DEFAULT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    hashed_password VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    user_icon_fid INT DEFAULT NULL
                );
            """)
            
            # Insert default user with predefined hash
            cursor.execute("""
                INSERT INTO users (nickname, role, email, hashed_password)
                VALUES (%s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE email=email;
            """, (DEFAULT_USER["nickname"], DEFAULT_USER["role"], DEFAULT_USER["email"], DEFAULT_USER["password_hash"]))

            conn.commit()

    except Error as e:
        print(f"Error creating default user: {e}")

    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

def delete_files():
    """Deletes all files in the specified directory."""
    file_path = "filemanager_service/app/files"
    if os.path.exists(file_path):
        for file in os.listdir(file_path):
            os.remove(os.path.join(file_path, file))
        print("All files have been deleted.\n")

def main():
    # Argument parser for command-line input
    parser = argparse.ArgumentParser(description="Delete all tables and create a default user.")
    parser.add_argument("-u", "--user", required=True, help="MySQL username")
    parser.add_argument("-p", "--password", required=True, help="MySQL password")
    parser.add_argument("--host", default="localhost", help="MySQL host (default: localhost)")

    args = parser.parse_args()

    # Run the script for each database
    for db in DB_NAMES:
        delete_tables(args.host, args.user, args.password, db)

    # Create the default user in edux_user
    create_default_user(args.host, args.user, args.password)

    # Delete all files in file storage
    delete_files()

    print("All data have been cleared, and a default user has been created:")
    print("\n- Email: user@example.com\n- Nickname: user\n- Password: 123")
    print()

if __name__ == "__main__":
    main()

