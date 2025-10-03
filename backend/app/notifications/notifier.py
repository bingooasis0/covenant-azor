# backend/app/notifications/notifier.py

from typing import Iterable, Optional, Sequence
import os
from app.notifications import email_templates as T

# Reuse existing Graph mail helper
# Expected existing helper: app/graph_mail.py with send_mail(to_list, subject, body_text)
try:
    from app.graph_mail import send_mail as graph_send_mail
except Exception as e:  # graceful fallback placeholder
    def graph_send_mail(to_list: Sequence[str], subject: str, body_text: str):
        raise RuntimeError("Graph mail helper not found; cannot send mail") from e

# Configuration
DL_NOTIFICATIONS = os.environ.get("NOTIFY_DL", "A-ZReferrals@covenanttechnology.net")
BOT_SENDER = os.environ.get("MS_GRAPH_SENDER", "bot@covenanttechnology.net")

def _tolist(x: Optional[Sequence[str] | str]) -> list[str]:
    if not x:
        return []
    if isinstance(x, str):
        return [x]
    return list(x)

def notify_referral_submitted(to: Optional[Sequence[str] | str],
                              ref_no: str, company: str, agent_email: str, agent_name: str,
                              extra: Optional[dict]=None, file_attachments: Optional[Sequence[dict]]=None):
    recipients = _tolist(to) or [DL_NOTIFICATIONS]
    subject, body = T.referral_submitted(ref_no, company, agent_email, agent_name, extra=extra)
    graph_send_mail(recipients, subject, body, attachments=file_attachments)

def notify_referral_updated(to: Optional[Sequence[str] | str],
                            ref_no: str, company: str, updates: dict, actor_email: str, actor_name: str):
    recipients = _tolist(to) or [DL_NOTIFICATIONS]
    subject, body = T.referral_updated(ref_no, company, updates, actor_email, actor_name)
    graph_send_mail(recipients, subject, body)

def notify_referral_note(note_to: Optional[Sequence[str] | str],
                         ref_no: str, company: str, note: str, agent_email: str, agent_name: str):
    recipients = _tolist(note_to) or [DL_NOTIFICATIONS]
    subject, body = T.referral_note(ref_no, company, note, agent_email, agent_name)
    graph_send_mail(recipients, subject, body)

def notify_admin_outbound(to: Sequence[str] | str, subject: str, body_text: str, footer: Optional[str]=None):
    recipients = _tolist(to)
    if not recipients:
        raise ValueError("admin outbound requires recipients")
    subj, body = T.admin_outbound(subject, body_text, footer=footer)
    graph_send_mail(recipients, subj, body)

def notify_password_reset(to: str, user_name: str, new_password: str):
    """Send password reset email with new temporary password."""
    subject, body = T.admin_password_reset(to, user_name, new_password)
    graph_send_mail([to], subject, body)

def notify_mfa_reset(to: str, user_name: str):
    """Send MFA reset notification email."""
    subject, body = T.admin_mfa_reset(to, user_name)
    graph_send_mail([to], subject, body)

def notify_user_created(to: str, user_name: str, password: str, role: str):
    """Send welcome email with account credentials to newly created user."""
    subject, body = T.user_created(to, user_name, password, role)
    graph_send_mail([to], subject, body)

def notify_support(to: Optional[Sequence[str] | str],
                   agent_email: str, agent_name: str, message: str):
    recipients = _tolist(to) or [DL_NOTIFICATIONS]
    subject, body = T.support_contact(agent_email, agent_name, message)
    graph_send_mail(recipients, subject, body)

def notify_feedback(
    from_email: str,
    from_name: str,
    subject_line: str,
    message_body: str,
    cc: Optional[str] = None,
    attachments: Optional[Sequence[dict]] = None,
    file_attachments: Optional[Sequence[dict]] = None,
    to: Optional[Sequence[str] | str] = None
):
    """
    Send feedback email to designated recipients.

    Args:
        attachments: Metadata for display in email body
        file_attachments: Actual file content for email attachments (name, content_type, content)
    """
    recipients = _tolist(to) or ["feedback@covenanttechnology.net"]

    # Add CC recipients if provided
    if cc:
        cc_list = [email.strip() for email in cc.split(",") if email.strip()]
        recipients.extend(cc_list)

    # Generate professional email
    subject, body = T.feedback_submission(
        from_email=from_email,
        from_name=from_name,
        subject_line=subject_line,
        message_body=message_body,
        cc=cc,
        attachments=attachments
    )

    graph_send_mail(recipients, subject, body, attachments=file_attachments)
