import os, re, sys, shutil
from pathlib import Path

# -------- util ----------
def read_text(p: Path) -> str:
    return p.read_text(encoding="utf-8")

def write_text(p: Path, content: str):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding="utf-8")

def backup(p: Path):
    if p.exists():
        b = p.with_suffix(p.suffix + ".bak")
        if not b.exists():
            shutil.copy2(p, b)
            print(f"[backup] {p} -> {b}")

def insert_after_first(pattern, insert, content):
    m = pattern.search(content)
    if not m:
        return content
    idx = m.end()
    return content[:idx] + insert + content[idx:]

def ensure_import(content: str, import_line: str) -> str:
    if import_line.strip() in content:
        return content
    lines = content.splitlines()
    last = 0
    for i,l in enumerate(lines):
        if l.strip().startswith("import ") or l.strip().startswith("from "):
            last = i
    lines.insert(last+1, import_line)
    return "\n".join(lines)

def project_root() -> Path:
    return Path(__file__).resolve().parent

def try_paths(*paths):
    for p in paths:
        pp = project_root() / p
        if pp.exists():
            return pp
    return None

# -------- DB patch ----------
def apply_db_patch():
    from sqlalchemy import create_engine, text
    url = os.getenv("DATABASE_URL", "postgresql+psycopg2://azor:azor@127.0.0.1:5432/azor")
    print(f"[db] Using DATABASE_URL={url}")
    engine = create_engine(url, future=True)
    stmts = [
        "ALTER TABLE users     ADD COLUMN IF NOT EXISTS first_name text",
        "ALTER TABLE users     ADD COLUMN IF NOT EXISTS last_name  text",
        "ALTER TABLE referrals ADD COLUMN IF NOT EXISTS company    text",
        "ALTER TABLE referrals ADD COLUMN IF NOT EXISTS ref_no     text",
        "UPDATE referrals SET ref_no = UPPER(SUBSTRING(id::text,1,8)) WHERE ref_no IS NULL",
        "CREATE UNIQUE INDEX IF NOT EXISTS referrals_ref_no_idx ON referrals(ref_no)"
    ]
    with engine.begin() as conn:
        for s in stmts:
            print(f"[db] {s}")
            conn.execute(text(s))
    print("[db] Patch applied.")

# -------- backend: CORS + /referrals/my ----------
def patch_backend():
    import re
    main_py = try_paths("backend/app/main.py", "app/main.py")
    if main_py:
        p = main_py
        backup(p)
        content = read_text(p)
        content = ensure_import(content, "from fastapi.middleware.cors import CORSMiddleware")
        content = re.sub(r"app\.add_middleware\(\s*CORSMiddleware[\s\S]*?\)\s*\)", "##__REMOVED_OLD_CORS__", content, flags=re.MULTILINE)
        allowed_block = '''
ALLOWED_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)
'''.strip()
        if "ALLOWED_ORIGINS" not in content or "allow_credentials=True" not in content:
            content = insert_after_first(re.compile(r"app\s*=\s*FastAPI\([^)]*\)"), "\n\n" + allowed_block + "\n", content)
        else:
            content = re.sub(r"ALLOWED_ORIGINS\s*=\s*\[.*?\][\s\S]*?expose_headers=\[.*?\],\s*\)\s*\)", allowed_block, content, flags=re.DOTALL)
        write_text(p, content)
        print(f"[backend] Patched CORS in {p}")
    else:
        print("[backend] Cannot find app/main.py")

    ref_py = try_paths("backend/app/routers/referrals.py", "app/routers/referrals.py")
    if ref_py:
        p = ref_py
        backup(p)
        content = read_text(p)
        for imp in [
            "from fastapi import APIRouter, Depends, Query",
            "from sqlalchemy.orm import Session",
            "from sqlalchemy import text",
            "from ..db import get_db",
        ]:
            content = ensure_import(content, imp)
        if "get_current_active_user" not in content:
            content = ensure_import(content, "from ..auth.dependencies import get_current_active_user")
        if "/referrals/my" not in content:
            route_func = '''
@router.get("/referrals/my")
def my_referrals(
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    sql = text("""
        SELECT
          id,
          COALESCE(ref_no, UPPER(SUBSTRING(id::text,1,8))) AS ref_no,
          company, status, created_at,
          contact_name, contact_email, contact_phone, notes, agent_id,
          opportunity_types, locations, environment, reason
        FROM referrals
        WHERE agent_id = :uid
        ORDER BY created_at DESC
        LIMIT :lim OFFSET :off
    """ )
    uid = str(getattr(user, "id", user.get("id") if isinstance(user, dict) else user))
    rows = db.execute(sql, {"uid": uid, "lim": limit, "off": offset}).mappings().all()
    return rows
'''.strip("\n")
            content = content.rstrip() + "\n\n" + route_func + "\n"
            write_text(p, content)
            print(f"[backend] Added /referrals/my to {p}")
        else:
            print("[backend] /referrals/my already present")
    else:
        print("[backend] Cannot find routers/referrals.py")

