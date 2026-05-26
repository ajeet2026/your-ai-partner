import urllib.parse
import urllib.request
import json
import os
import sys
import hmac
import hashlib

# Ensure imports work in serverless runtimes
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from db import save_state_db, load_state_db

STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET")

def make_response(start_response, data, status="200 OK"):
    try:
        response_body = json.dumps(data).encode('utf-8')
        response_headers = [
            ('Content-Type', 'application/json'),
            ('Content-Length', str(len(response_body))),
            ('Access-Control-Allow-Origin', '*'),
            ('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'),
            ('Access-Control-Allow-Headers', 'Content-Type'),
            ('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        ]
        start_response(status, response_headers)
        return [response_body]
    except Exception as e:
        print(f"Error formulating response: {e}")
        start_response("500 Internal Server Error", [('Content-Type', 'text/plain')])
        return [b"Internal Server Error"]

def verify_signature(payload_bytes, sig_header, secret):
    if not sig_header or not secret:
        return False
    try:
        # Extract timestamp and signature array
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
        print(f"Signature verification failure: {e}")
        return False

def handler(environ, start_response):
    path = environ.get('PATH_INFO', '')
    method = environ.get('REQUEST_METHOD', 'GET')
    
    # Handle CORS pre-flight
    if method == 'OPTIONS':
        start_response("200 OK", [
            ('Access-Control-Allow-Origin', '*'),
            ('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'),
            ('Access-Control-Allow-Headers', 'Content-Type')
        ])
        return [b""]

    # 1. POST /api/create-checkout-session
    if path == '/api/create-checkout-session' and method == 'POST':
        if not STRIPE_SECRET_KEY:
            # Safe Fallback: Notify frontend that Stripe is not configured (toggles simulated checkout mode)
            return make_response(start_response, {
                "success": False, 
                "mock_mode": True,
                "message": "Stripe secret keys are not configured. Falling back to payment simulator."
            })
            
        try:
            # Auto-resolve host origin fallback links
            origin = environ.get('HTTP_ORIGIN') or environ.get('HTTP_REFERER') or 'http://localhost:8000'
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
                "line_items[0][price_data][unit_amount]": "4900",  # ₹49.00 INR (Stripe expects value in cents/paise)
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
                return make_response(start_response, {"success": True, "url": checkout_url})
                
        except Exception as e:
            return make_response(start_response, {"success": False, "error": str(e)}, "500 Internal Server Error")

    # 2. POST /api/webhook
    elif path == '/api/webhook' and method == 'POST':
        try:
            content_length = int(environ.get('CONTENT_LENGTH', 0))
            post_data = environ['wsgi.input'].read(content_length)
            
            sig_header = environ.get('HTTP_STRIPE_SIGNATURE')
            
            # Secure verify webhook signatures if secret keys are available
            if STRIPE_WEBHOOK_SECRET:
                if not verify_signature(post_data, sig_header, STRIPE_WEBHOOK_SECRET):
                    return make_response(start_response, {"error": "Invalid Signature Signature"}, "400 Bad Request")
            
            event = json.loads(post_data.decode('utf-8'))
            
            if event.get("type") == "checkout.session.completed":
                session = event.get("data", {}).get("object", {})
                metadata = session.get("metadata", {})
                student_id = metadata.get("student_id", "default_student")
                
                # Fetch state from SQLite/PostgreSQL
                state_str = load_state_db()
                state = json.loads(state_str) if state_str else {}
                
                # Ensure structure is safe
                if "stats" not in state:
                    state["stats"] = {"xp": 0, "level": 1, "streak": 0}
                if "unlockedBadges" not in state:
                    state["unlockedBadges"] = []
                if "user" not in state:
                    state["user"] = {}
                    
                # Grant premium rewards
                state["stats"]["xp"] += 200
                if "Elite Thinker" not in state["unlockedBadges"]:
                    state["unlockedBadges"].append("Elite Thinker")
                state["user"]["premium"] = True
                
                # Save state changes
                save_state_db(json.dumps(state))
                print(f"🎉 Webhook Upgraded student premium status successfully!")
                
            return make_response(start_response, {"status": "success"})
        except Exception as e:
            print(f"Webhook execution failure: {e}")
            return make_response(start_response, {"error": str(e)}, "500 Internal Server Error")

    else:
        return make_response(start_response, {"error": "Endpoint not found"}, "404 Not Found")
