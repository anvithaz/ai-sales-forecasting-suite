import os
import resend
from dotenv import load_dotenv

load_dotenv()

resend.api_key = os.getenv("RESEND_API_KEY", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "onboarding@resend.dev")


def send_otp_email(to_email: str, otp: str, expires_in_minutes: int = 10) -> bool:
    """Send a password reset OTP email via Resend."""
    html_body = f"""
    <div style="font-family: 'Segoe UI', sans-serif; background: #0A0E17; color: #e2e8f0; padding: 40px; border-radius: 12px; max-width: 480px; margin: auto;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="font-size: 22px; font-weight: 700; margin: 0; background: linear-gradient(90deg, #6366F1, #2DD4BF); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
          AI Sales Forecasting Suite
        </h1>
      </div>

      <h2 style="font-size: 18px; font-weight: 600; color: #ffffff; margin-bottom: 8px;">Password Reset Code</h2>
      <p style="font-size: 14px; color: #94a3b8; margin-bottom: 28px;">
        Use the code below to reset your password. It expires in <strong style="color: #e2e8f0;">{expires_in_minutes} minutes</strong>.
      </p>

      <div style="background: #131A2A; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 28px;">
        <span style="font-size: 40px; font-weight: 800; letter-spacing: 16px; color: #2DD4BF; font-family: monospace;">
          {otp}
        </span>
      </div>

      <p style="font-size: 12px; color: #64748b; text-align: center;">
        If you did not request a password reset, you can safely ignore this email.
      </p>
    </div>
    """

    resend.Emails.send({
        "from": FROM_EMAIL,
        "to": [to_email],
        "subject": "Your Password Reset Code",
        "html": html_body,
    })
    return True
