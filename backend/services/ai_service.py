import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

def get_ai_insight(kpis: dict, user_api_key: str = None) -> dict:
    if not user_api_key:
        return {
            "summary": "AI Insight unavailable. Please configure your personal Groq API Key in Settings.",
            "recommendation": "Set API key in Settings to enable live insights.",
            "insights": []
        }

    client = OpenAI(
        base_url="https://api.groq.com/openai/v1",
        api_key=user_api_key
    )
    
    prompt = f"""
    Act as a high-level business data analyst. Analyze these retail KPIs for a dynamic executive dashboard:
    - Total Revenue: {kpis.get('total_revenue')}
    - Growth Rate: {kpis.get('growth_rate')}
    - Sales Variance: {kpis.get('sales_variance')}
    - Peak Sales Day: {kpis.get('peak_sales_day')}
    - Average Order Value: {kpis.get('average_order_value')}
    
    You MUST return ONLY a valid JSON object with this exact structure:
    {{
        "summary": "A concise 2-3 sentence high-level executive overview of business performance written as a business narrative.",
        "recommendation": "A single actionable recommendation starting with 'Recommended: '",
        "insights": [
            {{
                "title": "Short insight title",
                "description": "Detailed 1-2 sentence insight description based on the data.",
                "impact": "High",
                "type": "opportunity"
            }},
            {{
                "title": "Short insight title",
                "description": "Detailed 1-2 sentence insight description based on the data.",
                "impact": "Medium",
                "type": "anomaly"
            }},
            {{
                "title": "Short insight title",
                "description": "Detailed 1-2 sentence insight description based on the data.",
                "impact": "Critical",
                "type": "risk"
            }}
        ]
    }}

    Rules:
    - 'type' MUST be one of: 'opportunity', 'anomaly', 'risk'
    - 'impact' MUST be one of: 'High', 'Medium', 'Critical', 'Low'
    - Return EXACTLY 3 insights — one of each type
    - Return ONLY valid JSON, no markdown fences, no extra text
    """
    
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=700,
            response_format={ "type": "json_object" }
        )
        
        content = response.choices[0].message.content
        return json.loads(content)
        
    except Exception as e:
        print(f"AI Service Error: {str(e)}")
        return {
            "summary": f"Business performance shows a growth rate of {kpis.get('growth_rate', 'N/A')} with a peak sales day of {kpis.get('peak_sales_day', 'N/A')}. Revenue trends indicate stability with monitoring in progress.",
            "recommendation": "Recommended: Maintain current inventory levels and monitor the upcoming seasonal demand cycle closely.",
            "insights": [
                {
                    "title": "Revenue Momentum Detected",
                    "description": f"Current growth rate of {kpis.get('growth_rate', 'N/A')} suggests a positive momentum window. Consider capitalizing with targeted promotions.",
                    "impact": "High",
                    "type": "opportunity"
                },
                {
                    "title": "Sales Variance Requires Monitoring",
                    "description": f"Sales variance of {kpis.get('sales_variance', 'N/A')} indicates some instability. Investigate period-over-period fluctuations for root cause.",
                    "impact": "Medium",
                    "type": "anomaly"
                },
                {
                    "title": "Peak Demand Concentration Risk",
                    "description": "Revenue appears concentrated around a single peak period. Over-reliance on peak days increases susceptibility to demand shocks.",
                    "impact": "Critical",
                    "type": "risk"
                }
            ]
        }

def chat_with_ai(kpis: dict, history: list, message: str, user_api_key: str = None) -> str:
    if not user_api_key:
        return "I am currently disconnected. Please configure your personal Groq API Key in your Profile Settings."

    client = OpenAI(
        base_url="https://api.groq.com/openai/v1",
        api_key=user_api_key
    )

    system_prompt = f"""
    Act as a high-level business data analyst and strategic AI assistant.
    You are integrated directly into a dynamic executive dashboard for a retail company.
    
    Current Dashboard Performance Context (KPIs):
    - Total Revenue: {kpis.get('total_revenue', 'N/A')}
    - Growth Rate: {kpis.get('growth_rate', 'N/A')}
    - Average Order Value: {kpis.get('average_order_value', 'N/A')}
    - Peak Sales Day: {kpis.get('peak_sales_day', 'N/A')}
    - Sales Variance: {kpis.get('sales_variance', 'N/A')}
    
    Answer the user's strategic questions directly using this provided data.
    Be concise, professional, and directly state actionable insights without overly verbose filler.
    Use Markdown for formatting if helpful (e.g., bolding important metrics).
    """

    messages = [{"role": "system", "content": system_prompt}]
    
    for msg in history[-10:]:
        messages.append({
            "role": msg.get("role", "user") if isinstance(msg, dict) else msg.role, 
            "content": msg.get("content", "") if isinstance(msg, dict) else msg.content
        })
        
    messages.append({"role": "user", "content": message})

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=800
        )
        return response.choices[0].message.content
        
    except Exception as e:
        print(f"AI Service Error (Chat): {str(e)}")
        return "I am currently experiencing higher than normal analytical load. Please try your request again shortly."


def get_forecast_narrative(summary_stats: dict, horizon: int, aggregation: str,
                           category: str = None, user_api_key: str = None) -> str:
    """Generate a natural-language forecast explanation using AI."""
    if not user_api_key:
        trend = summary_stats.get("trend", "stable")
        projected = summary_stats.get("projected_total", "N/A")
        return (
            f"Based on historical data, revenue shows a {trend} trend. "
            f"The model projects {projected} over the next {horizon} {aggregation.lower()} periods.\n"
            f"(Please configure your personal Groq API Key in Settings for deep AI projections)"
        )

    client = OpenAI(base_url="https://api.groq.com/openai/v1", api_key=user_api_key)
    cat_note = f" for the '{category}' category" if category else ""

    prompt = f"""You are an expert business analyst embedded in an AI forecasting dashboard.
Analyze the following forecast summary statistics{cat_note} and write a professional,
concise 2-3 sentence explanation of the {horizon}-period {aggregation} forecast.

Stats:
- Trend direction: {summary_stats.get('trend')}
- Growth rate (historical): {summary_stats.get('growth_rate')}
- Confidence score: {summary_stats.get('confidence_score')}%
- Average historical period revenue: {summary_stats.get('avg_historical')}
- Projected total over forecast horizon: {summary_stats.get('projected_total')}
- Historical data points used: {summary_stats.get('data_points')}

Instructions:
- Mention the trend direction and what is driving it.
- Reference the projected total and confidence level.
- End with one concrete strategic recommendation.
- Write in a direct, professional tone. No bullet points. Plain prose only."""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=300,
        )
        return response.choices[0].message.content.strip()

    except Exception as e:
        print(f"Forecast Narrative Error: {str(e)}")
        trend = summary_stats.get("trend", "stable")
        projected = summary_stats.get("projected_total", "N/A")
        confidence = summary_stats.get("confidence_score", "N/A")
        return (
            f"Based on the historical analysis, sales show a {trend} trend{cat_note}. "
            f"The model projects {projected} in total revenue over the next {horizon} "
            f"{aggregation.lower()} periods with a {confidence}% confidence score. "
            f"Align inventory and promotional spend with the projected demand curve "
            f"to maximize capture of the upcoming growth window."
        )
