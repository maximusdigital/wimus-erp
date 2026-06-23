import { Suspense } from "react"
import { redirect } from "next/navigation"

import { createServerClient } from "@/lib/supabase/server"
import { LoginForm } from "@/components/auth/login-form"

export const metadata = {
  title: "Anmelden – WIMUS ERP",
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  // Bereits angemeldet? Dann nicht auf der Login-Seite hängen bleiben.
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { redirect: target } = await searchParams
    // Nur interne Ziele zulassen und niemals zurück auf Auth-Seiten (sonst Loop).
    const safe =
      target &&
      target.startsWith("/") &&
      !/^\/(login|mfa|auth)(\/|$|\?)/.test(target)
        ? target
        : "/"
    redirect(safe)
  }

  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
