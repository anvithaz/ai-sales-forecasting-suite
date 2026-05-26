import pandas as pd
import numpy as np
from datetime import timedelta
from statsmodels.tsa.holtwinters import ExponentialSmoothing


def _find_col(cols_map: dict, *candidates):
    for c in candidates:
        if c in cols_map:
            return cols_map[c]
    return None


def run_forecast(file_path: str, horizon: int = 30, aggregation: str = "Monthly",
                 category_filter: str = None):
    """
    Load dataset, aggregate, fit a linear trend and project forward.

    Returns a dict with:
      - status
      - historical: list of {date, value}
      - forecast:   list of {date, predicted, upper, lower}
      - summary_stats: trend / confidence / growth_rate / etc.
      - categories: list of unique category strings
      - date_range: "Jan 2024 - Dec 2024"
    """
    try:
        if file_path.endswith(".csv"):
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)

        cols = {c.lower().strip(): c for c in df.columns}

        amount_col   = _find_col(cols, "amount", "sales", "revenue", "total", "price", "sale amount")
        date_col     = _find_col(cols, "date", "order date", "transaction date", "sale date",
                                 "order_date", "transaction_date")
        category_col = _find_col(cols, "category", "segment", "dept", "department",
                                 "type", "product category")

        if not amount_col:
            return {"status": "error", "message": "Dataset must contain a Sales/Amount column."}
        if not date_col:
            return {"status": "error", "message": "Dataset must contain a Date column to run forecasts."}

        df[amount_col] = pd.to_numeric(df[amount_col], errors="coerce").fillna(0)
        df[date_col]   = pd.to_datetime(df[date_col], errors="coerce", dayfirst=True)
        df = df.dropna(subset=[date_col])

        categories = []
        if category_col:
            categories = sorted([str(x) for x in df[category_col].unique() if pd.notnull(x)])

        if category_filter and category_col:
            df = df[df[category_col].astype(str) == category_filter]

        if df.empty:
            return {"status": "error", "message": f"No data for category: {category_filter}"}

        df = df.sort_values(date_col)

        agg_map = {"Daily": "D", "Weekly": "W", "Monthly": "ME"}
        freq = agg_map.get(aggregation, "ME")

        ts = df.set_index(date_col)[amount_col].resample(freq).sum()
        ts = ts[ts > 0]

        if len(ts) < 2:
            return {"status": "error",
                    "message": "Not enough data points after aggregation. Try a lower aggregation level."}

        date_range_str = (
            f"{ts.index.min().strftime('%b %Y')} \u2013 {ts.index.max().strftime('%b %Y')}"
        )

        y = ts.values.astype(float)

        seasonal_periods = None
        if aggregation == "Monthly":
            seasonal_periods = 12
        elif aggregation == "Weekly":
            seasonal_periods = 52
        elif aggregation == "Daily":
            seasonal_periods = 7
            
        use_seasonal = (seasonal_periods is not None) and (len(y) >= 2 * seasonal_periods)

        try:
            if use_seasonal:
                model = ExponentialSmoothing(y, trend='add', seasonal='add', seasonal_periods=seasonal_periods, initialization_method="estimated")
                fit_model = model.fit()
            else:
                if len(y) >= 3:
                    model = ExponentialSmoothing(y, trend='add', damped_trend=True, initialization_method="estimated")
                    fit_model = model.fit()
                else:
                    model = ExponentialSmoothing(y, initialization_method="estimated")
                    fit_model = model.fit()
        except Exception as e:
            return {"status": "error", "message": f"Forecasting model failed: {str(e)}"}

        fitted_values = fit_model.fittedvalues
        residuals = y - fitted_values
        std_residual = float(np.std(residuals)) if len(residuals) > 0 else 0.0

        avg_val = float(np.mean(y))
        if len(fitted_values) >= 2:
            overall_slope = float(fitted_values[-1] - fitted_values[0]) / len(fitted_values)
        else:
            overall_slope = 0.0
            
        if avg_val == 0:
            trend = "flat"
        else:
            pct = overall_slope / avg_val * 100
            if pct > 1:
                trend = "upward"
            elif pct < -1:
                trend = "downward"
            else:
                trend = "flat"

        if avg_val > 0:
            cv = std_residual / avg_val
            confidence_score = max(50, min(98, int(100 - cv * 100)))
        else:
            confidence_score = 50

        mid = len(y) // 2
        first_half = float(np.sum(y[:mid]))
        second_half = float(np.sum(y[mid:]))
        if first_half > 0:
            growth_rate = ((second_half - first_half) / first_half) * 100
        else:
            growth_rate = 0.0

        fmt_map = {"Daily": "%d %b %Y", "Weekly": "%d %b %Y", "Monthly": "%b %Y"}
        fmt = fmt_map.get(aggregation, "%b %Y")

        historical = [
            {"date": dt.strftime(fmt), "historical": round(float(val), 2)}
            for dt, val in zip(ts.index, ts.values)
        ]

        forecast_vals = fit_model.forecast(horizon)
        
        if freq == "D":
            delta = timedelta(days=1)
        elif freq == "W":
            delta = timedelta(weeks=1)
        else:
            delta = None

        last_date = ts.index[-1]
        forecast = []
        projected_total = 0.0

        is_fallback = not use_seasonal
        resid_array = residuals if len(residuals) > 0 else np.array([0])

        for i, proj_val in enumerate(forecast_vals):
            if is_fallback:
                wiggle = resid_array[i % len(resid_array)]
                proj_val += wiggle
                
            proj_val = max(0, float(proj_val))

            step = i + 1
            margin = std_residual * (1 + 0.08 * step)
            upper  = round(proj_val + margin, 2)
            lower  = round(max(0, proj_val - margin), 2)

            if delta:
                proj_date = last_date + delta * i
            else:
                proj_date = last_date + pd.DateOffset(months=i)

            forecast.append({
                "date":      proj_date.strftime(fmt),
                "predicted": round(proj_val, 2),
                "upper":     upper,
                "lower":     lower,
            })
            projected_total += proj_val

        return {
            "status":     "success",
            "historical": historical,
            "forecast":   forecast,
            "summary_stats": {
                "trend":           trend,
                "confidence_score": confidence_score,
                "projected_total": f"${projected_total:,.0f}",
                "avg_historical":  f"${avg_val:,.0f}",
                "growth_rate":     f"{growth_rate:+.1f}%",
                "slope":           round(overall_slope, 4),
                "data_points":     len(ts),
            },
            "categories": categories,
            "date_range": date_range_str,
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}
