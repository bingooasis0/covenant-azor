# backend/app/routers/feedback.py

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.dependencies import get_db, require_auth
from app.notifications.notifier import notify_feedback
import uuid

router = APIRouter(prefix="/feedback", tags=["feedback"])

class FeedbackRequest(BaseModel):
    subject: str
    body: str
    cc: Optional[str] = None
    attachment_ids: Optional[List[str]] = None

@router.post("/files", status_code=200)
async def upload_feedback_file(
    file: UploadFile = File(...),
    auth=Depends(require_auth),
    db: Session = Depends(get_db)
):
    """
    Upload a file for feedback attachment.
    Files are temporarily stored and will be included in the email.
    """
    user_id, role = auth

    # Read file content
    content = await file.read()
    file_size = len(content)

    # Validate file size (max 25MB)
    MAX_SIZE = 25 * 1024 * 1024
    if file_size > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 25MB)")

    # Store file in database
    file_id = str(uuid.uuid4())
    db.execute(
        text("""
            INSERT INTO feedback_files (id, user_id, name, size_bytes, content_type, data, metadata)
            VALUES (:id, :user_id, :name, :size, :content_type, :data, :metadata)
        """),
        {
            "id": file_id,
            "user_id": user_id,
            "name": file.filename,
            "size": file_size,
            "content_type": file.content_type,
            "data": content,
            "metadata": "{}"
        }
    )
    db.commit()

    return {
        "id": file_id,
        "name": file.filename,
        "size": file_size,
        "content_type": file.content_type
    }

@router.post("/send", status_code=200)
def send_feedback(
    feedback: FeedbackRequest,
    auth=Depends(require_auth),
    db: Session = Depends(get_db)
):
    """
    Send feedback email from authenticated user.

    - Validates user is authenticated
    - Retrieves user's name and email
    - Fetches attachment metadata if provided
    - Sends professional feedback email to feedback@covenanttechnology.net
    - Logs the feedback submission in audit trail
    """
    user_id, role = auth

    # Get user details
    user = db.execute(
        text("SELECT email, first_name, last_name FROM users WHERE id = :uid"),
        {"uid": user_id}
    ).mappings().first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    from_email = user["email"]
    first_name = user.get("first_name") or ""
    last_name = user.get("last_name") or ""
    from_name = f"{first_name} {last_name}".strip() or from_email

    # Get attachment details if provided
    attachments = []
    file_attachments = []
    if feedback.attachment_ids:
        for att_id in feedback.attachment_ids:
            att_data = db.execute(
                text("""
                    SELECT name, size_bytes, content_type, data
                    FROM feedback_files
                    WHERE id = :id AND user_id = :uid
                """),
                {"id": att_id, "uid": user_id}
            ).mappings().first()

            if att_data:
                # Metadata for email body
                attachments.append({
                    "name": att_data["name"],
                    "size": att_data["size_bytes"],
                    "content_type": att_data.get("content_type", "application/octet-stream")
                })
                # Actual file content for email attachment
                file_attachments.append({
                    "name": att_data["name"],
                    "content_type": att_data.get("content_type", "application/octet-stream"),
                    "content": att_data["data"]
                })

    # Send feedback email
    try:
        notify_feedback(
            from_email=from_email,
            from_name=from_name,
            subject_line=feedback.subject,
            message_body=feedback.body,
            cc=feedback.cc,
            attachments=attachments if attachments else None,
            file_attachments=file_attachments if file_attachments else None
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send feedback: {str(e)}"
        )

    return {
        "success": True,
        "message": "Feedback sent successfully"
    }
