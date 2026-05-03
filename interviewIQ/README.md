# 🤖 InterviewIQ.AI

> An AI-powered mock interview platform with real-time voice interaction, resume analysis, personalized question generation, and detailed performance analytics.

🔗 **Live Demo:** [https://ai-interviewer-iq-clients.onrender.com](https://ai-interviewer-iq-clients.onrender.com)

---

## 📸 Features

- 🎙️ **Voice Interview** — Real-time speech-to-text captures your answers naturally
- 📄 **Resume Analysis** — AI extracts your role, skills, and projects from uploaded PDF
- 🧠 **AI Question Generation** — Personalized questions based on role, experience, and resume
- 📊 **Performance Analytics** — Scores on confidence, communication, and correctness
- 🗣️ **AI Interviewer Voice** — Text-to-speech AI interviewer with human-like pacing
- 💳 **Credit System** — Razorpay payment integration for purchasing interview credits
- 📈 **Interview History** — Track all past interviews and performance trends
- 📥 **PDF Report Download** — Download detailed interview report as PDF

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 19 + Vite | UI Framework |
| Tailwind CSS v4 | Styling |
| Redux Toolkit | State Management |
| Framer Motion | Animations |
| Web Speech API | Voice Recognition & TTS |
| Firebase Auth | Google Authentication |
| Recharts | Performance Charts |
| jsPDF | PDF Report Generation |
| Razorpay | Payment Integration |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express 5 | REST API Server |
| MongoDB + Mongoose | Database |
| JWT + Cookies | Authentication |
| Multer + pdfjs-dist | Resume Upload & Parsing |
| OpenRouter API (GPT-4o-mini) | AI Question & Feedback Generation |
| Razorpay SDK | Payment Processing |

---

## 🏗️ System Architecture

```
User
 │
 ├── React Frontend (Render Static)
 │     ├── Firebase Google Auth
 │     ├── Web Speech API (mic input)
 │     ├── SpeechSynthesis API (AI voice)
 │     └── Razorpay Checkout
 │
 └── Express Backend (Render Web Service)
       ├── JWT Auth Middleware
       ├── Multer (PDF Upload)
       ├── pdfjs-dist (PDF Parsing)
       ├── OpenRouter API (GPT-4o-mini)
       ├── Razorpay SDK
       └── MongoDB Atlas
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- OpenRouter API key
- Firebase project
- Razorpay account

### 1. Clone the repository
```bash
git clone https://github.com/Nirmalakhadka18/AI_Interviewer_IQ.git
cd AI_Interviewer_IQ/interviewIQ
```

### 2. Setup Server
```bash
cd server
npm install
```

Create `.env` file in `server/`:
```env
PORT=8000
MONGODB_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
OPENROUTER_API_KEY=your_openrouter_api_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
CLIENT_URL=http://localhost:5173
```

```bash
npm run dev
```

### 3. Setup Client
```bash
cd client
npm install
```

Create `.env` file in `client/`:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
VITE_SERVER_URL=http://localhost:8000
```

```bash
npm run dev
```

### 4. Open in browser
```
http://localhost:5173
```

---

## 📁 Project Structure

```
interviewIQ/
├── client/                   # React frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── Step1Setup    # Interview setup & resume upload
│   │   │   ├── Step2Interview# Live voice interview
│   │   │   └── Step3Report   # Performance report
│   │   ├── pages/            # Route pages
│   │   ├── redux/            # State management
│   │   └── utils/            # Firebase config
│   └── vite.config.js
│
└── server/                   # Node.js backend
    ├── controllers/          # Business logic
    ├── models/               # MongoDB schemas
    ├── routes/               # API routes
    ├── middlewares/          # Auth & file upload
    ├── services/             # OpenRouter & Razorpay
    └── config/               # DB & token config
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/google` | Google OAuth login |
| GET | `/api/auth/logout` | Logout user |

### User
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/current-user` | Get logged in user |

### Interview
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/interview/resume` | Upload & analyze resume |
| POST | `/api/interview/generate-questions` | Generate AI questions |
| POST | `/api/interview/submit-answer` | Submit & evaluate answer |
| POST | `/api/interview/finish` | Finish interview & get report |
| GET | `/api/interview/get-interview` | Get interview history |
| GET | `/api/interview/report/:id` | Get interview report |

### Payment
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payment/order` | Create Razorpay order |
| POST | `/api/payment/verify` | Verify payment & add credits |

---

## 💡 Key Implementation Highlights

- **Stale Closure Fix** — Used `useRef` for `isAIPlaying`, `isMicOn`, and `answer` to prevent stale closure bugs in Speech Recognition callbacks
- **PDF Parsing** — Server-side PDF text extraction using `pdfjs-dist` without any external service
- **AI Prompt Engineering** — Carefully crafted system prompts for consistent JSON responses from GPT-4o-mini
- **Credit System** — Each interview costs 50 credits, preventing API abuse
- **Secure File Handling** — Path traversal prevention with filename sanitization and directory validation

---

## 🌐 Deployment

| Service | Platform |
|---|---|
| Frontend | Render Static Site |
| Backend | Render Web Service |
| Database | MongoDB Atlas |

---

## 📄 License

MIT License — feel free to use this project for learning and portfolio purposes.

---

## 👨‍💻 Author

**Nirmala Khadka**
- GitHub: [@Nirmalakhadka18](https://github.com/Nirmalakhadka18)

---

⭐ If you found this project helpful, please give it a star!
