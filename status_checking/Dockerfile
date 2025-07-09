FROM python:3.9-slim

WORKDIR /app

COPY status_checking.py /app/status_checking/

WORKDIR /app/status_checking

RUN pip install requests python-dotenv

CMD ["python", "status_checking.py"]
