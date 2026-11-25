FROM python:3.12-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt \
    && python -m playwright install --with-deps chromium
COPY app_sadece_tkgm_duzeltildi.py web_app.py ./
RUN mkdir -p /app/screenshots
ENV PORT=10000
EXPOSE 10000
CMD ["sh", "-c", "uvicorn web_app:app --host 0.0.0.0 --port ${PORT:-10000} --workers 1"]
