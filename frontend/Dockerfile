# Verwende ein offizielles Node.js-Image als Basis
FROM node:18-alpine

# Setze das Arbeitsverzeichnis im Container
WORKDIR /app

# Kopiere die package.json und package-lock.json (falls vorhanden)
COPY package*.json ./

# Installiere die Abhängigkeiten
RUN npm install

# Kopiere den Rest des Codes
COPY . .

# Baue die Next.js-App
RUN npm run build

# Exponiere den Standardport für Next.js
EXPOSE 3000

# Starte die Anwendung
CMD ["npm", "run", "start"]
