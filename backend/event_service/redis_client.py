import redis
import os
from dotenv import load_dotenv

# .env-Datei laden
load_dotenv()

REDIS_PASSWORD = os.getenv("REDIS_PASSWORD")

# Verbindung zu Redis herstellen
redis_client = redis.Redis(host="redis", port=6379, password = REDIS_PASSWORD, decode_responses=True)