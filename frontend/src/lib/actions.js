//
// Next.js-Action für die Authentifizierung -> wird von der Login-Seite importiert
//

"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { encrypt, decrypt } from "@/lib/session"

// Funktion für den Login
export async function login(username) {
  try {
    // Neue Session
    const session = {
      username,
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 1 day
    }

    const encryptedSession = await encrypt(session) // Verschlüsseln der Session mit session.js

    const cookieStore = await cookies()
    cookieStore.set("session", encryptedSession, {
      httpOnly: true, // Nur vom Server lesbar
      path: "/",
      maxAge: 60 * 60 * 24, // Session für 1 Tag gültig
      sameSite: "lax",
    })
  } catch (error) {
    console.error("Error creating session:", error)
    throw new Error("Failed to create session")
  }
}

// Funktion für den Logout
export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete("session") // Cookie wird bei Logout gelöscht
  redirect("/")
}

// Funktion um den Benutzernamen aus dem Cookie zu bekommen
export async function getUsername() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")

    if (!sessionCookie?.value) {
      return null
    }

    const session = await decrypt(sessionCookie.value) // Entschlüsseln der Session

    // Bei Ablauf der Session den Cookie löschen
    if (!session || session.expiresAt < Date.now()) {
      cookieStore.delete("session")
      return null
    }

    return session.username
  } catch (error) {
    console.error("Error getting username:", error)
    return null
  }
}

// Funktion um die Session zu bekommen
export async function getSession() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")

    if (!sessionCookie?.value) {
      return null
    }

    const session = await decrypt(sessionCookie.value) // Entschlüsseln der Session

    if (!session || session.expiresAt < Date.now()) { // Bei Ablauf der Session den Cookie löschen
      cookieStore.delete("session")
      return null
    }

    return session
  } catch (error) {
    console.error("Error getting session:", error)
    return null
  }
}

