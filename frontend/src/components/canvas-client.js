//
// Client-Component für die Canvas-Interaktion, wird von CanvasPage aufgerufen
//

"use client"

import { useState, useRef, useEffect } from "react"
import { CirclePicker } from "react-color"
import { io } from "socket.io-client"

// Umgebungsvariablen aus der .env-Datei laden
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const WS_URL = process.env.NEXT_PUBLIC_WS_URL;

// Funktion um die Canvas-Daten zu aktualisieren (for-loop für alle werte)
export function UpdateCanvas(canvas, dict, width, height) {
  const ctx = canvas.getContext("2d")
  for (var key in dict) {
    // key ist z.B. "0:0" -> splitten und die ersten beiden Werte nehmen
    var x = Number(key.split(":")[0])
    var y = Number(key.split(":")[1])
    if (x > width || y > height) {
      continue
    }
    var value = dict[key].color // jeder key (x:y) hat ein color als value
    ctx.fillStyle = value
    ctx.fillRect(x * 10, y * 10, 10, 10) // 10px pro Canvas-Pixel
  }
}

// Funktion um die Canvas-Daten vom Backend abzurufen (mit Retry-Logik)
async function getDataWithRetry(retries = 5, delay = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${API_URL}/canvas`) // Aufruf der REST-API

      if (!response.ok) {
        throw new Error(`HTTP-Fehler! Status: ${response.status}`)
      }

      const data = await response.json()
      return data
      
    } catch (error) {
      console.error(`Fehler beim Abrufen der Canvas-Daten (Versuch ${attempt}):`, error)

      // Retry-Logik
      if (attempt < retries) { 
        console.log(`Warte ${delay}ms und versuche es erneut...`)
        await new Promise((resolve) => setTimeout(resolve, delay)) // Warten vor erneutem Versuch
      } else {
        console.error("Maximale Anzahl an Versuchen erreicht. Abbruch.")
        return {} // Rückgabe eines leeren Objekts als Fallback
      }
    }
  }
}

// Funktion um den User-Cooldown vom Server abzurufen
async function getCooldown(username) {
  try {
    const resp = await fetch(`${API_URL}/cooldown/${username}`, { // Aufruf der REST-API
      credentials: "include", // Session-Cookie wird mitgesendet
    })

    if (!resp.ok) {
      throw new Error(`Cooldown abrufen fehlgeschlagen: ${resp.status}`)
    }

    const data = await resp.json() // Beispiel-JSON-String für data: {5} => 5 Sekunden Cooldown
    
    const remainingTime = Array.isArray(data) && data.length > 0 ? data[0] : 0 // Wenn kein Cooldown gesetzt ist => Cooldown = 0
    return remainingTime

  } catch (error) { 
    console.error("Fehler beim Abrufen des Cooldowns:", error)
    return 0 
  }
}

// Funktion um ein Pixel zu posten
async function postData(x, y, color, username) {
  try {
    const colorCode = encodeURIComponent(color).toUpperCase() // z.B. %23FF0000 für rot
    const response = await fetch(`${API_URL}/pixel/?x=${x}&y=${y}&color=${colorCode}&player=${username}`, { // Aufruf der REST-API
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      credentials: "include", // Session-Cookie wird mitgesendet
    })

    if (!response.ok) {
      throw new Error(`POST fehlgeschlagen! Status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Fehler beim Senden des Pixels:", error)
    setErrorMessage(error.message) // Fehlerzustand setzen für die Connection-Anzeige (roter Punkt neben "Pixel War"-Logo)
    return null
  }
}

