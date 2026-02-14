FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for MeCab
RUN apt-get update && apt-get install -y \
    mecab \
    libmecab-dev \
    mecab-ipadic-utf8 \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ ./app/
COPY scripts/ ./scripts/

# Expose port
EXPOSE 8000

# Run FastAPI with uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
