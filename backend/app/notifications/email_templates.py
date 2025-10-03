# backend/app/notifications/email_templates.py
from datetime import datetime
from typing import Optional, Sequence

# Plain-text templates (intentionally simple for deliverability).

def referral_submitted(ref_no: str, company: str, agent_email: str, agent_name: str, created_at: Optional[datetime]=None, extra: Optional[dict]=None) -> tuple[str, str]:
    subject = f"Referral Submitted • {ref_no} • {company}"
    lines = [
        f"Referral: {ref_no}",
        f"Company:  {company}",
        f"Agent:    {agent_name} <{agent_email}>",
        f"Time:     {(created_at or datetime.utcnow()).isoformat()}Z",
        "",
    ]
    if extra:
        for k,v in extra.items():
            lines.append(f"{k}: {v}")
        lines.append("")
    lines.append("Visit: https://partner.covenanttechnology.net")
    return subject, "\n".join(lines)

def referral_updated(ref_no: str, company: str, updates: dict, actor_email: str, actor_name: str) -> tuple[str,str]:
    subject = f"Referral Updated • {ref_no} • {company}"
    lines = [
        f"Referral: {ref_no}",
        f"Company:  {company}",
        f"Actor:    {actor_name} <{actor_email}>",
        "Updates:",
    ]
    for k,v in updates.items():
        lines.append(f"  - {k}: {v}")
    lines += ["", "Visit: https://partner.covenanttechnology.net"]
    return subject, "\n".join(lines)

def referral_note(ref_no: str, company: str, note: str, agent_email: str, agent_name: str) -> tuple[str,str]:
    subject = f"Referral Note • {ref_no} • {company}"
    body = (
        f"Referral: {ref_no}\n"
        f"Company:  {company}\n"
        f"Agent:    {agent_name} <{agent_email}>\n"
        f"\n"
        f"Note:\n{note}\n\nVisit: https://partner.covenanttechnology.net"
    )
    return subject, body

def admin_outbound(subject: str, body_text: str, footer: Optional[str]=None) -> tuple[str,str]:
    body = body_text.rstrip()
    if footer:
        body += "\n\n" + footer.strip()
    return subject, body

def support_contact(agent_email: str, agent_name: str, message: str) -> tuple[str,str]:
    subject = "Support Contact (Agent Message)"
    body = (
        f"From: {agent_name} <{agent_email}>\n\n"
        f"{message}\n\nVisit: https://partner.covenanttechnology.net"
    )
    return subject, body

def feedback_submission(
    from_email: str,
    from_name: str,
    subject_line: str,
    message_body: str,
    cc: Optional[str] = None,
    attachments: Optional[Sequence[dict]] = None
) -> tuple[str, str]:
    """
    Professional feedback email template following industry best practices.

    Best practices implemented:
    - Clear, descriptive subject line with context
    - Structured body with sender information prominently displayed
    - Organized sections for easy scanning
    - Professional tone and formatting
    - Clear action items/context
    - Proper attribution and timestamp
    """
    timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

    # Professional subject with clear context
    email_subject = f"User Feedback: {subject_line}"

    # Build professional email body
    lines = [
        "=" * 70,
        "NEW FEEDBACK SUBMISSION",
        "=" * 70,
        "",
        "SENDER INFORMATION",
        "-" * 70,
        f"From:        {from_name}",
        f"Email:       {from_email}",
    ]

    if cc:
        lines.append(f"CC:          {cc}")

    lines.extend([
        f"Submitted:   {timestamp}",
        "",
        "SUBJECT",
        "-" * 70,
        subject_line,
        "",
        "MESSAGE",
        "-" * 70,
        message_body,
        "",
    ])

    # Add attachments section if present
    if attachments:
        lines.extend([
            "ATTACHMENTS",
            "-" * 70,
        ])
        for att in attachments:
            file_name = att.get("name", "Unknown")
            file_size = att.get("size", 0)
            content_type = att.get("content_type", "Unknown")
            lines.append(f"  • {file_name}")
            lines.append(f"    Size: {file_size:,} bytes ({file_size/1024:.1f} KB)")
            lines.append(f"    Type: {content_type}")
            lines.append("")

    lines.extend([
        "=" * 70,
        "",
        "This is an automated message from the Azor Referral System.",
        "Please respond to the sender directly at the email address listed above.",
        "",
        f"System: Azor Platform • {timestamp}",
        "Sender: noreply@covenanttechnology.net"
    ])

    return email_subject, "\n".join(lines)

def admin_password_reset(user_email: str, user_name: str, new_password: str) -> tuple[str, str]:
    """Email template for admin-initiated password reset with generated password."""
    subject = "Your Password Has Been Reset"
    body = f"""Hello {user_name or user_email},

Your password has been reset by an administrator.

Your new temporary password is:
{new_password}

For security reasons, please:
1. Log in to your account immediately
2. Change this password to something only you know
3. Enable multi-factor authentication (MFA) for added security

If you did not request this password reset, please contact your administrator immediately.

Visit: https://partner.covenanttechnology.net"""
    return subject, body

def admin_mfa_reset(user_email: str, user_name: str) -> tuple[str, str]:
    """Email template for admin-initiated MFA reset."""
    subject = "Your Multi-Factor Authentication Has Been Reset"
    body = f"""Hello {user_name or user_email},

Your multi-factor authentication (MFA) has been reset by an administrator.

What this means:
- Your current MFA setup has been removed
- You will need to re-enroll in MFA on your next login
- Simply log in with your email and password to begin the enrollment process

How to re-enroll:
1. Go to the login page
2. Enter your email and password
3. Follow the on-screen instructions to set up MFA with your authenticator app

If you did not request this MFA reset, please contact your administrator immediately.

Visit: https://partner.covenanttechnology.net"""
    return subject, body

def user_created(user_email: str, user_name: str, password: str, role: str) -> tuple[str, str]:
    """Email template for new user account creation."""
    subject = "Welcome to Azor - Your Account Has Been Created"
    body = f"""Hello {user_name or user_email},

Your account has been created by an administrator.

Account Details:
- Email: {user_email}
- Role: {role}
- Temporary Password: {password}

To get started:
1. Log in to your account at the Azor portal
2. Use the credentials provided above
3. For security, please change your password after logging in
4. Set up multi-factor authentication (MFA) for added security

If you have any questions or did not expect this account creation, please contact your administrator.

Visit: https://partner.covenanttechnology.net"""
    return subject, body
