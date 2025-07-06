# Project Plan: MCP-First System Management GUI

## Overview

Design and build a web-based system management GUI leveraging MCP-first architecture. The MCP server acts as backend API, serving frontend content and providing multi-method systemd service management, metrics collection, and package update monitoring across VMs.

---

## Features and Requirements

### Backend MCP Server

- Single MCP tool `systemdManager` handling systemd service lifecycle operations:
  - Methods: status, start, stop, reboot, migrate, logs
- Secure SSH connections with RSA key authentication to target hosts
- Collect and store system metrics (CPU, memory, disk usage/IO, load average, network IO) every 5 minutes
- Poll OS package updates (yum/dnf check-update) every hour
- OAuth2-like authentication system over MCP with access and refresh tokens
- Default admin user preloaded on initial database deployment; no public registration
- Fine-grained role-based access control (RBAC) applied from the start
- Store authentication data, tokens, SSH keys, configurations, metrics, notifications in MySQL
- Implement SSH key rotation (weekly or configurable)
- Log supervisor service output to console; monitor via systemd journal viewer

### Frontend Web GUI

- Serve static content with embedded Express server
- Simple Bootstrap-based UI using plain HTML, CSS, JavaScript (no frontend frameworks)
- Use `@purinton/mcp-client` for MCP communication
- Dashboard similar to XenCenter showing hosts, services, and statuses
- Real-time status updates, interactive logs, resource metrics graphing
- Configuration and alert management interfaces

### Notifications

- Discord webhook notifications for:
  - Service state changes (down, restarted)
  - Available updates, critical/security alerts
  - Resource usage exceeding thresholds
- Configurable rules for notifications per host and service
- Notification logging in MySQL

### Deployment and Infrastructure

- Traffic routed through Cloudflare for SSL termination and DDoS protection
- VyOS core1/core2 HAProxy load balancers handle SSL termination and HTTP load balancing to backend nodes
- Backend MCP servers running on app1, app2, and dev (development)
- Horizontal scaling support for backend nodes
- Internal LAN traffic is HTTP secured by network perimeter

### Testing and Development

- Jest for unit and integration testing of backend and frontend
- Webpack for frontend asset bundling
- Use DevOps tool Knit for CI/CD automation

---

## Operational Considerations

- Polling intervals:
  - Services and metrics: every 5 minutes
  - OS updates: every hour
- Database schema versioning and migrations
- Authentication token lifecycles and refresh handling
- Backup, disaster recovery, and audit logging strategies
- Error handling and retries for MCP and SSH operations
- Security hardening for MCP server and MySQL access
- Documentation and user guides

---

## Future Enhancements

- Advanced analytics and trend detection
- Extended support for other hypervisor or container platforms
- More granular user and group permissions
- Enhanced frontend UX and accessibility
- Automated compliance and security scanning

---

## Contact

Primary: Russell Purinton (russell.purinton@gmail.com)

---

Last updated: {{timestamp}}
