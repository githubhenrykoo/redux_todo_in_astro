FROM python:3.9-slim

WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy application code
COPY status_checking.py .

# Run the application
CMD ["python", "status_checking.py"]
