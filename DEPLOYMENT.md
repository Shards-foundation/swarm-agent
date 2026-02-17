# Deployment Guide

## Overview

This guide covers deploying the Ultimate Swarm Agents Platform to production environments. The platform supports multiple deployment strategies including Docker, cloud platforms, and traditional servers.

## Pre-Deployment Checklist

- [ ] All tests passing (`pnpm test`)
- [ ] TypeScript compilation successful (`pnpm check`)
- [ ] Code formatted correctly (`pnpm format`)
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL/TLS certificates obtained
- [ ] Backup procedures tested
- [ ] Monitoring configured
- [ ] Security audit completed
- [ ] Performance testing done

## Docker Deployment

### Build Docker Image

Create a Dockerfile in the project root:

```dockerfile
FROM node:22.13.0-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Build application
COPY . .
RUN pnpm build

# Production image
FROM node:22.13.0-alpine

WORKDIR /app

# Install production dependencies only
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile --prod

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist ./client/dist

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Run application
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### Build and Run

```bash
# Build image
docker build -t swarm-agent:latest .

# Run container
docker run -d \
  --name swarm-agent \
  -p 3000:3000 \
  --env-file .env.production \
  -v swarm-data:/app/data \
  swarm-agent:latest

# View logs
docker logs -f swarm-agent

# Stop container
docker stop swarm-agent
```

## Kubernetes Deployment

### Create Deployment Manifest

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: swarm-agent
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: swarm-agent
  template:
    metadata:
      labels:
        app: swarm-agent
    spec:
      containers:
      - name: swarm-agent
        image: swarm-agent:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: swarm-secrets
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: swarm-secrets
              key: jwt-secret
        resources:
          requests:
            cpu: 500m
            memory: 512Mi
          limits:
            cpu: 1000m
            memory: 1Gi
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: swarm-agent-service
  namespace: production
spec:
  selector:
    app: swarm-agent
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

### Deploy to Kubernetes

```bash
# Create namespace
kubectl create namespace production

# Create secrets
kubectl create secret generic swarm-secrets \
  --from-literal=database-url=$DATABASE_URL \
  --from-literal=jwt-secret=$JWT_SECRET \
  -n production

# Deploy application
kubectl apply -f deployment.yaml

# Check deployment status
kubectl get deployment swarm-agent -n production
kubectl get pods -n production
kubectl logs -f deployment/swarm-agent -n production
```

## Cloud Platform Deployment

### AWS Deployment

#### Using Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize application
eb init -p "Node.js 22 running on 64bit Amazon Linux 2" swarm-agent

# Create environment
eb create production

# Deploy
eb deploy

# View logs
eb logs
```

#### Using ECS

```bash
# Create ECR repository
aws ecr create-repository --repository-name swarm-agent

# Push image
docker tag swarm-agent:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/swarm-agent:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/swarm-agent:latest

# Create ECS task definition and service
# (See AWS documentation for detailed steps)
```

### Google Cloud Deployment

#### Using Cloud Run

```bash
# Build and push image
gcloud builds submit --tag gcr.io/$PROJECT_ID/swarm-agent

# Deploy to Cloud Run
gcloud run deploy swarm-agent \
  --image gcr.io/$PROJECT_ID/swarm-agent \
  --platform managed \
  --region us-central1 \
  --set-env-vars DATABASE_URL=$DATABASE_URL,JWT_SECRET=$JWT_SECRET
```

### Azure Deployment

#### Using App Service

```bash
# Create resource group
az group create --name swarm-rg --location eastus

# Create App Service plan
az appservice plan create --name swarm-plan --resource-group swarm-rg --sku B2

# Create web app
az webapp create --resource-group swarm-rg --plan swarm-plan --name swarm-agent

# Deploy code
az webapp deployment source config-zip --resource-group swarm-rg --name swarm-agent --src app.zip
```

## Traditional Server Deployment

### Using systemd

Create `/etc/systemd/system/swarm-agent.service`:

```ini
[Unit]
Description=Ultimate Swarm Agents Platform
After=network.target mysql.service

[Service]
Type=simple
User=swarm
WorkingDirectory=/opt/swarm-agent
ExecStart=/usr/bin/node /opt/swarm-agent/dist/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

Environment="NODE_ENV=production"
Environment="PORT=3000"
EnvironmentFile=/opt/swarm-agent/.env.production

[Install]
WantedBy=multi-user.target
```

