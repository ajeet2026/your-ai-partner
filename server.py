import os
import sys
import uuid
import time
import json
import urllib.request
import urllib.parse
from datetime import datetime, timedelta

# Try installing standard dependencies if running for the first time
try:
    from fastapi import FastAPI, Depends, HTTPException, status, Request
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import JSONResponse, FileResponse
    from pydantic import BaseModel, EmailStr
    import jwt
    import bcrypt
except ImportError:
    print("⚠️ Required packages (fastapi, uvicorn, PyJWT, bcrypt) not found.")
    print("👉 Please run: python3 install.py to install them automatically.")
    sys.exit(1)

# Ensure local imports inside 'api/' directory are accessible
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "api"))
import db

# Initialize database schemas
db.init_db()

# --- CONFIGURATIONS AND CONSTANTS ---
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
JWT_SECRET = os.environ.get("JWT_SECRET", "COSMIC_LEARNING_PARTNER_JWT_2026_SECRET_KEY")
JWT_ALGORITHM = "HS256"
STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET")

app = FastAPI(
    title="Your AI Partner API Backend",
    description="Secure multi-user learning management systems API built on FastAPI",
    version="2.0.0"
)

# Enable standard CORS permissions
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- PYDANTIC REPRESENTATION CLASS SCHEMAS ---

class AuthModel(BaseModel):
    email: EmailStr
    password: str

class ProfileSaveModel(BaseModel):
    name: str = ""
    targetExam: str = ""
    preferredLanguage: str = "English"
    studyHours: int = 4
    weakSubjects: list = []
    strongSubjects: list = []
    skills: dict = {}
    premium: bool = False

class TaskSaveModel(BaseModel):
    id: str
    title: str
    subject: str = "General"
    category: str = "planning"
    completed: bool = False
    deadline: str = "Today"
    studyHours: float = 1.0

class TestSaveModel(BaseModel):
    id: str
    subject: str
    date: str
    score: int
    total: int
    percentage: int
    accuracy: int
    timeSpent: int

class MoodSaveModel(BaseModel):
    id: str
    date: str
    mood: str
    stressLevel: int
    sleepHours: float
    notes: str = ""

class ChatSaveModel(BaseModel):
    id: str
    sender: str
    agent: str = "Tutor"
    text: str
    time: str

class ChatProxyModel(BaseModel):
    message: str
    history: list = []
    model: str = "llama3"
    system_prompt: str = "You are an AI study partner."

class QuizProxyModel(BaseModel):
    subject: str
    examType: str = "General"
    model: str = "llama3"

# --- HELPER ROUTINES FOR SECURITY AND AUTHENTICATION ---

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> str:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authentication header"
        )
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")

# --- AUTHENTICATION ENDPOINTS ---

@app.post("/api/auth/signup")
async def signup(user: AuthModel):
    # Verify if user email is registered already
    existing = db.get_user_by_email(user.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account is already registered with this email address."
        )
    
    user_id = str(uuid.uuid4())
    pass_hash = hash_password(user.password)
    db.create_user(user_id, user.email, pass_hash)
    
    # Auto-initialize an empty profile record
    db.save_profile(user_id, user.email.split("@")[0], "General Master", "English", 4, "[]", "[]", "{}", False)
    
    token = create_access_token(user_id, user.email)
    return {"token": token, "email": user.email}

