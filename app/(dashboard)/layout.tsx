import { redirect } from "next/navigation";
import { Bell, Plus, Search } from "lucide-react";

import { createServerClient } from "@/lib/supabase/server";
import { getActiveMandant, getUserMandanten } from "@/lib/mandanten";
import { CrmSidebar, type SidebarUser } from "@/components/crm-sidebar";
import { MandantProvider } from "@/components/providers/mandant-provider";
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

  // Dev-Vorschau: Auth-Guard überspringen (NUR in Entwicklung + explizit aktiviert).
  const previewNoAuth =
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_PREVIEW_NO_AUTH === "1";

  if (!user && !previewNoAuth) {
    redirect("/login");
  }

  const mandanten = await getUserMandanten();
  const activeMandant = await getActiveMandant(mandanten);

  const email = user?.email ?? "vorschau@wimus.de";
  const name =
    (user?.user_metadata?.name as string | undefined)?.trim() ||
    email.split("@")[0] ||
    "Vorschau";
  const sidebarUser = buildUser(email, name);

  return (
    <MandantProvider mandant={activeMandant} mandanten={mandanten}>
      <SidebarProvider>
        <CrmSidebar user={sidebarUser} />
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-sm">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-1 h-5 self-center"
            />
            <div className="relative hidden w-full max-w-sm items-center sm:flex">
              <Search className="pointer-events-none absolute left-2.5 size-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Objekte, Mieter oder Vorgänge suchen …"
                className="h-8 w-full rounded-lg border border-input bg-background py-1 pr-3 pl-8 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                aria-label="Suche"
              />
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Benachrichtigungen"
              >
                <Bell />
              </Button>
              <Button size="sm">
                <Plus />
                <span className="hidden sm:inline">Neuer Vorgang</span>
              </Button>
            </div>
          </header>
          <div className="flex flex-1 flex-col">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </MandantProvider>
  );
}
