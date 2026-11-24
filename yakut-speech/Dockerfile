FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
ADD --chmod=0444 https://huggingface.co/ilkeraktuna/piper-tts-tr-ilkiz-medium/resolve/ecf42bcc271974d000542f5868d81bbcf4e4ec0f/ilkiz.onnx /app/model/ilkiz.onnx
ADD --chmod=0444 https://huggingface.co/ilkeraktuna/piper-tts-tr-ilkiz-medium/resolve/ecf42bcc271974d000542f5868d81bbcf4e4ec0f/ilkiz.onnx.json /app/model/ilkiz.onnx.json
COPY app.py .
USER 10001
EXPOSE 8080
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "1", "--threads", "4", "--timeout", "45", "app:app"]
