"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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

const schema = z.object({
  code: z
    .string()
    .min(6, "6-stelliger Code")
    .max(6, "6-stelliger Code")
    .regex(/^\d{6}$/, "Nur Ziffern"),
})
type FormData = z.infer<typeof schema>

type EnrollState = {
  factorId: string
  qrCode: string
  secret: string
}

export function MfaEnrollForm() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [enroll, setEnroll] = useState<EnrollState | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { code: "" },
  })

  useEffect(() => {
    let active = true

    async function start() {
      // Bestehende, nicht verifizierte TOTP-Faktoren aufräumen.
      const { data: factors } = await supabase.auth.mfa.listFactors()
      for (const f of factors?.all ?? []) {
        if (f.factor_type === "totp" && f.status === "unverified") {
          await supabase.auth.mfa.unenroll({ factorId: f.id })
        }
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `WIMUS ERP (${new Date().toISOString().slice(0, 10)})`,
      })

      if (!active) return

      if (error || !data) {
        setServerError("MFA konnte nicht initialisiert werden.")
        setLoading(false)
        return
      }

      setEnroll({
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
      })
      setLoading(false)
    }

    start()
    return () => {
      active = false
    }
  }, [supabase])

  async function onSubmit(values: FormData) {
    setServerError(null)
    if (!enroll) return

    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: enroll.factorId,
      code: values.code,
    })

    if (error) {
      setServerError("Code ungültig oder abgelaufen.")
      form.reset()
      return
    }

    router.replace("/")
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Zwei-Faktor-Authentifizierung</CardTitle>
        <CardDescription>
          Scanne den QR-Code mit einer Authenticator-App und bestätige mit dem
          generierten Code.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {loading ? (
          <p className="text-muted-foreground text-sm">Initialisiere…</p>
        ) : enroll ? (
          <>
            <div className="flex flex-col items-center gap-3">
              {/* qr_code ist eine SVG-Data-URI von Supabase */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={enroll.qrCode}
                alt="QR-Code für Authenticator-App"
                className="size-44 rounded-lg border bg-white p-2"
              />
              <p className="text-muted-foreground text-center text-xs">
                Manuell:{" "}
                <code className="font-mono break-all">{enroll.secret}</code>
              </p>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-4"
              >
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bestätigungscode</FormLabel>
                      <FormControl>
                        <Input
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={6}
                          placeholder="123456"
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
                  disabled={form.formState.isSubmitting}
                  className="w-full"
                >
                  {form.formState.isSubmitting
                    ? "Prüfe…"
                    : "Aktivieren & fortfahren"}
                </Button>
              </form>
            </Form>
          </>
        ) : (
          <p className="text-destructive text-sm">
            {serverError ?? "Unbekannter Fehler."}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
