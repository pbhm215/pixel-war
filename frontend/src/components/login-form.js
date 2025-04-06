//
// Client-Component für die Login-Seite, wird von der Login-Seite importiert
//

"use client"

import React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { login } from "@/lib/actions"

export function LoginForm() {
  const [username, setUsername] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Funktion für den Login-Button
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username.trim()) return // Leere Eingabe verhindern

    // Auf login-Action warten
    setIsLoading(true) 
    await login(username)
    router.push("/welcome")
  }

  // UI-Elemente für das Login-Formular
  return (
    <Card>
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Enter your username to continue</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username <span className="text-xs text-muted-foreground">(max 16 characters)</span> </Label>
              <Input
                id="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={16}
                required
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="mt-2">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

