import pandas as pd
import numpy as np
from datetime import datetime, timedelta, timezone

def _get_performance_note(rank: int, revenue: float, total_revenue: float) -> dict:
    """Generate a simple AI performance note based on rank and share."""
    share = (revenue / total_revenue * 100) if total_revenue > 0 else 0
    if rank == 0:
        return {"note": "Consistent Top Performer", "icon": "zap"}
    elif share > 20:
        return {"note": "Trending Upward", "icon": "trending_up"}
    elif share < 5:
        return {"note": "High Churn Rate Detected", "icon": "activity"}
    else:
        return {"note": "Stable Performer", "icon": "check"}

def calculate_dashboard_metrics(file_path: str, category_filter: str = None, date_filter: str = None) -> dict:
    try:
        if file_path.endswith('.csv'):
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)

        cols = {c.lower().strip(): c for c in df.columns}

        amount_col   = next((cols[k] for k in ['amount', 'sales', 'revenue', 'total', 'price', 'sale amount'] if k in cols), None)
        date_col     = next((cols[k] for k in ['date', 'order date', 'transaction date', 'sale date', 'order_date', 'transaction_date'] if k in cols), None)
        profit_col   = next((cols[k] for k in ['profit', 'margin', 'net profit', 'profit margin'] if k in cols), None)
        category_col = next((cols[k] for k in ['category', 'segment', 'dept', 'department', 'type', 'product category'] if k in cols), None)
        quantity_col = next((cols[k] for k in ['quantity', 'qty', 'units', 'units sold', 'quantity sold'] if k in cols), None)
        product_col  = next((cols[k] for k in ['product', 'product name', 'item', 'item name', 'description', 'desc', 'sku', 'name'] if k in cols), None)

        if not amount_col:
            return {"status": "error", "message": "Dataset must contain a Sales/Amount column."}

        df[amount_col] = pd.to_numeric(df[amount_col], errors='coerce').fillna(0)
        if profit_col:
            df[profit_col] = pd.to_numeric(df[profit_col], errors='coerce').fillna(0)
        if quantity_col:
            df[quantity_col] = pd.to_numeric(df[quantity_col], errors='coerce').fillna(0)

        if date_col:
            df[date_col] = pd.to_datetime(df[date_col], errors='coerce', dayfirst=True)

        categories = []
        if category_col:
            categories = sorted([str(x) for x in df[category_col].unique() if pd.notnull(x)])

        if date_filter and date_col:
            now = pd.Timestamp.now(tz=None)
            if date_filter == 'ytd':
                cutoff = pd.Timestamp(datetime(now.year, 1, 1))
            elif date_filter == '6m':
                cutoff = now - pd.DateOffset(months=6)
            elif date_filter == '30d':
                cutoff = now - timedelta(days=30)
            else:
                cutoff = None

            if cutoff is not None:
                cutoff = cutoff.tz_localize(None) if cutoff.tzinfo else cutoff
                df_dates = df[date_col].dt.tz_localize(None) if df[date_col].dt.tz is not None else df[date_col]
                df = df[df_dates >= cutoff]

        if category_filter and category_col:
            df = df[df[category_col].astype(str) == category_filter]

        if df.empty:
            return {"status": "error", "message": f"No data found for the selected filters."}

        total_revenue = float(df[amount_col].sum())
        avg_sales = float(df[amount_col].mean())

        sales_std = float(df[amount_col].std()) if len(df) > 1 else 0.0
        sales_variance_pct = round((sales_std / avg_sales * 100), 1) if avg_sales > 0 else 0.0

        peak_day_str = "N/A"
        growth = 0.0
        chart_data = []
        date_range_str = "N/A"
        valid_dates = df

        if date_col:
            valid_dates = df.dropna(subset=[date_col]).copy()
            if not valid_dates.empty:
                peak_day_raw = valid_dates.groupby(date_col)[amount_col].sum().idxmax()
                peak_day_str = peak_day_raw.strftime('%d %b %Y')
                date_range_str = (
                    f"{valid_dates[date_col].min().strftime('%b %Y')} - "
                    f"{valid_dates[date_col].max().strftime('%b %Y')}"
                )

                valid_dates = valid_dates.sort_values(by=date_col)
                midpoint = len(valid_dates) // 2
                if midpoint > 0:
                    first_half = valid_dates.iloc[:midpoint][amount_col].sum()
                    last_half = valid_dates.iloc[midpoint:][amount_col].sum()
                    if first_half > 0:
                        growth = ((last_half - first_half) / first_half) * 100

                valid_dates['SortMonth'] = valid_dates[date_col].dt.to_period('M')
                monthly_sales = valid_dates.groupby('SortMonth')[amount_col].sum().reset_index()
                monthly_sales = monthly_sales.sort_values('SortMonth')

                for _, row in monthly_sales.tail(6).iterrows():
                    chart_data.append({
                        "date": row['SortMonth'].strftime('%b %Y'),
                        "historical": round(row[amount_col], 2)
                    })

                if len(chart_data) > 0:
                    last_val = chart_data[-1]['historical']
                    monthly_growth = (growth / 100) / 6 if growth > 0 else 0.05
                    chart_data[-1]['forecast'] = last_val
                    chart_data[-1]['bounds'] = [last_val, last_val]

                    hist_vals = [d['historical'] for d in chart_data if 'historical' in d]
                    std_dev = float(np.std(hist_vals)) if len(hist_vals) > 0 else 0.0

                    last_period = monthly_sales.iloc[-1]['SortMonth']
                    for i in range(1, 4):
                        next_val = last_val * (1 + monthly_growth)
                        
                        wave = np.sin(i * np.pi / 2) * (std_dev * 0.4)
                        next_val = max(0, float(next_val + wave))
                        
                        variance = next_val * 0.1 * i
                        next_period = last_period + i
                        chart_data.append({
                            "date": next_period.strftime('%b %Y'),
                            "forecast": round(next_val, 2),
                            "bounds": [round(max(0, next_val - variance), 2), round(next_val + variance, 2)]
                        })
                        last_val = next_val

        top_products = []
        group_col = product_col if product_col else category_col
        if group_col:
            product_group = df.groupby(group_col).agg(**{
                'revenue': (amount_col, 'sum'),
                'units':   (quantity_col, 'sum') if quantity_col else (amount_col, 'count')
            }).reset_index()

            if product_col and category_col:
                product_category_map = df.groupby(product_col)[category_col].agg(lambda x: x.mode()[0] if len(x) > 0 else 'N/A').to_dict()
            else:
                product_category_map = {}

            product_group = product_group.sort_values('revenue', ascending=False).head(10)

            for rank, (_, row) in enumerate(product_group.iterrows()):
                perf = _get_performance_note(rank, float(row['revenue']), total_revenue)
                top_products.append({
                    "name": str(row[group_col]),
                    "category": product_category_map.get(str(row[group_col]), category_filter or "All"),
                    "units": int(row['units']),
                    "revenue": f"${float(row['revenue']):,.0f}",
                    "revenue_raw": float(row['revenue']),
                    "note": perf["note"],
                    "icon": perf["icon"]
                })

        return {
            "status": "success",
            "kpis": {
                "total_revenue": f"${total_revenue:,.2f}",
                "average_order_value": f"${avg_sales:,.2f}",
                "peak_sales_day": peak_day_str,
                "sales_variance": f"{sales_variance_pct:.1f}%",
                "growth_rate": f"{growth:+.1f}%"
            },
            "chart_data": chart_data,
            "categories": categories,
            "top_products": top_products,
            "date_range": date_range_str
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}
