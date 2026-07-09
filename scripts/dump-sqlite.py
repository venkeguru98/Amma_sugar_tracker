import sqlite3
import json
import os

db_path = os.path.join(os.path.dirname(__file__), '../server/prisma/dev.db')
dump_path = os.path.join(os.path.dirname(__file__), '../server/prisma/sqlite_dump.json')

if not os.path.exists(db_path):
    print("No SQLite database found at:", db_path)
    exit(1)

conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

tables = [
    'users',
    'sugar_readings',
    'bp_readings',
    'weight_readings',
    'medicine_reminders',
    'doctor_notes',
    'lab_reports',
    'prescriptions',
    'monitoring_plans'
]

data = {}

for table in tables:
    try:
        cursor.execute(f"SELECT * FROM {table}")
        rows = cursor.fetchall()
        data[table] = [dict(row) for row in rows]
        print(f"Dumped {len(rows)} rows from table {table}")
    except sqlite3.OperationalError as e:
        print(f"Table {table} not found or error occurred: {e}")
        data[table] = []

with open(dump_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("SQLite dump completed successfully. Dump saved to:", dump_path)
conn.close()
