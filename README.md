<div align="center">

# 🛡️ SentinelX SIEM

**Production-grade, cloud-native, multi-tenant Security Information & Event Management Platform**

[![CI](https://github.com/yourusername/sentinelx-siem/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/sentinelx-siem/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-cyan.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.12-blue)](https://python.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-green)](https://fastapi.tiangolo.com)

*Inspired by Sumo Logic Cloud SIEM, Splunk, Chronicle, and Elastic Security*

![SentinelX Dashboard](docs/assets/dashboard-preview.png)

</div>

---

## ✨ Features

| Category | Capabilities |
|---|---|
| **Ingestion** | 100k+ EPS, Kafka-backed, compression, bulk APIs |
| **Parsing** | Syslog, CloudTrail, Windows Events, K8s, Docker, Firewall |
| **Detection** | Threshold, Correlation, Sigma rules, Behavioral analytics |
| **Alerting** | Slack, Discord, PagerDuty, Email, HMAC Webhooks |
| **Search** | SIEM query language, ClickHouse analytics, facets, aggregations |
| **Realtime** | WebSocket streaming, Redis PubSub, live dashboards |
| **AI** | Alert summaries, NL search, threat analysis, attack chains |
| **Multi-tenancy** | org_id isolation, Supabase RLS, RBAC |
| **Observability** | Prometheus metrics, Grafana dashboards, OpenTelemetry |
| **Deployment** | Docker Compose, Kubernetes, Helm, GitHub Actions CI/CD |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   SentinelX Platform                    │
├─────────────┬───────────────┬───────────────────────────┤
│  Frontend   │  API Gateway  │   Microservices            │
│  Next.js 15 │  FastAPI :8000│                           │
│  Port: 3000 │  CORS / Auth  │  ingestion :8001           │
│             │  Rate Limiting│  auth      :8002           │
│             │  Proxy Router │  alerts    :8004           │
│             │               │  search    :8005           │
│             │               │  websocket :8006           │
│             │               │  ai        :8007           │
└─────────────┴───────────────┴───────────────────────────┘
                      │
        ┌─────────────┼──────────────────┐
        ▼             ▼                  ▼
   Apache Kafka    Redis 7          ClickHouse 23.8
   (Streaming)  (Cache/PubSub)    (Log Analytics)
        │
   ┌────┴────────────────────┐
   │   Kafka Topics          │
   │  raw-logs               │
   │  normalized-logs        │
   │  detection-events       │
   │  alerts                 │
   └─────────────────────────┘
        │
   ┌────┴────────────────────┐
   │  Supabase PostgreSQL    │
   │  (Metadata + Auth)      │
   │  Row Level Security     │
   │  Multi-tenant RBAC      │
   └─────────────────────────┘
```

---

## 📁 Project Structure

```
sentinelx/
├── backend/
│   ├── shared/                     # Shared library
│   │   ├── config.py               # Pydantic settings
│   │   ├── models/events.py        # Pydantic event schemas
│   │   ├── kafka/
│   │   │   ├── producer.py         # Async Kafka producer
│   │   │   └── consumer.py         # Async Kafka consumer
│   │   ├── db/                     # DB clients
│   │   └── auth/                   # JWT + RBAC
│   ├── services/
│   │   ├── api-gateway/            # Reverse proxy + auth middleware
│   │   ├── ingestion-service/      # Log ingestion + Kafka publish
│   │   ├── parser-service/         # Normalize + ClickHouse write
│   │   ├── detection-service/      # Rule evaluation + alert create
│   │   ├── alert-service/          # Alert CRUD + notifications
│   │   ├── search-service/         # SIEM query → ClickHouse SQL
│   │   ├── auth-service/           # JWT + RBAC + API keys
│   │   ├── ai-service/             # LLM integrations
│   │   └── websocket-gateway/      # WS server + Redis PubSub
│   ├── workers/                    # Celery tasks
│   ├── tests/                      # pytest test suites
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── login/              # Auth page
│   │   │   ├── dashboard/          # SOC Command Center
│   │   │   ├── alerts/             # Alert queue + investigation
│   │   │   ├── incidents/          # Incident management + timeline
│   │   │   ├── logs/               # Live log stream
│   │   │   ├── rules/              # Detection rule editor
│   │   │   ├── search/             # SIEM search workspace
│   │   │   └── settings/           # Org settings
│   │   ├── hooks/
│   │   │   └── useRealtimeStream.ts # WebSocket hook
│   │   └── lib/
│   │       └── api.ts              # Typed API client
│   └── Dockerfile
│
├── database/
│   ├── supabase/
│   │   ├── migrations/
│   │   │   └── 0001_initial_schema.sql
│   │   └── rls_policies.sql        # Row Level Security
│   └── clickhouse/
│       └── schema.sql              # Partitioned log table
│
├── infra/
│   ├── docker/                     # Per-service Dockerfiles
│   ├── kubernetes/
│   │   ├── namespace.yaml
│   │   └── api-gateway.yaml
│   ├── prometheus.yml
│   └── ci/
│
├── .github/
│   └── workflows/
│       ├── ci.yml                  # Lint + test
│       └── build.yml               # Docker build + GHCR push
│
├── docker-compose.yml              # Full local dev stack
├── .env.example                    # Environment template
└── .gitignore
```

---

## 🚀 Quick Start

### Prerequisites
- Docker Desktop
- Node.js 20+
- Python 3.12+

### 1. Clone & Configure
```bash
git clone https://github.com/yourusername/sentinelx-siem.git
cd sentinelx-siem
cp .env.example .env
# Edit .env with your Supabase URL, keys, and OpenAI API key
```

### 2. Start Infrastructure
```bash
# Starts Kafka, ClickHouse, Redis, Prometheus, Grafana
docker compose up -d zookeeper kafka redis clickhouse prometheus grafana
```

### 3. Apply Database Schema
```sql
-- In your Supabase SQL Editor:
-- Run database/supabase/migrations/0001_initial_schema.sql
-- Run database/supabase/rls_policies.sql
```

### 4. Start Backend Services
```bash
# Start all backend microservices
docker compose up -d api-gateway auth-service ingestion-service \
  parser-service detection-service alert-service search-service \
  websocket-gateway ai-service
```

### 5. Start Frontend
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

### 6. Full Stack (All at once)
```bash
docker compose up -d
```

---

## 🔌 API Reference

### Ingest Logs
```bash
# Single event
curl -X POST http://localhost:8001/ingest \
  -H "X-API-Key: sx_your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"source": "syslog", "hostname": "srv01", "event_type": "authentication", "action": "failure", "source_ip": "1.2.3.4"}'

# Bulk ingestion
curl -X POST http://localhost:8001/ingest/bulk \
  -H "X-API-Key: sx_your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"source": "cloudtrail", "events": [...]}'
```

### Search Logs
```bash
curl -X POST http://localhost:8005/search/logs \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{"query": "severity=critical AND source_ip=192.168.*", "limit": 100}'
```

### AI Alert Summary
```bash
curl -X POST http://localhost:8007/ai/alert-summary \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{"alert_id": "abc", "alert_title": "Multiple Failed Logins", "alert_severity": "high", "source_events": [...]}'
```

---

## 🌐 Service Ports

| Service | Port | Description |
|---|---|---|
| API Gateway | 8000 | Main entry point |
| Auth Service | 8002 | JWT + RBAC |
| Ingestion | 8001 | Log ingestion APIs |
| Alerts | 8004 | Alert management |
| Search | 8005 | SIEM query engine |
| WebSocket | 8006 | Realtime streaming |
| AI | 8007 | LLM integrations |
| Frontend | 3000 | Next.js UI |
| Kafka UI | 8080 | Kafka management |
| Grafana | 3001 | Observability dashboards |
| Prometheus | 9090 | Metrics |
| ClickHouse | 8123 | HTTP API |
| Redis | 6379 | Cache + PubSub |

---

## 🔒 Security Model

- **JWT Authentication**: Supabase Auth + custom JWT with `org_id`, `role` claims
- **RBAC Roles**: `super_admin` → `org_admin` → `analyst` → `viewer`
- **Row Level Security**: PostgreSQL RLS on all tables — tenants can never access each other's data
- **API Keys**: bcrypt-hashed, scoped, revocable, with usage tracking
- **Rate Limiting**: Redis sliding window per tenant + per IP
- **Audit Logs**: Every mutation is logged to `audit_logs` table
- **HMAC Webhooks**: Signed payloads for all outgoing webhook integrations

---

## 📊 Observability

| Tool | URL | Purpose |
|---|---|---|
| Grafana | http://localhost:3001 | Service dashboards |
| Prometheus | http://localhost:9090 | Metrics |
| Kafka UI | http://localhost:8080 | Topic monitoring |

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">
Built with ❤️ for the cybersecurity community
</div>
