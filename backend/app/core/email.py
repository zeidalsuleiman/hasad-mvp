import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


def send_email(to_email: str, subject: str, html_body: str) -> None:
    """
    Send an email via SMTP.

    In DEBUG mode:
      - The subject/recipient are always logged so OTPs are visible in backend logs.
      - If SMTP is not configured or delivery fails, the error is logged and the
        function returns normally (registration/reset can still complete).

    In production (DEBUG=False):
      - Raises RuntimeError if SMTP is not configured.
      - Raises smtplib.SMTPException on delivery failure.
    """
    if not settings.smtp_host:
        if settings.debug:
            logger.warning(
                "[DEV] SMTP not configured — email suppressed. "
                "To=%s Subject=%s",
                to_email, subject,
            )
            return
        raise RuntimeError(
            "Email delivery is not configured. "
            "Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM in your environment."
        )

    msg = MIMEMultipart("alternative")
    msg["From"] = settings.smtp_from
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.ehlo()
            if settings.smtp_tls:
                server.starttls()
                server.ehlo()
            if settings.smtp_user and settings.smtp_password_clean:
                server.login(settings.smtp_user, settings.smtp_password_clean)
            server.sendmail(settings.smtp_from, to_email, msg.as_string())
        logger.info("Email sent to %s: %s", to_email, subject)
    except Exception as exc:
        if settings.debug:
            logger.warning(
                "[DEV] SMTP delivery failed (%s) — email suppressed. To=%s Subject=%s",
                exc, to_email, subject,
            )
            return
        raise


def send_verification_email(to_email: str, otp: str) -> None:
    if settings.debug:
        logger.info("[DEV] Verification OTP for %s: %s", to_email, otp)
    subject = "HASAD – Verify Your Email"
    body = f"""
<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;">
  <h2 style="color:#163B1E;">Email Verification</h2>
  <p>Use the code below to verify your HASAD account:</p>
  <div style="font-size:48px;font-weight:700;letter-spacing:12px;
              background:#F0FDF4;border-radius:8px;padding:24px;
              text-align:center;color:#163B1E;margin:24px 0;">
    {otp}
  </div>
  <p style="color:#666;">This code expires in 24 hours. Do not share it with anyone.</p>
</div>
"""
    send_email(to_email, subject, body)


def send_password_reset_email(to_email: str, otp: str) -> None:
    if settings.debug:
        logger.info("[DEV] Password reset OTP for %s: %s", to_email, otp)
    subject = "HASAD – Password Reset Code"
    body = f"""
<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;">
  <h2 style="color:#163B1E;">Password Reset</h2>
  <p>Use the code below to reset your HASAD password:</p>
  <div style="font-size:48px;font-weight:700;letter-spacing:12px;
              background:#FFF7ED;border-radius:8px;padding:24px;
              text-align:center;color:#92400E;margin:24px 0;">
    {otp}
  </div>
  <p style="color:#666;">This code expires in 1 hour. If you did not request a reset, ignore this email.</p>
</div>
"""
    send_email(to_email, subject, body)