### Start Service

```bash
# Enable service
sudo systemctl enable swarm-agent

# Start service
sudo systemctl start swarm-agent

# Check status
sudo systemctl status swarm-agent

# View logs
sudo journalctl -u swarm-agent -f
```

## Nginx Reverse Proxy

Configure Nginx as a reverse proxy:

```nginx
upstream swarm_agent {
    server localhost:3000;
}

server {
    listen 80;
    server_name swarm-agent.example.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name swarm-agent.example.com;
    
    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/swarm-agent.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/swarm-agent.example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Proxy configuration
    location / {
        proxy_pass http://swarm_agent;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

## Database Setup

### MySQL/TiDB

```bash
# Connect to database
mysql -u root -p

# Create database
CREATE DATABASE swarm_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Create application user
CREATE USER 'swarm_app'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON swarm_platform.* TO 'swarm_app'@'localhost';
FLUSH PRIVILEGES;

# Run migrations
pnpm db:push
```

### Backup Configuration

```bash
#!/bin/bash
# backup.sh - Daily database backup

BACKUP_DIR="/backups/swarm-platform"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="swarm_platform"
DB_USER="swarm_app"

# Create backup
mysqldump -u $DB_USER -p $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

# Upload to S3
aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz s3://swarm-backups/
```

## Monitoring & Logging

### Application Monitoring

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start dist/index.js --name swarm-agent

# Monitor
pm2 monit

# View logs
pm2 logs swarm-agent
```

### Log Aggregation

Configure centralized logging:

```bash
# Using ELK Stack
# - Elasticsearch for storage
# - Logstash for processing
# - Kibana for visualization

# Configure application to send logs
export LOG_LEVEL=info
export LOG_FORMAT=json
```

## Performance Tuning

### Node.js Optimization

```bash
# Set memory limit
export NODE_OPTIONS="--max-old-space-size=2048"

# Enable clustering
export CLUSTER_MODE=true
export CLUSTER_WORKERS=4
```

### Database Optimization

```sql
-- Add indexes
CREATE INDEX idx_agent_status ON swarm_agents(status);
CREATE INDEX idx_task_workflow ON swarm_tasks(workflowId);
CREATE INDEX idx_message_task ON swarm_messages(taskId);

-- Optimize queries
ANALYZE TABLE swarm_agents;
ANALYZE TABLE swarm_tasks;
ANALYZE TABLE swarm_messages;
```

## Rollback Procedure

If deployment fails:

```bash
# Check current version
git log --oneline -1

# Rollback to previous version
git revert HEAD
pnpm build
pnpm start

# Or use container rollback
docker run -d swarm-agent:previous-tag
```

## Health Checks

### Endpoint Monitoring

```bash
# Health check endpoint
curl https://swarm-agent.example.com/health

# Readiness check
curl https://swarm-agent.example.com/ready

# Metrics endpoint
curl https://swarm-agent.example.com/metrics
```

## Troubleshooting

### Common Issues

**Application won't start**
```bash
# Check logs
pm2 logs swarm-agent

# Verify environment variables
env | grep DATABASE_URL

# Test database connection
mysql -u swarm_app -p swarm_platform
```

**High memory usage**
```bash
# Check process
ps aux | grep node

# Increase memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
```

**Database connection errors**
```bash
# Test connection
mysql -u swarm_app -p -h localhost swarm_platform

# Check connection pool
# Review DATABASE_URL format
```

## Post-Deployment

1. **Verify Deployment**
   - Test all endpoints
   - Check logs for errors
   - Monitor resource usage

2. **Configure Monitoring**
   - Set up alerts
   - Configure dashboards
   - Enable log aggregation

3. **Document Configuration**
   - Record environment variables
   - Document deployment steps
   - Update runbooks

4. **Plan Maintenance**
   - Schedule backups
   - Plan updates
   - Document procedures

## Support

For deployment issues:
- Check logs: `pm2 logs swarm-agent`
- Review GitHub issues: https://github.com/shards-inc/swarm-agent/issues
- Contact support: support@shards-inc.com

---

**Last Updated:** February 17, 2026  
**Version:** 1.0.0  
**Status:** Production Ready
