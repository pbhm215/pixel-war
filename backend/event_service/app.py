import socketio
import asyncio
from redis_client import redis_client
from fastapi import FastAPI

# Socket.IO-Server konfigurieren
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
)
app = FastAPI()
app.mount("/", socketio.ASGIApp(sio)) # Socket.IO in FastAPI-Server einbinden


pubsub = redis_client.pubsub()
pubsub.subscribe("pixel_updates") # Abonnieren des "pixel_updates"-Channels

# Hört auf Redis-Nachrichten und dann -> Clients
async def redis_listener():
    while True:
        message = await asyncio.get_event_loop().run_in_executor(None, pubsub.get_message)
        if message and message["type"] == "message":
            await sio.emit("pixel_update", message["data"]) # An alle clients senden (pixel_update)
        await asyncio.sleep(0.1)

@sio.event
async def connect(sid, environ):
    print(f"Client {sid} verbunden")

@sio.event
async def disconnect(sid):
    print(f"Client {sid} getrennt")

@sio.event
async def pixel_update(sid, data):
    print(f"Pixel-Update von {sid}: {data}")

@sio.on("*")
async def catch_all_event(event, sid, data):
    print(f"Unbekanntes Event: {event}, Daten: {data}")
    
# Starte den Redis-Listener im Hintergrund
asyncio.create_task(redis_listener())