import os
import sqlite3

DATABASE_URL = os.environ.get("DATABASE_URL")

def get_connection():
    if DATABASE_URL:
        try:
            import psycopg2
            return psycopg2.connect(DATABASE_URL)
        except ImportError:
            print("⚠️ psycopg2 not installed. Falling back to local SQLite.")
            
    # Local SQLite Fallback
    api_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(api_dir)
    db_path = os.path.join(root_dir, "your_ai_partner.db")
    return sqlite3.connect(db_path)

def init_db():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        is_postgres = "psycopg2" in str(type(conn))
        
        # 1. Users Table
        if is_postgres:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id VARCHAR(255) PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
        else:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
        # 2. Profiles Table
        if is_postgres:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS profiles (
                    user_id VARCHAR(255) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                    name VARCHAR(255),
                    target_exam VARCHAR(255),
                    preferred_language VARCHAR(255) DEFAULT 'English',
                    study_hours INTEGER DEFAULT 4,
                    weak_subjects_json TEXT,
                    strong_subjects_json TEXT,
                    skills_json TEXT,
                    premium BOOLEAN DEFAULT FALSE
                );
            """)
        else:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS profiles (
                    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                    name TEXT,
                    target_exam TEXT,
                    preferred_language TEXT DEFAULT 'English',
                    study_hours INTEGER DEFAULT 4,
                    weak_subjects_json TEXT,
                    strong_subjects_json TEXT,
                    skills_json TEXT,
                    premium BOOLEAN DEFAULT FALSE
                );
            """)
            
        # 3. Tasks Table
        if is_postgres:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS tasks (
                    id VARCHAR(255) PRIMARY KEY,
                    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
                    title VARCHAR(255) NOT NULL,
                    subject VARCHAR(255),
                    category VARCHAR(255),
                    completed BOOLEAN DEFAULT FALSE,
                    deadline VARCHAR(255),
                    study_hours REAL DEFAULT 1.0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
        else:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS tasks (
                    id TEXT PRIMARY KEY,
                    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
                    title TEXT NOT NULL,
                    subject TEXT,
                    category TEXT,
                    completed BOOLEAN DEFAULT FALSE,
                    deadline TEXT,
                    study_hours REAL DEFAULT 1.0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
        # 4. Tests Table
        if is_postgres:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS tests (
                    id VARCHAR(255) PRIMARY KEY,
                    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
                    subject VARCHAR(255),
                    date VARCHAR(255),
                    score INTEGER,
                    total INTEGER,
                    percentage INTEGER,
                    accuracy INTEGER,
                    time_spent INTEGER
                );
            """)
        else:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS tests (
                    id TEXT PRIMARY KEY,
                    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
                    subject TEXT,
                    date TEXT,
                    score INTEGER,
                    total INTEGER,
                    percentage INTEGER,
                    accuracy INTEGER,
                    time_spent INTEGER
                );
            """)
            
        # 5. Mood Logs Table
        if is_postgres:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS mood_logs (
                    id VARCHAR(255) PRIMARY KEY,
                    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
                    date VARCHAR(255),
                    mood VARCHAR(255),
                    stress_level INTEGER,
                    sleep_hours REAL,
                    notes TEXT
                );
            """)
        else:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS mood_logs (
                    id TEXT PRIMARY KEY,
                    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
                    date TEXT,
                    mood TEXT,
                    stress_level INTEGER,
                    sleep_hours REAL,
                    notes TEXT
                );
            """)
            
        # 6. Chat History Table
        if is_postgres:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS chat_history (
                    id VARCHAR(255) PRIMARY KEY,
                    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
                    sender VARCHAR(255),
                    agent VARCHAR(255),
                    text TEXT,
                    time VARCHAR(255)
                );
            """)
        else:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS chat_history (
                    id TEXT PRIMARY KEY,
                    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
                    sender TEXT,
                    agent TEXT,
                    text TEXT,
                    time TEXT
                );
            """)
            
        conn.commit()
        conn.close()
        print("📁 SQL Database tables successfully verified/initialized.")
    except Exception as e:
        print(f"⚠️ Error initializing database: {e}")

# Helper to dynamically format parameter placeholders based on engine (SQLite ? / Postgres %s)
def execute_sql(conn, sql_str, params=()):
    cursor = conn.cursor()
    is_postgres = "psycopg2" in str(type(conn))
    if is_postgres:
        sql_str = sql_str.replace("?", "%s")
    cursor.execute(sql_str, params)
    return cursor

# --- USER ACCOUNTS AND PROFILES ---

def create_user(user_id, email, password_hash):
    conn = get_connection()
    execute_sql(conn, """
        INSERT INTO users (id, email, password_hash)
        VALUES (?, ?, ?)
    """, (user_id, email, password_hash))
    conn.commit()
    conn.close()

