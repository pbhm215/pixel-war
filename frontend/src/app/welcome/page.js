//
// Welcome Page für Regeln und Logout -> nutzt actions.js
//

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { getUsername, logout } from "@/lib/actions"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function WelcomePage() {
  const username = await getUsername()

  // Wenn keine gültige Session -> Login-Seite
  if (!username) {
    redirect("/")
  }

  // UI-Elemente für die Willkommensseite
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome, {username}!</CardTitle>
          <CardDescription>You have successfully logged in</CardDescription>
        </CardHeader>
        <CardContent>
          <h2 className="text-lg font-semibold text-gray-700 text-center">Game Rules:</h2>
          <ul>
            <li className="text-center py-1 mt-3">
              🌈 Choose from <strong>18 different colors</strong>.
            </li>
            <li className="text-center py-3"> 
              🎨 Paint <strong>one pixel</strong> every 10 seconds.
            </li>
          </ul>
          <p className="text-center text-gray-700 font-medium mt-4">
            Click Play to start drawing!
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <form action={logout}>
            <Button type="submit" variant="outline">
              Logout
            </Button>
          </form>
          <Link href="/canvas">
            <Button variant="ghost">Play</Button>
          </Link>
        </CardFooter>
      </Card>
    </main>
  )
}

