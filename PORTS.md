# Port Configuration

All services in this project use ports starting with 1300X:

## Services and Ports

| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 13001 | Database server |
| Backend Server | 13002 | Fastify + tRPC API server |
| Frontend | 13003 | React development server |
| Mailhog SMTP | 13004 | SMTP server for email capture |
| Mailhog Web UI | 13005 | Web interface to view captured emails |

## Docker Services

Start all services with:
```bash
docker-compose up
```

Or start specific services:
```bash
docker-compose up postgres mailhog
```

## Accessing Services

- **API**: http://localhost:13002
- **Frontend**: http://localhost:13003
- **Mailhog UI**: http://localhost:13005 (view all captured emails)