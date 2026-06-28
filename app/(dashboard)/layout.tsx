import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, Plus } from "lucide-react";

import { createServerClient } from "@/lib/supabase/server";
import { CommandPalette } from "@/components/search/command-palette";
import { SearchTrigger } from "@/components/search/search-trigger";
import { getActiveProjekt, getProjekte } from "@/lib/projekte";
import { isPreviewNoAuth } from "@/lib/dev/preview";
import { CrmSidebar, type SidebarUser } from "@/components/crm-sidebar";
import { ProjektProvider } from "@/components/providers/projekt-provider";
import { ProjektTheme } from "@/components/layout/projekt-theme";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

function buildUser(email: string, name: string): SidebarUser {
  const initials =
    name
      .split(/\s+/)
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || email.slice(0, 2).toUpperCase();

  return { name, email, initials };
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Vorschau/Demo: Auth-Guard überspringen (nur wenn explizit aktiviert).
  if (!user && !isPreviewNoAuth()) {
    redirect("/login");
  }

  const projekte = await getProjekte();
  const activeProjekt = await getActiveProjekt(projekte);

  const email = user?.email ?? "vorschau@wimus.de";
  const name =
    (user?.user_metadata?.name as string | undefined)?.trim() ||
    email.split("@")[0] ||
    "Vorschau";
  const sidebarUser = buildUser(email, name);

  return (
    <ProjektProvider projekt={activeProjekt} projekte={projekte}>
      <ProjektTheme projekt={activeProjekt} projekte={projekte} />
      <SidebarProvider>
        <CrmSidebar user={sidebarUser} />
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-sm">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-1 h-5 self-center"
            />
            <div className="hidden w-full max-w-sm items-center sm:flex">
              <SearchTrigger />
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Benachrichtigungen"
              >
                <Bell />
              </Button>
              <Button size="sm" render={<Link href="/objekte/neu" />}>
                <Plus />
                <span className="hidden sm:inline">Neues Objekt</span>
              </Button>
            </div>
          </header>
          <div className="flex flex-1 flex-col">{children}</div>
        </SidebarInset>
        <CommandPalette />
      </SidebarProvider>
    </ProjektProvider>
  );
}
