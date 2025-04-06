# Basis-Image
FROM python:3.8-slim

# Arbeitsverzeichnis im Container erstellen und setzen
WORKDIR /app

# Anforderungen kopieren und installieren
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Den gesamten Code ins Container-Arbeitsverzeichnis kopieren
COPY . .

# FastAPI-Anwendung mit Uvicorn starten
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