// Client-Component für die Canvas-Interaktion
export function CanvasClient({ username }) {
  const width = 50
  const height = 50
  const cooldown = 10 // Cooldown 1 Sekunde länger als im Backend um Konflikte zu vermeiden
  const [color, setColor] = useState("#000000") // Standardfarbe schwarz
  const [coordinates, setCoordinates] = useState({ x: "-", y: "-" })
  const [painter, setPainter] = useState({ name: "-" })
  const [timer, setTimer] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState("connecting")
  const [errorMessage, setErrorMessage] = useState(null); 
  const canvasRef = useRef(null)
  const wsRef = useRef(null)
  const [canvasData, setCanvasData] = useState({})

  // Bei erstem Rendern Cooldown vom Server holen
  useEffect(() => {
    const initCooldown = async () => {
      const serverCooldown = await getCooldown(username)
      setTimer(serverCooldown)
    }
    initCooldown()
  }, [username])

  // Cooldown-Timer runterzählen
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Canvas initialisieren und mit den Daten vom Server befüllen
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext("2d")
      ctx.fillStyle = "#FFFFFF"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      UpdateCanvas(canvas, canvasData, width, height)
    }
  }, [canvasData])

  // Initial data fetch mit Retry-Logik
  useEffect(() => {
    const fetchInitialData = async () => {
      const data = await getDataWithRetry()
      setCanvasData(data || {})
    }

    fetchInitialData()
  }, [])

  // WebSocket-Client initialisieren und mit dem Server verbinden
  useEffect(() => {
    const socket = io(WS_URL, {
      transports: ["websocket"],
      rejectUnauthorized: false,
      
  })
    socket.on("connect", () => {
      console.log("Socket.IO connected")
      setConnectionStatus("connected")
    })

    socket.on("pixel_update", async (data) => {
      console.log("Received update:", data)

      const [xStr, yStr, colorVal, playerName] = data.split(":") // z.B. "0:0:#FFFFFF:Max"
      const xPos = Number(xStr)
      const yPos = Number(yStr)

      const canvas = canvasRef.current
      if (!canvas) return
      
      // Canvas aktualisieren
      const ctx = canvas.getContext("2d")
      ctx.fillStyle = colorVal
      ctx.fillRect(xPos * 10, yPos * 10, 10, 10)

      // Lokale State-Daten (canvasData) updaten, damit z.B. bei MouseOver der korrekte painter sichtbar ist.
      setCanvasData((prevData) => {
        const updatedData = { ...prevData }
        updatedData[`${xPos}:${yPos}`] = {
          color: colorVal,
          player: playerName,
        }
        return updatedData
      })
    })

    socket.on("disconnect", () => {
      console.log("Socket.IO disconnected")
      setConnectionStatus("disconnected")
    })

    socket.on("connect_error", (error) => {
      console.error("Socket.IO error:", error)
      console.log(error.code)   // z.B. "3"
      console.log(error.message) // z.B. "Bad request"
      console.log(error.context)
      setConnectionStatus("error")
    })

    wsRef.current = socket

    return () => {
      socket.disconnect()
    }
  }, [])

  // Funktion zum Herunterladen des Canvas als Bild
  function downloadCanvasAsImage() {
    const canvas = canvasRef.current 
    if (!canvas) return // Wenn kein Canvas vorhanden ist, wird nichts heruntergeladen
  
    const url = canvas.toDataURL("image/png") // Canvas in ein PNG-Bild umwandeln
    const link = document.createElement("a") // Link-Element erstellen für Download
    link.download = "pixel-canvas.png" // // Dateiname für den Download
    link.href = url
    link.click()
  }

  // Funktion zum Zeichnen eines Pixels
  const drawPixel = (e) => {
    if (timer === 0) {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d") // Canvas-Rendering-Kontext
      if (!ctx) return

      const rect = canvas.getBoundingClientRect()
      const x = Math.floor((e.clientX - rect.left) / 10) // 10 x 10px pro Canvas-Pixel
      const y = Math.floor((e.clientY - rect.top) / 10) 

      // Wenn man lokal direkt updaten möchte
      //ctx.fillStyle = color
      //ctx.fillRect(x * 10, y * 10, 10, 10)

      postData(x, y, color, username) // POST-Request an Backend senden

      setTimer(cooldown) // Cooldown auf definierte Sekundenanzahl zurücksetzen
    } else {
      console.log(`Please wait ${timer} seconds before placing another pixel`)
    }
  }

  // Funktion um die Mausposition zu verfolgen und den aktuellen Spieler anzuzeigen
  const handleMouseMove = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d") // Canvas-Rendering-Kontext
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = Math.floor((e.clientX - rect.left) / 10) // 10 x 10px pro Canvas-Pixel
    const y = Math.floor((e.clientY - rect.top) / 10)

    setCoordinates({ x, y })
    const name = canvasData[`${x}:${y}`]?.player || "-"
    setPainter({ name })
  }

  // Farbe des Connection-Status-Punktes neben "Pixel War"-Logo zur Anzeige der WebSocket-Verbindung
  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case "connected": // Verbunden => grün
        return "bg-green-500"
      case "connecting": // Verbinde => gelb
        return "bg-yellow-500"
      case "disconnected": // Getrennt => rot
        return "bg-red-500"
      case "error": // Fehler => rot
        return "bg-red-500"
      case "failed": // Fehlgeschlagen => grau
        return "bg-gray-500"
      default: // Standardfarbe => grau
        return "bg-gray-300"
    }
  }

  // UI-Elemente für die Canvas-Seite
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="p-6 flex items-center">
        <div className="flex items-center ml-6">
          <img src="/favicon.ico" alt="Logo" width={30} height={30} className="ml-2" />
          <h1 className="text-xl font-semibold ml-3">Pixel War</h1>
          <div
            className={`ml-4 w-3 h-3 rounded-full ${getConnectionStatusColor()}`}
            title={`Connection status: ${connectionStatus}`}
          ></div>
        </div>
        <div className="ml-auto text-sm text-gray-500 mr-6">Logged in as: {username}</div>
      </header>

      {/* Error Popup */}
      {errorMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded shadow-lg">
          <p>{errorMessage}</p>
          <button
            className="mt-2 text-sm underline"
            onClick={() => setErrorMessage(null)} // Error Popup schliessen bei Klick
          >
            Schließen
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex justify-center px-4 py-15">
        <div className="flex">
          {/* Timer Bar */}
          <div className="relative w-8 bg-gray-600 rounded-lg shadow-lg overflow-hidden mr-12">
            <div
              className="absolute bottom-0 w-full bg-gray-400"
              style={{ height: `${(timer / cooldown) * 100}%` }} // Dynamische höhe der Timer-Leiste
            ></div>
          </div>

          {/* Canvas Container */}
          <div className="bg-white rounded-lg shadow-lg p-2 border border-gray-200">
            <canvas
              ref={canvasRef}
              width={width * 10}
              height={height * 10}
              className="cursor-pointer"
              onMouseDown={drawPixel}
              onMouseMove={handleMouseMove}
            />
          </div>

          {/* Color Palette (von React-Color) */}
          <div className="flex flex-col align-center ml-12">
            <div className="col-span-3">
              <CirclePicker
                color={color}
                onChangeComplete={(c) => setColor(c.hex)}
                colors={[
                  "#6D001A", "#BE0039", "#FF4500", 
                  "#FFA800", "#FFD635", "#FFF8B8", 
                  "#00A368", "#00CC78", "#7EED56", 
                  "#00756F", "#009EAA", "#2450A4",
                  "#493AC1", "#6A5CFF", "#3690EA", 
                  "#51E9F4", "#FFFFFF", "#000000",
                ]}
                width="12vw"
                circleSize={35}
              />
            </div>
            {/* Coordinates Display */}
            <div className="col-span-3 mt-8 bg-white p-3 rounded-lg shadow text-sm w-48">
              <p>painter: {painter.name}</p>
              <p>
                x, y: ({coordinates.x}, {coordinates.y})
              </p>
              <p className="mt-2 text-xs">
                {timer > 0 ? `Wait ${timer}s to place a pixel` : "You can place a pixel now!"}
              </p>
            </div>
            {/* Download Button */}
            <button
              className="mt-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow text-sm hover:bg-gray-600"
              onClick={downloadCanvasAsImage}
            >
              Download Canvas
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

