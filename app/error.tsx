"use client";

import { useEffect } from "react";
import { RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">
          Etwas ist schiefgelaufen
        </h1>
        <p className="text-sm text-muted-foreground">
          Beim Laden dieser Seite ist ein Fehler aufgetreten.
        </p>
        {error.digest ? (
          <p className="mt-1 text-xs text-muted-foreground/70">
            Fehler-ID: {error.digest}
          </p>
        ) : null}
      </div>
      <Button onClick={() => reset()}>
        <RotateCw />
        <span>Erneut versuchen</span>
      </Button>
    </div>
  );
}
