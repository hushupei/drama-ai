# AI Service

Python-based AI service for the Short Drama Generator project. Provides asynchronous task processing for novel parsing, script generation, and video rendering.

## Architecture

- **FastAPI** - Modern async web framework for API endpoints
- **Celery** - Distributed task queue for background processing
- **Redis** - Message broker for Celery
- **MinIO** - Object storage for files
- **Loguru** - Structured logging

## Project Structure

```
ai-service/
├── app/
│   ├── __init__.py
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── health.py      # Health check endpoints
│   │       └── tasks.py       # Task management API
│   ├── core/
│   │   ├── config.py          # Application configuration
│   │   ├── celery.py          # Celery configuration
│   │   ├── minio_client.py    # MinIO storage client
│   │   └── logging.py         # Logging setup
│   └── tasks/
│       ├── __init__.py
│       ├── parse.py           # Novel parsing task
│       ├── generate.py        # Script generation task
│       └── render.py          # Video rendering task
├── tests/
│   └── test_main.py
├── main.py                    # FastAPI entry point
├── worker.py                  # Celery worker entry point
├── requirements.txt
└── README.md
```

## API Endpoints

### Health Check
- `GET /health` - Basic health check
- `GET /health/detail` - Detailed health with service status

### Task Management
- `POST /api/v1/tasks/parse` - Create novel parsing task
- `POST /api/v1/tasks/generate` - Create script generation task
- `POST /api/v1/tasks/render` - Create video rendering task
- `GET /api/v1/tasks/{task_id}` - Get task status
- `DELETE /api/v1/tasks/{task_id}` - Revoke task

## Running Locally

### Prerequisites
- Python 3.11+
- Redis running on localhost:6379
- MinIO running on localhost:9000

### Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run FastAPI server
python main.py

# Run Celery worker (in another terminal)
celery -A worker.celery_app worker --loglevel=info
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_NAME` | Short Drama AI Service | Application name |
| `DEBUG` | True | Debug mode |
| `HOST` | 0.0.0.0 | Server host |
| `PORT` | 8000 | Server port |
| `DATABASE_URL` | postgresql://... | PostgreSQL connection |
| `REDIS_URL` | redis://localhost:6379/0 | Redis connection |
| `OPENAI_API_KEY` | None | OpenAI API key |
| `MINIO_ENDPOINT` | localhost:9000 | MinIO endpoint |
| `MINIO_ACCESS_KEY` | minioadmin | MinIO access key |
| `MINIO_SECRET_KEY` | minioadmin | MinIO secret key |
| `MINIO_BUCKET` | short-drama | MinIO bucket name |

## Testing

```bash
pytest tests/ -v --cov=app
```
