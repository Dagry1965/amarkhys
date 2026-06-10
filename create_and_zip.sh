#!/usr/bin/env bash
set -e

create files
cat > README.md <<'EOF'

Amarkhys — Garage ERP (starter)
Repository initial pour l'application Garage ERP (Clients, Véhicules, RDV, Interventions, Produits, Commandes, Factures, Paiements, Stock).

Quick start (dev)

Copier .env.example -> .env et remplir les variables.
docker compose up --build
Backend: http://localhost:8000 (FastAPI placeholder) EOF
cat > .env.example <<'EOF'

Postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=amarkhys
POSTGRES_HOST=db
POSTGRES_PORT=5432

Redis
REDIS_URL=redis://redis:6379/0

S3 / MinIO (dev)
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=amarkhys-dev

JWT
JWT_SECRET=change_me_to_secure_value
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

Stripe (dev)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
EOF

cat > docker-compose.yml <<'EOF'
version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7
    ports:
      - "6379:6379"

  minio:
    image: minio/minio
    command: server /data
    environment:
      MINIO_ROOT_USER: ${S3_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${S3_SECRET_KEY}
    ports:
      - "9000:9000"
    volumes:
      - miniodata:/data

  backend:
    build: ./backend
    env_file: .env
    depends_on:
      - db
      - redis
      - minio
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload

volumes:
  pgdata:
  miniodata:
EOF

cat > .gitignore <<'EOF'
.env
pycache/
*.pyc
venv/
node_modules/
*.sqlite3
.DS_Store
EOF

mkdir -p .github/workflows sql/migrations templates backend

cat > .github/workflows/ci.yml <<'EOF'
name: CI

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      - name: Install deps
        run: |
          python -m pip install --upgrade pip
          if [ -f backend/requirements.txt ]; then pip install -r backend/requirements.txt; fi
EOF

cat > backlog.json <<'EOF'
[
  {"title":"T0.1 Repo mono-repo & CI","body":"Init mono-repo structure and CI.","labels":"infra,sprint-0","estimation":"1d"},
  {"title":"T1.1 Auth API","body":"Implement auth endpoints (register/login/refresh).","labels":"backend,auth","estimation":"2d"}
]
EOF

cat > sql/migrations/001_init.sql <<'EOF'
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'staff',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
EOF

cat > templates/issue_template.md <<'EOF'

Description
Acceptance Criteria
[ ] EOF
cat > backend/requirements.txt <<'EOF'
fastapi
uvicorn[standard]
sqlalchemy
alembic
psycopg2-binary
python-dotenv
passlib[bcrypt]
python-jose
pydantic
httpx
redis
boto3
stripe
EOF

create zip
ZIPNAME="init_files.zip"
if command -v zip >/dev/null 2>&1; then
  zip -r "$ZIPNAME" README.md .env.example docker-compose.yml .gitignore .github backlog.json sql templates backend
  echo "Zip créé: $ZIPNAME"
else
  echo "zip non trouvé. Sous Windows PowerShell, utilisez: Compress-Archive -Path README.md, .env.example, docker-compose.yml, .gitignore, .github, backlog.json, sql, templates, backend -DestinationPath init_files.zip"
fi