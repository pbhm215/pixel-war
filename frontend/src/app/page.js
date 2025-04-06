//
// Login-/Startseite, nutzt login-form.js und actions.js
//

import { LoginForm } from "@/components/login-form"
import { redirect } from "next/navigation"
import { getUsername} from "@/lib/actions"

export default async function Home() {
  const username = await getUsername()
  
    // Wenn eine Session vorhanden redirect -> canvas-Page
    if (username) {
      redirect("/canvas")
    }

  // UI-Elemente für die Login-Seite
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">Pixel War</h1>
        <LoginForm />
      </div>
    </main>
  )
}