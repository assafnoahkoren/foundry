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
| Email Preview | 13006 | React Email preview server (dev only) |

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
- **Mailhog UI**: http://localhost:13005 (view all captured emails sent by the app)
- **Email Preview**: http://localhost:13006 (design and preview email templates)

## Email Development Workflow

1. **Design emails**: Use React Email preview server (`npm run email:preview` in server dir) at http://localhost:13006
2. **Test sending**: Emails sent from the app are captured by Mailhog at http://localhost:13005