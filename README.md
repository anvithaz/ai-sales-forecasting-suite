# AI Sales Forecasting & Business Analytics Suite

> Full-stack web application that transforms raw CSV sales data into KPI dashboards, AI-generated executive summaries, and 3-month revenue forecasts — without requiring a dedicated data science team.

Built during a 4-month internship at **Genplus Consulting Services (Genesis)** as part of the VTU Internship Program, Batch 2026.

---

## What It Does

Small and medium businesses store sales data in CSV files with no way to extract actionable intelligence quickly. This platform solves that by combining classical statistical modeling, machine learning, and conversational AI into a single accessible web app.

Upload a CSV. Get instant KPIs, regional analysis, product bundling insights, a 3-month forecast, and a plain-English AI summary — in under 2 seconds.

---

## My Contribution

I designed and built the **KPI Engine and AI Analytics module** — the core computational intelligence layer of the platform.

### `kpi_engine.py` — KPI Computation
Processes raw CSV sales data using Pandas to compute five business metrics:

| KPI | Formula | Live Output |
|-----|---------|-------------|
| Total Revenue | `df['Amount'].sum()` | ₹4,37,771 |
| Avg Order Value | `groupby('Order ID').mean()` | ₹291.85 |
| Peak Sales Day | `groupby('Order Date').idxmax()` | 10 March 2018 |
| Monthly Growth | `resample('M').pct_change()` | −22.5% |
| Profit Volatility | `df['Profit'].var()` | High Variance |

Also implements:
- **Regional analysis** — top 5 states by revenue (Maharashtra: ₹1,02,498 / 299 orders)
- **Market basket analysis** — co-occurrence matrix for product bundling (Hankerchief + Stole: 59 combos)

### `ai_engine.py` — Groq LLM Integration
Integrates **Groq API (Llama-3.3-70b-versatile)** to convert KPI outputs into natural-language business intelligence.

```
Live AI output:
"The company is experiencing a decline in revenue with a 22.5% monthly growth 
decrease, but promoting product bundles such as Hankerchief and Stole 
(combined count: 59) could help increase average order value and mitigate 
the decline."
```

Both functions include graceful fallback — API endpoints never crash due to LLM unavailability.

---

## System Architecture

```
Presentation Tier     →    Application Tier        →    Data Tier
Next.js 15 + React 19      Python 3.12 + FastAPI        SQLite + Local CSV
Tailwind CSS + Recharts     kpi_engine.py                orders.csv
localhost:3000              ai_engine.py                 details.csv
                            forecasting.py (Holt-Winters)
                            main.py (API router)
                                   ↓
                           External APIs
                           Groq (Llama-3.3-70b)
                           FRED (macro data)
                           Open-Meteo (weather)
                           Resend (email OTP)
```

---

## API Endpoints

| Method | Endpoint | Returns |
|--------|----------|---------|
| GET | `/api/dashboard/summary` | Total revenue, AOV, growth, peak day |
| GET | `/api/dashboard/products` | Product breakdown + regional heatmap |
| GET | `/api/dashboard/ai-analysis` | Groq LLM executive insight string |
| GET | `/api/dashboard/all` | All modules + 3-month forecast |

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| Frontend | Next.js 15, React 19, TypeScript 5.9, Tailwind CSS 4.1, Recharts |
| Backend | Python 3.12, FastAPI 0.136, Uvicorn |
| Database | SQLite, SQLAlchemy ORM v2.0 |
| **My Module** | **Pandas v3.0, NumPy v2.4** |
| **My Module** | **Groq API — Llama-3.3-70b-versatile** |
| ML / Forecasting | Statsmodels (Holt-Winters), XGBoost v3.2 |
| Security | python-jose (JWT), passlib (bcrypt) |
| DevOps | Git, GitHub, Vercel |

---

## Live Results (Production Dataset)

```
Total Revenue       : ₹4,37,771
Avg Order Value     : ₹291.85
Peak Sales Day      : 10 March 2018
Monthly Growth      : −22.5%
Top Region          : Maharashtra — ₹1,02,498 from 299 orders
Top Bundle          : Hankerchief + Stole — 59 co-occurrences
3-Month Forecast    : Jan ₹39,458 → Feb ₹41,337 → Mar ₹43,216 (+9.5% trend)
AI Response Time    : ~1.2 seconds (Llama-3.3-70b-versatile)
```

---

## Key Challenges Solved

| Challenge | Solution |
|-----------|----------|
| CSV column name mismatches causing KeyError | Applied `.str.strip()` and case-insensitive matching before processing |
| Indian date format (DD-MM-YYYY) parsed incorrectly | Passed `dayfirst=True` to `pd.to_datetime()` |
| Groq returning unstructured markdown output | Strict system prompt + try-except with clean fallback |
| Port conflict on backend restart | `lsof -ti :8000 \| xargs kill -9` before uvicorn start |

---

## Run Locally

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001

# Frontend
cd frontend
npm install
npm run dev
```

Set environment variables in `.env`:
```
GROQ_API_KEY=your_key_here
SECRET_KEY=your_jwt_secret
RESEND_API_KEY=your_resend_key
```

---

## Author

**Anvitha N C** — Industrial Engineering & Management, BMSCE Bengaluru  
[LinkedIn](https://linkedin.com/in/anvitha-nc) · ncanvitha@gmail.com
