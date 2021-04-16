FROM python:3-slim

ENV PYTHONUNBUFFERED 1
WORKDIR /code

COPY requirements.txt .

RUN apt update && \
    apt install -y gcc libpq-dev make git && \
    pip install -r requirements.txt
