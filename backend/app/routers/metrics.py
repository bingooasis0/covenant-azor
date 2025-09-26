
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, or_
from datetime import datetime, timedelta
from app.database import SessionLocal
from app.auth_helper import bearer_sub_and_role
from app import models

router = APIRouter()

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

@router.get("/overview")
def overview(authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    sub, role = bearer_sub_and_role(authorization)
    if not sub: raise HTTPException(status_code=401, detail="Unauthorized")
    base = db.query(models.Referral)
    if role != "COVENANT":
        base = base.filter(models.Referral.agent_id==sub)

    # counts by status
    statuses = ["New","Contacted","Qualified","Proposal Sent","Won","Lost","On Hold","Commission Paid"]
    status_counts = {s: 0 for s in statuses}
    for s, c in db.query(models.Referral.status, func.count(models.Referral.id)).filter(base.whereclause if base.whereclause is not None else True).group_by(models.Referral.status):
        if s in status_counts: status_counts[s] = c
    total = base.count()

    since = datetime.utcnow() - timedelta(days=30)
    delta_total = base.filter(models.Referral.created_at>=since).count()
    delta_won = base.filter(models.Referral.status=="Won", models.Referral.updated_at>=since).count()

    projected = db.query(func.coalesce(func.sum(models.Referral.estimated_commission), 0)).filter(
        or_(models.Referral.status=="Won", models.Referral.status=="Commission Paid"),
        base.whereclause if base.whereclause is not None else True
    ).scalar()

    y = datetime.utcnow().year
    paid_ytd = db.query(func.coalesce(func.sum(models.Referral.commission_paid), 0)).filter(
        extract('year', models.Referral.updated_at)==y,
        models.Referral.commission_paid>0,
        base.whereclause if base.whereclause is not None else True
    ).scalar()

    return {
        "total_referrals": total,
        "delta_total_30d": delta_total,
        "won_deals": status_counts.get("Won",0),
        "delta_won_30d": delta_won,
        "projected_commission": float(projected or 0),
        "paid_commissions_ytd": float(paid_ytd or 0),
        "status_counts": status_counts
    }