@app.post("/api/auth/login")
async def login(user: AuthModel):
    record = db.get_user_by_email(user.email)
    if not record or not verify_password(user.password, record["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password configured."
        )
    
    token = create_access_token(record["id"], record["email"])
    return {"token": token, "email": record["email"]}

# --- SECURE USER RELATIONAL QUERIES ---

@app.get("/api/user/profile")
async def get_user_profile(user_id: str = Depends(get_current_user)):
    profile = db.get_profile(user_id)
    if not profile:
        return {"empty": True}
    
    # Safely unpack JSON structures
    try:
        profile["weakSubjects"] = json.loads(profile["weakSubjects"])
    except Exception:
        profile["weakSubjects"] = []
        
    try:
        profile["strongSubjects"] = json.loads(profile["strongSubjects"])
    except Exception:
        profile["strongSubjects"] = []
        
    try:
        profile["skills"] = json.loads(profile["skills"])
    except Exception:
        profile["skills"] = {}
        
    return {"success": True, "profile": profile}

@app.post("/api/user/profile")
async def save_user_profile(profile: ProfileSaveModel, user_id: str = Depends(get_current_user)):
    db.save_profile(
        user_id,
        profile.name,
        profile.targetExam,
        profile.preferredLanguage,
        profile.studyHours,
        json.dumps(profile.weakSubjects),
        json.dumps(profile.strongSubjects),
        json.dumps(profile.skills),
        profile.premium
    )
    return {"success": True}

@app.get("/api/user/tasks")
async def get_user_tasks(user_id: str = Depends(get_current_user)):
    tasks = db.get_tasks(user_id)
    return {"success": True, "tasks": tasks}

@app.post("/api/user/tasks")
async def save_user_task(task: TaskSaveModel, user_id: str = Depends(get_current_user)):
    db.add_task(
        task.id,
        user_id,
        task.title,
        task.subject,
        task.category,
        task.completed,
        task.deadline,
        task.studyHours
    )
    return {"success": True}

@app.post("/api/user/tasks/toggle/{task_id}")
async def toggle_user_task(task_id: str, user_id: str = Depends(get_current_user)):
    db.toggle_task(task_id, user_id)
    return {"success": True}

@app.delete("/api/user/tasks/{task_id}")
async def delete_user_task(task_id: str, user_id: str = Depends(get_current_user)):
    db.delete_task(task_id, user_id)
    return {"success": True}

@app.get("/api/user/tests")
async def get_user_tests(user_id: str = Depends(get_current_user)):
    tests = db.get_tests(user_id)
    return {"success": True, "tests": tests}

@app.post("/api/user/tests")
async def save_user_test(test: TestSaveModel, user_id: str = Depends(get_current_user)):
    db.add_test(
        test.id,
        user_id,
        test.subject,
        test.date,
        test.score,
        test.total,
        test.percentage,
        test.accuracy,
        test.timeSpent
    )
    return {"success": True}

@app.get("/api/user/mood")
async def get_user_mood_logs(user_id: str = Depends(get_current_user)):
    logs = db.get_mood_logs(user_id)
    return {"success": True, "logs": logs}

@app.post("/api/user/mood")
async def save_user_mood(mood: MoodSaveModel, user_id: str = Depends(get_current_user)):
    db.add_mood_log(
        mood.id,
        user_id,
        mood.date,
        mood.mood,
        mood.stressLevel,
        mood.sleepHours,
        mood.notes
    )
    return {"success": True}

@app.get("/api/user/chat")
async def get_user_chats(user_id: str = Depends(get_current_user)):
    chats = db.get_chats(user_id)
    return {"success": True, "chats": chats}

@app.post("/api/user/chat")
async def save_user_chat(chat: ChatSaveModel, user_id: str = Depends(get_current_user)):
    db.add_chat(
        chat.id,
        user_id,
        chat.sender,
        chat.agent,
        chat.text,
        chat.time
    )
    return {"success": True}

@app.delete("/api/user/chat")
async def clear_user_chats(user_id: str = Depends(get_current_user)):
    db.clear_chats(user_id)
    return {"success": True}

# --- OLLAMA AI SERVER PROXIES ---

@app.get("/api/ollama/status")
async def get_ollama_status():
    try:
        req = urllib.request.Request("http://localhost:11434/api/tags")
        with urllib.request.urlopen(req, timeout=1.2) as response:
            data = json.loads(response.read().decode('utf-8'))
            models = [model['name'] for model in data.get('models', [])]
            return {"status": "online", "models": models}
    except Exception:
        return {"status": "offline", "models": []}

@app.post("/api/chat")
async def chat_with_ollama(payload: ChatProxyModel):
    try:
        messages = [{"role": "system", "content": payload.system_prompt}]
        for h in payload.history:
            messages.append({
                "role": h.get("role", "user"), 
                "content": h.get("content", "")
            })
        messages.append({"role": "user", "content": payload.message})
        
        ollama_payload = {
            "model": payload.model,
            "messages": messages,
            "stream": False
        }
        
        req = urllib.request.Request(
            "http://localhost:11434/api/chat",
            data=json.dumps(ollama_payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        
        with urllib.request.urlopen(req, timeout=1.5) as response:
            ollama_res = json.loads(response.read().decode('utf-8'))
            reply = ollama_res.get("message", {}).get("content", "")
            return {"success": True, "reply": reply}
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))

@app.post("/api/quiz/generate")
async def generate_quiz_ollama(payload: QuizProxyModel):
    try:
        prompt = f"""Generate exactly 4 multiple-choice questions for a diagnostic test on the subject '{payload.subject}' suitable for a student preparing for the '{payload.examType}' exam.
The output MUST be a JSON array of exactly 4 objects. Do not wrap in markdown or add explanations outside the JSON structure.

Each question object in the array must have exactly these keys:
1. "question": The question string.
2. "options": An array of exactly 4 strings.
3. "answer": The index (0, 1, 2, or 3) of the correct option.
4. "explanation": A detailed explanation of why that option is correct.

Ensure the response contains valid JSON structure only."""
        
        ollama_payload = {
            "model": payload.model,
            "prompt": prompt,
            "format": "json",
            "stream": False
        }
        
        req = urllib.request.Request(
            "http://localhost:11434/api/generate",
            data=json.dumps(ollama_payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        
        with urllib.request.urlopen(req, timeout=1.5) as response:
            ollama_res = json.loads(response.read().decode('utf-8'))
            response_text = ollama_res.get("response", "").strip()
            questions = json.loads(response_text)
            return {"success": True, "questions": questions}
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))

# --- STRIPE BILLING PRODUCTION GATEWAYS ---

@app.post("/api/create-checkout-session")
async def create_checkout_session(request: Request):
    if not STRIPE_SECRET_KEY:
        return {"success": False, "mock_mode": True}
        
    try:
        origin = request.headers.get("Origin") or request.headers.get("Referer") or "http://localhost:8000"
        if origin.endswith("/"):
            origin = origin[:-1]
            
        success_url = f"{origin}/?checkout_success=true"
        cancel_url = f"{origin}/?checkout_cancel=true"
        
        stripe_payload = {
            "success_url": success_url,
            "cancel_url": cancel_url,
            "mode": "payment",
            "payment_method_types[0]": "card",
            "line_items[0][price_data][currency]": "inr",
            "line_items[0][price_data][product_data][name]": "Your AI Partner Premium Subscription",
            "line_items[0][price_data][product_data][description]": "Unlocks 1-hour coaching calls, infinite custom subjects, and premium badge rewards.",
            "line_items[0][price_data][unit_amount]": "4900",
            "line_items[0][quantity]": "1",
            "metadata[student_id]": "default_student"
        }
        
        data = urllib.parse.urlencode(stripe_payload).encode('utf-8')
        
        req = urllib.request.Request(
            "https://api.stripe.com/v1/checkout/sessions",
            data=data,
            headers={
                'Authorization': f'Bearer {STRIPE_SECRET_KEY}',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            method='POST'
        )
        
        with urllib.request.urlopen(req, timeout=10.0) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            return {"success": True, "url": res_data.get("url")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Verification of stripe webhooks
def verify_stripe_signature(payload_bytes, sig_header, secret):
    if not sig_header or not secret:
        return False
    try:
        parts = {}
        for item in sig_header.split(','):
            k, v = item.split('=', 1)
            parts[k.strip()] = v.strip()
        t = parts.get('t')
        v1 = parts.get('v1')
        if not t or not v1:
            return False
        signed_payload = f"{t}.".encode('utf-8') + payload_bytes
        mac = hmac.new(secret.encode('utf-8'), signed_payload, hashlib.sha256)
        return hmac.compare_digest(mac.hexdigest(), v1)
    except Exception:
        return False

@app.post("/api/webhook")
async def stripe_webhook(request: Request):
    try:
        post_data = await request.body()
        sig_header = request.headers.get("Stripe-Signature")
        
        # Sig verify
        if STRIPE_WEBHOOK_SECRET:
            import hmac
            import hashlib
            if not verify_stripe_signature(post_data, sig_header, STRIPE_WEBHOOK_SECRET):
                raise HTTPException(status_code=400, detail="Invalid Signature signature")
                
        event = json.loads(post_data.decode('utf-8'))
        
        if event.get("type") == "checkout.session.completed":
            session = event.get("data", {}).get("object", {})
            metadata = session.get("metadata", {})
            student_id = metadata.get("student_id", "default_student")
            
            # Since webhooks are user-independent, let's find the profile record or do a generic upgrade
            conn = db.get_connection()
            cursor = conn.cursor()
            
            # We can find the profile that matches student_id (if student_id maps to user_id)
            cursor.execute("SELECT 1 FROM profiles WHERE user_id = ?", (student_id,))
            exists = cursor.fetchone()
            
            if exists:
                cursor.execute("UPDATE profiles SET premium = TRUE WHERE user_id = ?", (student_id,))
                conn.commit()
                print(f"🎉 Cloud stripe payment succeeded! Upgraded user: {student_id}")
            conn.close()
            
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- SERVER STATIC SPA CLIENT ASSETS ---

@app.get("/")
async def serve_index():
    return FileResponse(os.path.join(DIRECTORY, "index.html"))

# Mount remaining CSS/JS folders dynamically as FastAPI StaticFiles
app.mount("/", StaticFiles(directory=DIRECTORY), name="static")

# Start loop runner
if __name__ == "__main__":
    import uvicorn
    # Local loop starts on Port 8000
    print("==================================================================")
    print("🚀 Starting FastAPI production-grade Multi-User Local API Server!")
    print("👉 View interactive docs at: http://localhost:8000/docs")
    print("👉 Visit application at: http://localhost:8000")
    print("==================================================================")
    uvicorn.run(app, host="0.0.0.0", port=8000)
