# 短剧生成平台 - 部署文档

## 系统架构

本系统由三个主要服务组成：

1. **Java 后端服务** (Spring Boot) - 提供 REST API
2. **Python AI 服务** (FastAPI + Celery) - 处理小说解析和视频生成
3. **前端应用** (React + Vite) - 用户界面

## 环境要求

### 基础环境
- Docker 20.10+
- Docker Compose 2.0+
- 内存: 至少 8GB RAM
- 磁盘: 至少 50GB 可用空间

### 外部依赖
- PostgreSQL 15+
- Redis 7+
- MinIO (对象存储)
- RabbitMQ (Celery 消息队列)

## 快速部署

### 1. 克隆代码

```bash
git clone https://github.com/hushupei/drama-ai.git
cd drama-ai
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，配置以下关键参数
```

关键配置项：
```bash
# 数据库
DB_URL=jdbc:postgresql://localhost:5432/drama
DB_USERNAME=postgres
DB_PASSWORD=your_password

# Redis
REDIS_URL=redis://localhost:6379/0

# MinIO
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=your_access_key
MINIO_SECRET_KEY=your_secret_key
MINIO_BUCKET=drama-files

# OpenAI (用于 AI 解析)
OPENAI_API_KEY=sk-your-key
OPENAI_BASE_URL=https://api.openai.com/v1

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=86400000
```

### 3. 使用 Docker Compose 部署

```bash
docker-compose up -d
```

这将启动：
- PostgreSQL 数据库
- Redis 缓存
- MinIO 对象存储
- RabbitMQ 消息队列
- Java 后端服务
- Python AI 服务
- Nginx (前端静态文件)

### 4. 验证部署

```bash
# 检查所有服务状态
docker-compose ps

# 查看日志
docker-compose logs -f backend
docker-compose logs -f ai-service

# 健康检查
curl http://localhost:8080/api/health
curl http://localhost:8000/health
```

## 生产环境部署

### 数据库配置

1. **PostgreSQL 主从复制**
```bash
# 使用 Docker 启动主库
docker run -d \
  --name postgres-master \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=drama \
  -v postgres_data:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:15-alpine
```

2. **数据库迁移**
```bash
# 后端会自动执行 Flyway 迁移
# 手动执行（如需）
cd backend
./mvnw flyway:migrate
```

### 负载均衡

使用 Nginx 配置负载均衡：

```nginx
upstream backend {
    server backend1:8080 weight=5;
    server backend2:8080 weight=5;
    keepalive 32;
}

server {
    listen 80;
    server_name api.yourdomain.com;

    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
}
```

### SSL/TLS 配置

使用 Let's Encrypt：

```bash
# 安装 certbot
docker run -it --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/lib/letsencrypt:/var/lib/letsencrypt \
  certbot/certbot certonly --standalone -d yourdomain.com
```

## 监控与日志

### 日志收集

配置 ELK Stack 或 Fluentd：

```yaml
# docker-compose.logging.yml
version: '3.8'
services:
  elasticsearch:
    image: elasticsearch:8.5.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"

  kibana:
    image: kibana:8.5.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch

  fluentd:
    image: fluent/fluentd:v1.16
    volumes:
      - ./fluentd/conf:/fluentd/etc
    ports:
      - "24224:24224"
```

### 监控指标

使用 Prometheus + Grafana：

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'backend'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['backend:8080']

  - job_name: 'ai-service'
    static_configs:
      - targets: ['ai-service:8000']
```

## 备份策略

### 数据库备份

```bash
#!/bin/bash
# backup.sh - 每日备份

BACKUP_DIR="/backup/postgres"
DATE=$(date +%Y%m%d_%H%M%S)

# 执行备份
docker exec postgres-master pg_dump -U postgres drama > $BACKUP_DIR/drama_$DATE.sql

# 保留最近 7 天
dfind $BACKUP_DIR -name "drama_*.sql" -mtime +7 -delete
```

### 对象存储备份

```bash
# MinIO 备份到远程 S3
mc mirror minio/drama-files s3/backup-bucket/drama-files
```

## 故障排查

### 常见问题

1. **数据库连接失败**
```bash
# 检查 PostgreSQL 状态
docker-compose exec postgres pg_isready

# 检查网络连接
docker-compose exec backend nc -zv postgres 5432
```

2. **AI 服务内存不足**
```bash
# 增加 Docker 内存限制
docker-compose up -d --memory="4g" ai-service
```

3. **前端无法访问 API**
```bash
# 检查 Nginx 配置
docker-compose exec nginx nginx -t

# 查看错误日志
docker-compose exec nginx tail -f /var/log/nginx/error.log
```

## 性能优化

### JVM 调优

```bash
# 后端 JVM 参数
JAVA_OPTS="-Xms2g -Xmx4g \
  -XX:+UseG1GC \
  -XX:MaxGCPauseMillis=200 \
  -XX:+UseStringDeduplication \
  -XX:+OptimizeStringConcat"
```

### 数据库优化

```sql
-- 常用查询索引
CREATE INDEX idx_novel_status ON novels(status);
CREATE INDEX idx_character_novel_id ON characters(novel_id);
CREATE INDEX idx_episode_project_id ON episodes(project_id);

-- 定期 VACUUM
VACUUM ANALYZE;
```

## 更新部署

### 滚动更新

```bash
# 更新后端
docker-compose pull backend
docker-compose up -d --no-deps --build backend

# 更新 AI 服务
docker-compose pull ai-service
docker-compose up -d --no-deps --build ai-service

# 更新前端
docker-compose pull nginx
docker-compose up -d --no-deps nginx
```

### 数据库迁移

```bash
# 备份数据库
./scripts/backup.sh

# 执行迁移
docker-compose exec backend java -jar app.jar flyway:migrate
```

## 安全建议

1. **网络隔离**
   - 使用 Docker 网络隔离服务
   - 数据库不暴露公网端口

2. **密钥管理**
   - 使用 Docker Secrets 或 Vault
   - 定期轮换 API 密钥

3. **访问控制**
   - 配置防火墙规则
   - 使用 VPN 访问管理接口

4. **安全更新**
   - 定期更新基础镜像
   - 监控 CVE 漏洞

## 联系支持

遇到问题请提交 Issue：
https://github.com/hushupei/drama-ai/issues
