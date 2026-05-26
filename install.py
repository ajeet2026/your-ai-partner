#!/usr/bin/env python3
import subprocess
import sys

def install_dependencies():
    packages = ["fastapi", "uvicorn", "PyJWT", "bcrypt"]
    print("🚀 Installing dependencies for production FastAPI server...")
    
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", *packages])
        print("✅ Dependencies successfully installed!")
    except Exception as e:
        print(f"⚠️ Error installing dependencies: {e}")
        print("Please try running manually: pip install fastapi uvicorn PyJWT bcrypt")

if __name__ == "__main__":
    install_dependencies()
