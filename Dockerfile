FROM python:3.11-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 U2NET_HOME=/app/models OMP_NUM_THREADS=2
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN mkdir -p /app/models && python -c "from rembg import new_session; new_session('u2netp')"
COPY server.py .
COPY public ./public
RUN useradd -m poster && chown -R poster:poster /app
USER poster
EXPOSE 8000
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
