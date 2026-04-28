# AI Service Dockerfile
FROM python:3.11-slim AS builder

WORKDIR /app

# Use Alibaba Cloud mirror for faster apt
RUN echo 'deb http://mirrors.aliyun.com/debian trixie main' > /etc/apt/sources.list && \
    echo 'deb http://mirrors.aliyun.com/debian-security trixie-security main' >> /etc/apt/sources.list

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies to a dedicated directory
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Runtime stage
FROM python:3.11-slim

WORKDIR /app

# Use Alibaba Cloud mirror for faster apt
RUN echo 'deb http://mirrors.aliyun.com/debian trixie main' > /etc/apt/sources.list && \
    echo 'deb http://mirrors.aliyun.com/debian-security trixie-security main' >> /etc/apt/sources.list

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy Python packages from builder (system-wide install)
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY app ./app
COPY main.py .

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
