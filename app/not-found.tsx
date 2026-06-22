import Link from "next/link";
import { Home } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex flex-col gap-1">
        <p className="text-3xl font-semibold tracking-tight">404</p>
        <h1 className="text-lg font-medium">Seite nicht gefunden</h1>
        <p className="text-sm text-muted-foreground">
          Diese Seite existiert nicht oder wurde verschoben.
        </p>
      </div>
      <Button render={<Link href="/" />} variant="outline">
        <Home />
        <span>Zum Dashboard</span>
      </Button>
    </div>
  );
}
