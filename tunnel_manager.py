#!/usr/bin/env python3
import os
import sys
import time
import subprocess
import re
import socket
import threading

# Colors for a gorgeous premium terminal experience
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
BLUE = "\033[94m"
MAGENTA = "\033[95m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
ACTIVE_URL_FILE = os.path.join(DIRECTORY, "active_tunnel_url.txt")

def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

def check_and_start_server():
    if is_port_in_use(PORT):
        print(f"{GREEN}➔ FastAPI backend server is already running on http://localhost:{PORT}{RESET}")
        return None
    
    print(f"{YELLOW}➔ FastAPI backend server is not running. Starting server.py...{RESET}")
    server_script = os.path.join(DIRECTORY, "server.py")
    if not os.path.exists(server_script):
        print(f"{RED}❌ Error: server.py not found in {DIRECTORY}{RESET}")
        sys.exit(1)
        
    proc = subprocess.Popen(
        [sys.executable, server_script],
        cwd=DIRECTORY,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    
    # Wait for server to boot
    for _ in range(10):
        if is_port_in_use(PORT):
            print(f"{GREEN}✓ FastAPI backend server started successfully!{RESET}")
            return proc
        time.sleep(0.5)
        
    print(f"{RED}❌ Error: Server failed to start on port {PORT}.{RESET}")
    return proc

def generate_qr_terminal(url):
    """
    Generate a simple custom text block QR code link for easy terminal scanning
    """
    try:
        # We can create a tiny dynamic Google Charts URL or qrserver link for scanning
        qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={url}"
        print(f"\n{BOLD}{CYAN}📱 SCAN QR CODE TO OPEN ON MOBILE:{RESET}")
        print(f"{BLUE}👉 {qr_url}{RESET}")
    except Exception:
        pass

def print_banner(url, provider_name):
    # Print a premium, gorgeous terminal welcome banner
    terminal_width = 80
    border = "=" * terminal_width
    padding = " " * 4
    
    print("\n" + GREEN + border + RESET)
    print(f"{BOLD}{MAGENTA} 🌌 YOUR AI PARTNER — SMART LIVE HTTPS TUNNEL{RESET}".center(terminal_width + 10))
    print(GREEN + border + RESET)
    print(f"{BOLD}{GREEN}✓ SSH Tunnel established successfully using {provider_name.upper()}!{RESET}".center(terminal_width + 10))
    print()
    print(f"{CYAN}  🌐 PUBLIC HTTPS URL:{RESET}")
    print(f"     👉 {BOLD}{GREEN}{url}{RESET}")
    print()
    print(f"{YELLOW}  💾 LOCAL BACKEND API:{RESET}")
    print(f"     👉 http://localhost:{PORT}")
    print()
    print(f"{BLUE}  📝 ACTIVE TUNNEL LOGGED TO:{RESET}")
    print(f"     👉 {ACTIVE_URL_FILE}")
    print()
    print(f"{YELLOW}  ✨ Tip: Anyone can open this link to log in, learn, and upgrade with UPI QR.{RESET}")
    print(f"{YELLOW}          This console keeps the connection alive automatically.{RESET}")
    print(GREEN + border + RESET)
    
    # Save active URL to file
    try:
        with open(ACTIVE_URL_FILE, "w") as f:
            f.write(url)
    except Exception as e:
        print(f"{RED}⚠️ Warning: Could not write active URL to file: {e}{RESET}")
        
    generate_qr_terminal(url)

def run_tunnel(provider="localhost_run"):
    """
    Launches and monitors the tunnel process. Parses output dynamically for URLs.
    """
    if provider == "localhost_run":
        cmd = [
            "ssh",
            "-o", "StrictHostKeyChecking=no",
            "-o", "ServerAliveInterval=30",
            "-o", "ServerAliveCountMax=3",
            "-R", f"80:localhost:{PORT}",
            "nokey@localhost.run"
        ]
        provider_name = "localhost.run"
        url_regex = re.compile(r'https?://[a-zA-Z0-9.-]+\.lhr\.life')
    else:  # pinggy
        cmd = [
            "ssh",
            "-o", "StrictHostKeyChecking=no",
            "-o", "ServerAliveInterval=30",
            "-p", "443",
            "-R", f"0:localhost:{PORT}",
            "a.pinggy.io"
        ]
        provider_name = "pinggy.io"
        url_regex = re.compile(r'https?://[a-zA-Z0-9.-]+\.pinggy\.link')

    print(f"\n{YELLOW}⚡ Connecting to {provider_name} SSH tunnel...{RESET}")
    
    proc = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )
    
    active_url = None
    
    # Read output in real-time
    for line in iter(proc.stdout.readline, ''):
        # Look for URL in output
        match = url_regex.search(line)
        if match:
            url = match.group(0)
            if url != active_url:
                active_url = url
                print_banner(url, provider_name)
        
        # Fallback print for pinggy initial credentials or errors
        if "pinggy" in line.lower() and "http" in line and not active_url:
            # Try parsing custom pinggy outputs
            m = re.search(r'(https://[a-zA-Z0-9.-]+\.pinggy\.link)', line)
            if m:
                active_url = m.group(1)
                print_banner(active_url, provider_name)
                
        # Debug helper prints (hidden standard outputs, shows only errors or connectivity steps)
        if "warning" in line.lower() or "error" in line.lower() or "denied" in line.lower():
            print(f"{RED}[Tunnel Status] {line.strip()}{RESET}")
            
    proc.wait()
    return proc.returncode

def main():
    print(f"{BOLD}{MAGENTA}=================================================================={RESET}")
    print(f"{BOLD}{CYAN}🚀 Launching Your AI Partner Tunnel & Server Environment{RESET}")
    print(f"{BOLD}{MAGENTA}=================================================================={RESET}")
    
    # 1. Start server.py if not active
    server_process = check_and_start_server()
    
    # 2. Start SSH tunnel in a resilient self-healing loop
    providers = ["localhost_run", "pinggy"]
    current_idx = 0
    
    try:
        while True:
            provider = providers[current_idx]
            start_time = time.time()
            exit_code = run_tunnel(provider)
            duration = time.time() - start_time
            
            print(f"\n{RED}⚠️ Tunnel connection lost (Exit code: {exit_code}). Re-establishing...{RESET}")
            
            # If the tunnel lasted less than 10 seconds, it's failing instantly.
            # Sleep longer to allow OS socket/network stack to recover (fixes Mac sleep/wake bug).
            if duration < 10:
                sleep_time = 15
                print(f"{YELLOW}⚠️ Rapid failure detected (lasted {duration:.1f}s). Network/Socket recovery state. Sleeping for {sleep_time}s...{RESET}")
            else:
                sleep_time = 3
                
            time.sleep(sleep_time)
            
            # Switch provider on failure to ensure maximum reliability and uptime!
            current_idx = (current_idx + 1) % len(providers)
            print(f"{YELLOW}➔ Switching to alternative provider ({providers[current_idx]}) for resilience...{RESET}")
            
    except KeyboardInterrupt:
        print(f"\n\n{YELLOW}🛑 Stopping tunnel and cleaning up processes... Goodbye!{RESET}")
        if server_process:
            server_process.terminate()
            print(f"{GREEN}✓ Backend server stopped.{RESET}")
        try:
            if os.path.exists(ACTIVE_URL_FILE):
                os.remove(ACTIVE_URL_FILE)
        except Exception:
            pass

if __name__ == "__main__":
    main()
