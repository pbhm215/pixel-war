# Baue Docker-Images und deploye in Docker Swarm

# Liste der Services
$services = @("pixel_service", "event_service")

Write-Host "Baue MicroServices-Images..."
foreach ($service in $services) {
    $imageName = "$service`_image:latest"
    Write-Host "Baue $imageName..."
    docker build -t $imageName ./backend/$service
}

Write-Host "Baue Frontend-Image..."
docker build -t frontend_image:latest ./frontend

# Prüfe, ob Docker Swarm aktiv ist
$swarmStatus = docker info | Select-String -Pattern "Swarm: active"
if (-not $swarmStatus) {
    Write-Host "Starte Docker Swarm..."
    docker swarm init
} else {
    Write-Host "Docker Swarm läuft bereits!"
}

# Stack in Swarm deployen
Write-Host "Deploye Stack mit Docker Swarm..."
docker stack deploy -c docker-compose.yml pixelstack

Write-Host "Deployment abgeschlossen!"