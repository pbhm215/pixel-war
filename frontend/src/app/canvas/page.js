//
// Canvas Seite für das Pixel-War Spiel, nutzt actions.js und canvas-client.js
//

import { getUsername } from "@/lib/actions"
import { redirect } from "next/navigation"
import { CanvasClient } from "@/components/canvas-client"

export default async function CanvasPage() {
  const username = await getUsername()

  // Wenn keine gültige Session -> Login-Seite
  if (!username) {
    redirect("/")
  }

  return <CanvasClient username={username} />
}