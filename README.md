# 🎓 Academic Performance Analyser (APA)

APA is a web-based platform designed to simplify academic management for faculty in higher education institutions. It automates mark entry, analyzes student performance, generates reports, and sends notifications to students.

link:https://apas-pvdp.vercel.app/login
---

## 🚀 Features

- 📥 Auto Data Entry from PDF/Excel
- 📊 Performance Visualization (Bar & Pie Charts)
- 📄 PDF Report Generation
- 📧 Email Notifications (partially implemented)
- 🔐 Secure Login (Firebase Auth)
- 📁 Cloud File Uploads (AWS S3 - optional)

---

## 🛠️ Tech Stack

### Frontend
- React.js
- Recharts, jsPDF, jsPDF-AutoTable
- pdf-parse, xlsx
- Firebase Auth
- Axios, React-Toastify

### Backend
- Node.js, Express.js
- MongoDB, Mongoose
- Nodemailer, Firebase-Admin
- pdf-parse, xlsx, multer
- AWS SDK (optional)

---

## ⚙️ Prerequisites

- Node.js v16+
- MongoDB (local/cloud)
- Firebase Account
- Gmail App Password
- AWS (for S3 uploads - optional)
- Git

---

## 📦 Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-repo/academic-performance-analyser.git
   cd academic-performance-analyser



# client/.env
REACT_APP_FIREBASE_API_KEY=your_key
REACT_APP_API_URL=http://localhost:5000/api

# backend/.env
MONGO_URI=your_mongo_uri
EMAIL_USER=your_email
EMAIL_PASS=your_app_password




# Frontend
cd frontend
npm install pdf-parse recharts jspdf jspdf-autotable xlsx react react-dom react-router-dom axios firebase react-toastify animate.css

# Backend
cd ../backend
npm install express mongoose nodemailer pdf-parse xlsx firebase-admin cors multer nodemon



# Backend
npm start

# Frontend (in another terminal)
cd frontend
npm start

