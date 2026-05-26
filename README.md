# 🚀 AI Sales Forecasting Platform

A high-performance sales forecasting and business intelligence platform powered by Next.js 15, FastAPI, and Groq (Llama-3.3-70B). This application allows businesses to upload historical sales data, generate predictive forecasts, and receive AI-driven executive insights.

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, Tailwind CSS, Recharts, Lucide, Framer Motion (`motion/react`).
- **Backend**: Python, FastAPI, SQLite (SQLAlchemy), JWT Authentication.
- **AI Engine**: Groq (Llama-3.3-70B-Versatile) for analysis and narratives.

---

## 🏗️ Quick Setup Guide

### 1. Prerequisites
- **Python 3.9+**
- **Node.js 18.17+**
- **Groq API Key** (Get it at [Groq Console](https://console.groq.com/))

### 2. Backend Installation
Navigate to the `backend/` directory:
```bash
cd backend
```

1. **Create and Activate Virtual Environment**:
   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\activate

   # macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the `backend/` directory:
   ```env
   DATABASE_URL=sqlite:///./sales_db.sqlite3
   SECRET_KEY=your-jwt-secret-key-change-this
   # Optional: Default API Key if not provided by user
   GROQ_API_KEY=your_groq_api_key
   ```

4. **Start the Server**:
   ```bash
   uvicorn main:app --reload
   ```
   *The backend will run at `http://localhost:8000`*

---

### 3. Frontend Installation
Navigate to the `frontend/` directory:
```bash
cd frontend
```

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env.local` file in the `frontend/` directory:
   ```env
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
   ```

3. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   *The frontend will run at `http://localhost:3000`*

---

## 📈 Initial Workflow for New Users

1. **Sign Up**: Create an account on the `/auth` page.
2. **Setup AI**: Go to **Settings > API & Integrations** and paste your **Groq API Key**. This key is used for generating insights and the forecasting narrative.
3. **Upload Data**: Go to **Data Upload** and drag-and-drop a CSV or Excel file. 
   - *Ensure your file has a column for dates (e.g., 'Date', 'Order Date') and a numeric 'Sales' or 'Revenue' column.*
4. **Analyze**: 
   - View your **Dashboard** for instant KPIs.
   - Use the **Analytics** tab for AI-powered executive summaries.
   - Navigate to **Forecasts** to run predictive models across Daily, Weekly, or Monthly horizons.
