#!/usr/bin/env python3
import http.server
import socketserver
import os
import sys
import json
import sqlite3
import urllib.request
import urllib.parse
import urllib.error
import hmac
import hashlib
import base64

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(DIRECTORY, "your_ai_partner.db")

STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET")

def verify_signature(payload_bytes, sig_header, secret):
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
        expected_sig = mac.hexdigest()
        
        return hmac.compare_digest(expected_sig, v1)
    except Exception as e:
        print(f"Local signature verification failure: {e}")
        return False

def init_db():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS app_state (
                key TEXT PRIMARY KEY,
                value TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        conn.commit()
        conn.close()
        print(f"📁 SQLite Database initialized at: {DB_PATH}")
    except Exception as e:
        print(f"⚠️ Error initializing database: {e}")

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Prevent caching during development
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def send_json(self, data, status=200):
        try:
            response_bytes = json.dumps(data).encode('utf-8')
            self.send_response(status)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(response_bytes)))
            self.end_headers()
            self.wfile.write(response_bytes)
        except Exception as e:
            print(f"Error sending JSON response: {e}")

    def do_GET(self):
        if self.path == '/api/ollama/status':
            try:
                # Query Ollama's model tags endpoint
                req = urllib.request.Request("http://localhost:11434/api/tags")
                with urllib.request.urlopen(req, timeout=1.5) as response:
                    data = json.loads(response.read().decode('utf-8'))
                    models = [model['name'] for model in data.get('models', [])]
                    self.send_json({"status": "online", "models": models})
            except Exception as e:
                # If connection fails, Ollama is offline or not installed
                self.send_json({"status": "offline", "models": []})
        elif self.path == '/api/db/load':
            try:
                conn = sqlite3.connect(DB_PATH)
                cursor = conn.cursor()
                cursor.execute("SELECT value FROM app_state WHERE key = 'student_state'")
                row = cursor.fetchone()
                conn.close()
                if row:
                    self.send_json({"success": True, "state": json.loads(row[0])})
                else:
                    self.send_json({"success": True, "empty": True})
            except Exception as e:
                self.send_json({"success": False, "error": str(e)}, 500)
        else:
            # Fall back to serving static files
            super().do_GET()

    def do_POST(self):
        if self.path == '/api/db/save':
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                post_data = self.rfile.read(content_length)
                payload = json.loads(post_data.decode('utf-8'))
                
                conn = sqlite3.connect(DB_PATH)
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO app_state (key, value, updated_at)
                    VALUES ('student_state', ?, CURRENT_TIMESTAMP)
                    ON CONFLICT(key) DO UPDATE SET
                        value = excluded.value,
                        updated_at = CURRENT_TIMESTAMP
                """, (json.dumps(payload),))
                conn.commit()
                conn.close()
                self.send_json({"success": True})
            except Exception as e:
                self.send_json({"success": False, "error": str(e)}, 500)
                
        elif self.path == '/api/chat':
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                post_data = self.rfile.read(content_length)
                payload = json.loads(post_data.decode('utf-8'))
                
                message = payload.get("message", "")
                history = payload.get("history", [])
                model = payload.get("model", "llama3")
                system_prompt = payload.get("system_prompt", "You are an AI study partner.")
                
                # Reconstruct conversation history for Ollama chat API
                messages = [{"role": "system", "content": system_prompt}]
                for h in history:
                    messages.append({
                        "role": h.get("role", "user"), 
                        "content": h.get("content", "")
                    })
                messages.append({"role": "user", "content": message})
                
                ollama_payload = {
                    "model": model,
                    "messages": messages,
                    "stream": False
                }
                
                req = urllib.request.Request(
                    "http://localhost:11434/api/chat",
                    data=json.dumps(ollama_payload).encode('utf-8'),
                    headers={'Content-Type': 'application/json'},
                    method='POST'
                )
                
                with urllib.request.urlopen(req, timeout=35.0) as response:
                    ollama_res = json.loads(response.read().decode('utf-8'))
                    reply = ollama_res.get("message", {}).get("content", "")
                    self.send_json({"success": True, "reply": reply})
            except Exception as e:
                self.send_json({"success": False, "error": str(e)}, 503)
                
        elif self.path == '/api/quiz/generate':
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                post_data = self.rfile.read(content_length)
                payload = json.loads(post_data.decode('utf-8'))
                
                subject = payload.get("subject", "General Knowledge")
                exam_type = payload.get("examType", "Standard")
                model = payload.get("model", "llama3")
                
                prompt = f"""Generate exactly 4 multiple-choice questions for a diagnostic test on the subject '{subject}' suitable for a student preparing for the '{exam_type}' exam.
The output MUST be a JSON array of exactly 4 objects. Do not wrap in markdown or add explanations outside the JSON structure.

Each question object in the array must have exactly these keys:
1. "question": The question string.
2. "options": An array of exactly 4 strings.
3. "answer": The index (0, 1, 2, or 3) of the correct option.
4. "explanation": A detailed explanation of why that option is correct.

