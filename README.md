# 🎓 Your AI Partner — Premium Full-Stack Study Tutor

**Your AI Partner** is a highly advanced, gamified, and secure personalized learning management companion. Engineered to act as a 24/7 empathetic tutor, it integrates local LLM execution, high-speed cloud AI processing, interactive analytics, and robust full-stack security.

🚀 **Live Production Link**: [https://your-ai-partner-ajeet-ai-partner-team.vercel.app](https://your-ai-partner-ajeet-ai-partner-team.vercel.app)

---

## ✨ Premium Features

### 1. 📷 Multimodal Vision Doubt Solver
Upload images of textbook pages, handwritten math equations, or complex diagrams. The backend routes visual payloads to Google's Gemini 2.5 Flash model, delivering instant, step-by-step solutions and conceptual breakdowns.

### 2. 📊 GitHub-Style Study Activity Heatmap
Gamify study routines with an elegant, green glassmorphic learning activity grid. Spanning 371 days (53 weeks), it dynamically maps study consistency—completed planning tasks, wellness logs, chat counts, and finished diagnostic tests—into varying emerald-green color intensities with hover tooltips.

### 3. 🎴 AI 3D Revision Flashcards Revision Center
Generate flippable study flashcard decks on any academic subject. Utilizes advanced CSS 3D perspectives, preserves-3d transforms, and backface visibility, enabling students to flip cards on click to reveal AI-generated concept explanations.

### 4. ⚡ Local Ollama & Cloud Gemini Dual Processing
Choose between:
* **Local Processing**: Run offline models (like `gemma3:1b`) directly on your machine's CPU utilizing Ollama API.
* **Cloud Processing**: Utilize Google Gemini 2.5 Flash for high-speed (~1s) execution and zero local thermal strain.

### 5. 🔐 Hardened Production Security
* **Backend API Key Proxy (`/api/gemini/generate`)**: Eliminates frontend exposure of Google API credentials.
* **CORS Access Rules**: Restricted to authorized origins (`http://localhost:8000` and Vercel domains).
* **Cryptographic Signatures**: Standard password hashing via `bcrypt` and JWT session tokens.

---

## 🛠️ Technology Stack
* **Frontend**: Vanilla HTML5, CSS3 (harmonics, glassmorphism, responsive flex layouts), Vanilla Javascript (ES6).
* **Backend**: FastAPI (Python), uvicorn.
* **Database**: Persistent SQLite (local development) / PostgreSQL integration (production).
* **Integrations**: Google Gemini API, Stripe Payment Gateway (Billing & webhook sync).

---

## 🚀 Installation & Local Setup

### Prerequisites
* Python 3.8+
* Node.js (for Vercel deployment toolchains)
* [Ollama](https://ollama.com/) (Optional: for local offline processing)

### Quick Start
1. **Clone the repository**:
   ```bash
   git clone https://github.com/ajeet2026/your-ai-partner.git
   cd "your ai partner"
   ```

2. **Install dependencies**:
   Run the automated installer script:
   ```bash
   python3 install.py
   ```
   *Alternatively, manually install dependencies:*
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables**:
   Create a `.env` file or export your keys:
   ```bash
   export GEMINI_API_KEY="your-google-gemini-key"
   export JWT_SECRET="your-session-secret"
   ```

4. **Launch the Local Development Server**:
   ```bash
   python3 run.py
   ```
   *This starts the lightweight local API server on `http://localhost:8000`.*

5. **Start the Tunnel Manager (For External access/Sharing)**:
   ```bash
   python3 tunnel_manager.py
   ```
   *Automatically launches FastAPI, configures Cloudflare reverse tunnels, generates QR codes, and keeps links synced.*

---

## 📦 Cloud Deployment (Vercel)
This repository is configured to deploy serverless functions to Vercel via [vercel.json](file:///Users/ajeetkumar/Desktop/your%20ai%20partner%20/vercel.json):
* Front-facing static files (`index.html`, `app.js`, `index.css`) are served statically.
* Backend requests under `/api/*` are mapped to [api/index.py](file:///Users/ajeetkumar/Desktop/your%20ai%20partner%20/api/index.py) to run serverless Python endpoints.
