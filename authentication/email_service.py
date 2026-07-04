import os
import smtplib

from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from dotenv import load_dotenv

load_dotenv()

EMAIL = os.getenv("EMAIL_ID")
APP_PASSWORD = os.getenv("EMAIL_ID_PASS")


def send_otp_email(receiver_email: str, otp: str):

    message = MIMEMultipart("alternative")

    message["Subject"] = "AI Safety Layer - Email Verification"

    message["From"] = EMAIL

    message["To"] = receiver_email

  
   
    html = f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#0a0a0c;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#0a0a0c" style="background-color:#0a0a0c;">
<tr><td align="center" style="padding:60px 20px;font-family:-apple-system,'Segoe UI',Arial,sans-serif;">

<table role="presentation" width="560" cellpadding="0" cellspacing="0" bgcolor="#18181c" style="
    max-width:560px;
    background-color:#18181c;
    border-radius:16px;
    border:1px solid #303038;
">

<!-- Header -->
<tr><td style="padding:48px 48px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
        <td style="
            width:40px;height:40px;
            background:#ffffff;
            border-radius:10px;
            text-align:center;
            vertical-align:middle;
            font-size:18px;
            color:#000000;
            font-weight:700;
        ">AI</td>
        <td style="padding-left:14px;vertical-align:middle;">
            <p style="margin:0;color:#ffffff;font-size:15px;font-weight:600;">AI Safety Layer</p>
        </td>
    </tr>
    </table>
</td></tr>

<!-- Body -->
<tr><td style="padding:40px 48px 8px;">
    <h1 style="margin:0 0 14px;color:#ffffff;font-size:24px;font-weight:600;letter-spacing:-0.3px;">
        Verify your email
    </h1>
    <p style="margin:0 0 36px;color:#d4d4d8;font-size:15px;line-height:1.65;">
        Enter this code to confirm it's you. It's valid for the next 5 minutes.
    </p>

    <!-- OTP -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#222228" style="
        background-color:#222228;
        border:1px solid #38383f;
        border-radius:12px;
        margin-bottom:28px;
    ">
    <tr><td style="padding:28px;text-align:center;">
        <div style="
            font-size:38px;
            font-weight:700;
            letter-spacing:12px;
            color:#ffffff;
            font-family:'SF Mono','Courier New',monospace;
        ">{otp}</div>
    </td></tr>
    </table>

    <p style="margin:0 0 30px;font-size:13px;color:#a1a1aa;line-height:1.6;">
        Don't share this code with anyone. AI Safety Layer staff will never ask for it.
    </p>

    <div style="height:1px;background:#303038;margin-bottom:28px;"></div>

    <p style="margin:0 0 40px;font-size:13px;color:#a1a1aa;line-height:1.6;">
        Didn't request this? You can safely ignore this email — no changes have been made to your account.
    </p>
</td></tr>

<!-- Footer -->
<tr><td style="padding:24px 48px 40px;">
    <p style="margin:0;color:#71717a;font-size:12px;">
        AI Safety Layer — Secure AI-powered code analysis
    </p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>
"""

    message.attach(
        MIMEText(
            html,
            "html"
        )
    )

    with smtplib.SMTP(
        "smtp.gmail.com",
        587
    ) as server:

        server.starttls()

        server.login(
            EMAIL,
            APP_PASSWORD.replace(" ", "")
        )

        server.sendmail(
            EMAIL,
            receiver_email,
            message.as_string()
        )