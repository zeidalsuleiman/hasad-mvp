FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY app ./app
COPY alembic.ini .
COPY alembic ./alembic

# Create a simple entrypoint script
RUN echo "#!/bin/bash\n\
python -c \"from app.database import engine; from app.models import Base; Base.metadata.create_all(bind=engine)\"\n\
exec uvicorn app.main:app --host 0.0.0.0 --port 8000" > /app/entrypoint.sh && \
chmod +x /app/entrypoint.sh

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Expose port
EXPOSE 8000

# Run the application
CMD ["/app/entrypoint.sh"]