# -------- frontend: axios + modal injector ----------
def _candidate_api_paths():
    return [
        "frontend/lib/api.ts",
        "frontend/src/lib/api.ts",
        "lib/api.ts",
        "src/lib/api.ts",
    ]

def patch_frontend():
    # api.ts
    api_path = None
    for cand in _candidate_api_paths():
        p = project_root() / cand
        if p.exists():
            api_path = p
            break
    if api_path:
        backup(api_path)
        content = read_text(api_path)
        if "axios.create({" in content and "withCredentials" not in content:
            content = content.replace("axios.create({", "axios.create({ withCredentials: true,", 1)
        if "fetchAuditPage(" in content:
            content = content.replace("limit=0", "limit=10").replace("limit: 0", "limit: 10")
        write_text(api_path, content)
        print(f"[frontend] Patched axios credentials and audit pagination in {api_path}")
    else:
        print("[frontend] Could not find lib/api.ts – skipped")

    # modal + auto injector files
    comp_dir = None
    for d in ["frontend/components", "frontend/src/components", "components", "src/components"]:
        p = project_root() / d
        if p.exists():
            comp_dir = p
            break
    if not comp_dir:
        comp_dir = project_root() / "frontend/components"
        comp_dir.mkdir(parents=True, exist_ok=True)

    modal_path = comp_dir / "ForgotPasswordModal.tsx"
    auto_path  = comp_dir / "ForgotPasswordAutoInjector.tsx"

    modal_src = '"use client";\nimport { useState } from "react";\n\nexport default function ForgotPasswordModal({ onSubmit }: { onSubmit: (email: string) => Promise[None] }) {\n  const [open, setOpen] = useState(False);\n  return null\n}\n'
    # Replace with full modal content at runtime below to keep this string small
    auto_src = '"use client";\nimport { useEffect } from "react";\nexport default function ForgotPasswordAutoInjector(){ useEffect(()=>{const a=document.querySelector(\'a[href*="forgot" i]\'); if(!a) return; const h=(e)=>{e.preventDefault(); const open=window.__forgotPwOpen; if(open) open();}; a.addEventListener("click",h); return ()=>a.removeEventListener("click",h);},[]); return null;}\n'

    # overwrite modal with full version
    modal_src = """"use client";
import { useState } from "react";

export default function ForgotPasswordModal({ onSubmit }: { onSubmit: (email: string) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (typeof window !== "undefined") (window as any).__forgotPwOpen = () => setOpen(true);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">Reset password</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                setMsg(null);
                try {
                  await onSubmit(email);
                  setMsg("If that email exists, a reset link has been sent.");
                } catch (e:any) {
                  setMsg(e?.message || "Unable to request reset. Try again.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              <input className="input w-full" type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" className="btn" onClick={() => setOpen(false)} disabled={busy}>Close</button>
                <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Sending..." : "Send link"}</button>
              </div>
              {msg && <p className="mt-3 text-sm opacity-80">{msg}</p>}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
"""

    backup(modal_path); write_text(modal_path, modal_src); print(f"[frontend] Wrote {modal_path}")
    backup(auto_path);  write_text(auto_path, auto_src);  print(f"[frontend] Wrote {auto_path}")

    # mount injector in Next app root
    app_layout = try_paths("frontend/app/layout.tsx", "frontend/src/app/layout.tsx", "app/layout.tsx", "src/app/layout.tsx")
    if app_layout:
        p = app_layout
        backup(p)
        content = read_text(p)
        if "ForgotPasswordAutoInjector" not in content:
            rel = os.path.relpath(auto_path, p.parent).replace("\\", "/")
            if not rel.startswith("."): rel = "./" + rel
            content = ensure_import(content, f"import ForgotPasswordAutoInjector from '{rel}';")
            content = content.replace("</body>", "  <ForgotPasswordAutoInjector />\n    </body>")
            write_text(p, content)
            print(f"[frontend] Injected ForgotPasswordAutoInjector into {p}")
    else:
        app_app = try_paths("frontend/pages/_app.tsx", "pages/_app.tsx", "frontend/src/pages/_app.tsx", "src/pages/_app.tsx")
        if app_app:
            p = app_app
            backup(p)
            content = read_text(p)
            if "ForgotPasswordAutoInjector" not in content:
                rel = os.path.relpath(auto_path, p.parent).replace("\\", "/")
                if not rel.startswith("."): rel = "./" + rel
                content = ensure_import(content, f"import ForgotPasswordAutoInjector from '{rel}';")
                content = content.replace("return (", "return (<>\n      <ForgotPasswordAutoInjector />", 1)
                content = content.replace("</>", "</> )", 1) if "</>" in content else content
                write_text(p, content)
                print(f"[frontend] Injected ForgotPasswordAutoInjector into {p}")
        else:
            print("[frontend] Could not find Next root file to mount injector.")

def main():
    print("== AZOR HOTFIX ==")
    patch_backend()
    apply_db_patch()
    patch_frontend()
    print("== Done. Restart backend and frontend ==")

if __name__ == "__main__":
    main()
