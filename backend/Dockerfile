# backend/Dockerfile
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1     PYTHONUNBUFFERED=1

WORKDIR /app

# System deps for psycopg2 and build
RUN apt-get update && apt-get install -y --no-install-recommends     build-essential libpq-dev curl && rm -rf /var/lib/apt/lists/*

# Install requirements
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -U pip &&     if [ -f /app/requirements.txt ]; then pip install --no-cache-dir -r /app/requirements.txt;     else pip install --no-cache-dir fastapi uvicorn sqlalchemy psycopg2-binary alembic passlib[bcrypt] redis; fi

# Copy source
COPY backend /app

# Expose
EXPOSE 8000

# Env (override in runtime)
ENV UVICORN_HOST=0.0.0.0     UVICORN_PORT=8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
