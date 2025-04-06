SERVICES=("pixel_service" "event_service")

echo "Baue MicroServices-Images..."
for SERVICE in "${SERVICES[@]}"; do
    IMAGE_NAME="${SERVICE}_image:latest"
    echo "Baue $IMAGE_NAME..."
    sudo docker build -t $IMAGE_NAME ./backend/$SERVICE
done

echo "Baue Frontend-Image..."
sudo docker build -t frontend_image:latest ./frontend

if ! sudo docker info | grep -q "Swarm: active"; then
    echo "Starte Docker Swarm..."
    sudo docker swarm init
else
    echo "Docker Swarm läuft bereits!"
fi

echo "Deploye Stack mit Docker Swarm..."
sudo docker stack deploy -c docker-compose.yml pixelstack

echo "Deployment abgeschlossen!"