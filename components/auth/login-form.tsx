"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const loginSchema = z.object({
  email: z.string().min(1, "Pflichtfeld").email("Ungültige E-Mail-Adresse"),
  password: z.string().min(1, "Pflichtfeld"),
})
type LoginData = z.infer<typeof loginSchema>

const mfaSchema = z.object({
  code: z
    .string()
    .min(6, "6-stelliger Code")
    .max(6, "6-stelliger Code")
    .regex(/^\d{6}$/, "Nur Ziffern"),
})
type MfaData = z.infer<typeof mfaSchema>

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") || "/"

  const [supabase] = useState(() => createClient())
  const [step, setStep] = useState<"login" | "mfa">("login")
  const [factorId, setFactorId] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const mfaForm = useForm<MfaData>({
    resolver: zodResolver(mfaSchema),
    defaultValues: { code: "" },
  })

  async function onLogin(values: LoginData) {
    setServerError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })

    if (error) {
      setServerError("E-Mail oder Passwort ist falsch.")
      return
    }

    // Prüfen, ob MFA (aal2) erforderlich ist.
    const { data: aal, error: aalError } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

    if (aalError) {
      setServerError("Anmeldung fehlgeschlagen. Bitte erneut versuchen.")
      return
    }

    if (aal && aal.nextLevel === "aal2" && aal.nextLevel !== aal.currentLevel) {
      const { data: factors } = await supabase.auth.mfa.listFactors()
      const totp = factors?.totp?.[0]
      if (!totp) {
        setServerError("Kein MFA-Faktor gefunden. Bitte Admin kontaktieren.")
        return
      }
      setFactorId(totp.id)
      setStep("mfa")
      return
    }

    router.replace(redirectTo)
    router.refresh()
  }

  async function onMfa(values: MfaData) {
    setServerError(null)
    if (!factorId) return

    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: values.code,
    })

    if (error) {
      setServerError("Code ungültig oder abgelaufen.")
      mfaForm.reset()
      return
    }

    router.replace(redirectTo)
    router.refresh()
  }

  if (step === "mfa") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bestätigung in zwei Schritten</CardTitle>
          <CardDescription>
            Gib den 6-stelligen Code aus deiner Authenticator-App ein.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...mfaForm}>
            <form
              method="post"
              onSubmit={mfaForm.handleSubmit(onMfa)}
              className="flex flex-col gap-4"
            >
              <FormField
                control={mfaForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        placeholder="123456"
                        autoFocus
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {serverError ? (
                <p className="text-destructive text-sm">{serverError}</p>
              ) : null}
              <Button
                type="submit"
                disabled={mfaForm.formState.isSubmitting}
                className="w-full"
              >
                {mfaForm.formState.isSubmitting ? "Prüfe…" : "Bestätigen"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Anmelden</CardTitle>
        <CardDescription>
          Melde dich mit deinen Zugangsdaten an.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...loginForm}>
          <form
            method="post"
            onSubmit={loginForm.handleSubmit(onLogin)}
            className="flex flex-col gap-4"
          >
            <FormField
              control={loginForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-Mail</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="name@wimus.de"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={loginForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Passwort</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {serverError ? (
              <p className="text-destructive text-sm">{serverError}</p>
            ) : null}
            <Button
              type="submit"
              disabled={loginForm.formState.isSubmitting}
              className="w-full"
            >
              {loginForm.formState.isSubmitting ? "Anmelden…" : "Anmelden"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
