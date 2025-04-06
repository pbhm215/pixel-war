//
// Session Management mit JWT -> wird von der actions.js importiert
//

"use server"

import { SignJWT, jwtVerify } from "jose"

const secretKey = process.env.SESSION_SECRET // Session_SECRET aus der .env-Datei laden
if (!secretKey) {
  throw new Error("SESSION_SECRET is not set")
}
const encodedKey = new TextEncoder().encode(secretKey)

// Funktion zur Verschlüsselung der Session
export async function encrypt(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d") // Token läuft nach 1 Tag ab
    .sign(encodedKey)
}

// Funktion zur Entschlüsselung der Session
export async function decrypt(session) {
  if (!session) return null

  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    })
    return payload
  } catch (error) {
    console.error("Failed to verify session:", error)
    return null
  }
}