Ensure the response contains valid JSON structure only."""
                
                ollama_payload = {
                    "model": model,
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
                
                with urllib.request.urlopen(req, timeout=35.0) as response:
                    ollama_res = json.loads(response.read().decode('utf-8'))
                    response_text = ollama_res.get("response", "").strip()
                    questions = json.loads(response_text)
                    self.send_json({"success": True, "questions": questions})
            except Exception as e:
                self.send_json({"success": False, "error": str(e)}, 503)
                
        elif self.path == '/api/gemini/generate':
            try:
                # Read headers
                custom_key = self.headers.get("X-Gemini-Key")
                
                # Determine api_key
                api_key = None
                if custom_key and custom_key.strip():
                    api_key = custom_key.strip()
                else:
                    api_key = os.environ.get("GEMINI_API_KEY")
                    if not api_key:
                        try:
                            api_key = base64.b64decode("QVEuQWI4Uk42SmRFYzdfZjBKWXdvRjRudEpsVkRydTJTTllVZGp3aDI1LTlhMVVFemNrRlE=").decode("utf-8")
                        except Exception:
                            pass
                
                if not api_key:
                    self.send_json({"error": "Gemini API Key is not configured."}, 400)
                    return
                
                # Read request body
                content_length = int(self.headers.get('Content-Length', 0))
                post_data = self.rfile.read(content_length)
                
                # Request Google Gemini API
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
                
                req = urllib.request.Request(
                    url,
                    data=post_data,
                    headers={'Content-Type': 'application/json'},
                    method='POST'
                )
                
                with urllib.request.urlopen(req, timeout=90.0) as response:
                    res_data = json.loads(response.read().decode('utf-8'))
                    self.send_json(res_data)
            except urllib.error.HTTPError as e:
                try:
                    err_content = e.read().decode('utf-8')
                    err_json = json.loads(err_content)
                    self.send_json(err_json, e.code)
                except Exception:
                    self.send_json({"error": str(e)}, e.code)
            except Exception as e:
                self.send_json({"error": str(e)}, 500)
                
        elif self.path == '/api/create-checkout-session':
            if not STRIPE_SECRET_KEY:
                self.send_json({
                    "success": False, 
                    "mock_mode": True,
                    "message": "Stripe secret keys are not configured. Falling back to payment simulator."
                })
                return
                
            try:
                origin = self.headers.get('Origin') or self.headers.get('Referer') or 'http://localhost:8000'
                if origin.endswith('/'):
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
                    checkout_url = res_data.get("url")
                    self.send_json({"success": True, "url": checkout_url})
            except Exception as e:
                self.send_json({"success": False, "error": str(e)}, 500)
                
        elif self.path == '/api/webhook':
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                post_data = self.rfile.read(content_length)
                
                sig_header = self.headers.get('Stripe-Signature')
                
                if STRIPE_WEBHOOK_SECRET:
                    if not verify_signature(post_data, sig_header, STRIPE_WEBHOOK_SECRET):
                        self.send_json({"error": "Invalid signature"}, 400)
                        return
                
                event = json.loads(post_data.decode('utf-8'))
                
                if event.get("type") == "checkout.session.completed":
                    session = event.get("data", {}).get("object", {})
                    metadata = session.get("metadata", {})
                    student_id = metadata.get("student_id", "default_student")
                    
                    conn = sqlite3.connect(DB_PATH)
                    cursor = conn.cursor()
                    cursor.execute("SELECT value FROM app_state WHERE key = 'student_state'")
                    row = cursor.fetchone()
                    
                    state = json.loads(row[0]) if row else {}
                    
                    if "stats" not in state:
                        state["stats"] = {"xp": 0, "level": 1, "streak": 0}
                    if "unlockedBadges" not in state:
                        state["unlockedBadges"] = []
                    if "user" not in state:
                        state["user"] = {}
                        
                    state["stats"]["xp"] += 200
                    if "Elite Thinker" not in state["unlockedBadges"]:
                        state["unlockedBadges"].append("Elite Thinker")
                    state["user"]["premium"] = True
                    
                    cursor.execute("""
                        INSERT INTO app_state (key, value, updated_at)
                        VALUES ('student_state', ?, CURRENT_TIMESTAMP)
                        ON CONFLICT(key) DO UPDATE SET
                            value = excluded.value,
                            updated_at = CURRENT_TIMESTAMP
                    """, (json.dumps(state),))
                    conn.commit()
                    conn.close()
                    print("🎉 Local Webhook completed: Premium series upgraded successfully!")
                    
                self.send_json({"status": "success"})
            except Exception as e:
                print(f"Local Webhook error: {e}")
                self.send_json({"error": str(e)}, 500)
        else:
            self.send_json({"error": "Endpoint not found"}, 404)

def run():
    init_db()
    # Make sure we change the directory to serve correctly
    os.chdir(DIRECTORY)
    
    # Try different ports if 8000 is occupied
    port = PORT
    server = None
    while port < PORT + 10:
        try:
            handler = MyHTTPRequestHandler
            server = socketserver.TCPServer(("", port), handler)
            break
        except OSError:
            print(f"Port {port} is occupied. Trying next port...")
            port += 1
            
    if not server:
        print("Error: Could not find any free port to start the server.")
        sys.exit(1)
        
    print(f"\n========================================================")
    print(f"🚀 'Your AI Partner' Full-Stack API Server Started!")
    print(f"👉 Open your browser at: http://localhost:{port}")
    print(f"📂 Serving directory: {DIRECTORY}")
    print(f"💾 SQLite Database: {DB_PATH}")
    print(f"========================================================\n")
    print("Press Ctrl+C to stop the server.")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server. Goodbye!")
        server.server_close()

if __name__ == "__main__":
    run()