def get_user_by_email(email):
    conn = get_connection()
    cursor = execute_sql(conn, "SELECT id, email, password_hash FROM users WHERE email = ?", (email,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return {"id": row[0], "email": row[1], "password_hash": row[2]}
    return None

def get_profile(user_id):
    conn = get_connection()
    cursor = execute_sql(conn, """
        SELECT name, target_exam, preferred_language, study_hours, 
               weak_subjects_json, strong_subjects_json, skills_json, premium
        FROM profiles WHERE user_id = ?
    """, (user_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return {
            "name": row[0],
            "targetExam": row[1],
            "preferredLanguage": row[2],
            "studyHours": row[3],
            "weakSubjects": row[4],
            "strongSubjects": row[5],
            "skills": row[6],
            "premium": bool(row[7])
        }
    return None

def save_profile(user_id, name, target_exam, lang, hours, weak_json, strong_json, skills_json, premium):
    conn = get_connection()
    # Check if profile exists to upsert
    cursor = execute_sql(conn, "SELECT 1 FROM profiles WHERE user_id = ?", (user_id,))
    exists = cursor.fetchone()
    
    if exists:
        execute_sql(conn, """
            UPDATE profiles 
            SET name = ?, target_exam = ?, preferred_language = ?, study_hours = ?,
                weak_subjects_json = ?, strong_subjects_json = ?, skills_json = ?, premium = ?
            WHERE user_id = ?
        """, (name, target_exam, lang, hours, weak_json, strong_json, skills_json, premium, user_id))
    else:
        execute_sql(conn, """
            INSERT INTO profiles (user_id, name, target_exam, preferred_language, study_hours,
                                  weak_subjects_json, strong_subjects_json, skills_json, premium)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (user_id, name, target_exam, lang, hours, weak_json, strong_json, skills_json, premium))
    
    conn.commit()
    conn.close()

# --- TASKS ---

def get_tasks(user_id):
    conn = get_connection()
    cursor = execute_sql(conn, """
        SELECT id, title, subject, category, completed, deadline, study_hours 
        FROM tasks WHERE user_id = ? ORDER BY created_at ASC
    """, (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [{
        "id": r[0], "title": r[1], "subject": r[2], "category": r[3], 
        "completed": bool(r[4]), "deadline": r[5], "studyHours": r[6]
    } for r in rows]

def add_task(task_id, user_id, title, subject, category, completed, deadline, hours):
    conn = get_connection()
    execute_sql(conn, """
        INSERT INTO tasks (id, user_id, title, subject, category, completed, deadline, study_hours)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (task_id, user_id, title, subject, category, completed, deadline, hours))
    conn.commit()
    conn.close()

def toggle_task(task_id, user_id):
    conn = get_connection()
    execute_sql(conn, """
        UPDATE tasks SET completed = NOT completed WHERE id = ? AND user_id = ?
    """, (task_id, user_id))
    conn.commit()
    conn.close()

def delete_task(task_id, user_id):
    conn = get_connection()
    execute_sql(conn, "DELETE FROM tasks WHERE id = ? AND user_id = ?", (task_id, user_id))
    conn.commit()
    conn.close()

# --- TESTS ---

def get_tests(user_id):
    conn = get_connection()
    cursor = execute_sql(conn, """
        SELECT id, subject, date, score, total, percentage, accuracy, time_spent 
        FROM tests WHERE user_id = ? ORDER BY id DESC
    """, (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [{
        "id": r[0], "subject": r[1], "date": r[2], "score": r[3], 
        "total": r[4], "percentage": r[5], "accuracy": r[6], "timeSpent": r[7]
    } for r in rows]

def add_test(test_id, user_id, subject, date, score, total, percentage, accuracy, time_spent):
    conn = get_connection()
    execute_sql(conn, """
        INSERT INTO tests (id, user_id, subject, date, score, total, percentage, accuracy, time_spent)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (test_id, user_id, subject, date, score, total, percentage, accuracy, time_spent))
    conn.commit()
    conn.close()

# --- MOOD LOGS ---

def get_mood_logs(user_id):
    conn = get_connection()
    cursor = execute_sql(conn, """
        SELECT id, date, mood, stress_level, sleep_hours, notes 
        FROM mood_logs WHERE user_id = ? ORDER BY id ASC
    """, (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [{
        "id": r[0], "date": r[1], "mood": r[2], 
        "stressLevel": r[3], "sleepHours": r[4], "notes": r[5]
    } for r in rows]

def add_mood_log(log_id, user_id, date, mood, stress, sleep, notes):
    conn = get_connection()
    execute_sql(conn, """
        INSERT INTO mood_logs (id, user_id, date, mood, stress_level, sleep_hours, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (log_id, user_id, date, mood, stress, sleep, notes))
    conn.commit()
    conn.close()

# --- CHATS ---

def get_chats(user_id):
    conn = get_connection()
    cursor = execute_sql(conn, """
        SELECT id, sender, agent, text, time 
        FROM chat_history WHERE user_id = ? ORDER BY id ASC
    """, (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [{
        "id": r[0], "sender": r[1], "agent": r[2], "text": r[3], "time": r[4]
    } for r in rows]

def add_chat(chat_id, user_id, sender, agent, text, time):
    conn = get_connection()
    execute_sql(conn, """
        INSERT INTO chat_history (id, user_id, sender, agent, text, time)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (chat_id, user_id, sender, agent, text, time))
    conn.commit()
    conn.close()

def clear_chats(user_id):
    conn = get_connection()
    execute_sql(conn, "DELETE FROM chat_history WHERE user_id = ?", (user_id,))
    conn.commit()
    conn.close()
