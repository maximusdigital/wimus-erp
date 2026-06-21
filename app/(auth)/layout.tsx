export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-muted/40 p-4 sm:p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">WIMUS ERP</h1>
          <p className="text-muted-foreground text-sm">
            Württembergische Immobilien Management &amp; Service
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
