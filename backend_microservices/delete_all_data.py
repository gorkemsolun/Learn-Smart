import os
import mysql.connector
from mysql.connector import Error

# Database connection details
DB_HOST = "localhost"  # Change if needed
DB_USER = "bil"  # Change to your MySQL user
DB_PASSWORD = "22103163"  # Update with your password
DB_NAMES = ["edux_chat", "edux_course", "edux_files", "edux_user"]  # List of databases

def delete_tables(db_name):
    """Connects to a database, retrieves all tables, and deletes them."""
    try:
        conn = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=db_name
        )
        if conn.is_connected():
            cursor = conn.cursor()
            cursor.execute("SHOW TABLES;")
            tables = cursor.fetchall()

            if not tables:
                print(f"No tables found in {db_name}, skipping...")
                return

            print(f"Deleting tables from {db_name}...")
            for (table_name, ) in tables:
                cursor.execute(f"DROP TABLE IF EXISTS `{table_name}`;")
            
            conn.commit()
            print(f"All tables deleted from {db_name}.\n")

    except Error as e:
        print(f"Error in {db_name}: {e}")

    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

# Run the script for each database
for db in DB_NAMES:
    delete_tables(db)

if os.path.exists("filemanager_service/app/files"):
    for file in os.listdir("filemanager_service/app/files"):
        os.remove(f"filemanager_service/app/files/{file}")
    print("All files have been deleted.\n")

print("All specified databases have been cleared.")
