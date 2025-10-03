# backend/app/routers/admin_test.py

from fastapi import APIRouter, Depends
from app.dependencies import require_admin
from app.graph_mail import send_mail
from app.config import settings

router = APIRouter(prefix="/admin", tags=["admin-test"])

@router.post("/test-email")
def send_test_email(admin=Depends(require_admin)):
    """Send a test email to verify email configuration"""
    admin_user_id, admin_email = admin

    subject = "Test Email from Covenant Partner Portal"
    body = f"""This is a test email from the Covenant Partner Portal.

Your email system is configured correctly and working as expected.

Sent to: {admin_email}
System: Covenant Partner Portal
MS Graph Sender: {settings.MS_GRAPH_SENDER}

Visit: https://partner.covenanttechnology.net"""

    send_mail([admin_email], subject, body)

    return {"ok": True, "sent_to": admin_email}
