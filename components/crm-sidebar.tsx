"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BedDouble,
  Building2,
  CalendarClock,
  ClipboardList,
  DoorOpen,
  FileText,
  FolderArchive,
  LayoutDashboard,
  LogOut,
  Mail,
  Package,
  Settings,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { MandantSwitcher } from "@/components/layout/mandant-switcher";

export type SidebarUser = {
  name: string;
  email: string;
  initials: string;
};

type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  soon?: boolean;
};

// Phase 0 + 1: implementierte Seiten
const mainNav: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Objekte", href: "/objekte", icon: Building2 },
  { title: "Einheiten", href: "/einheiten", icon: DoorOpen },
  { title: "Kontakte", href: "/kontakte", icon: Users },
  { title: "Verträge", href: "/vertraege", icon: FileText },
  { title: "Vorgänge", href: "/vorgaenge", icon: ClipboardList },
  { title: "Inventar", href: "/inventar", icon: Package },
  { title: "Buchungen", href: "/buchungen", icon: BedDouble },
  { title: "Finanzen", href: "/finanzen", icon: Wallet },
  { title: "Dokumente", href: "/dokumente", icon: FolderArchive },
];

// Ab Phase 2: noch nicht gebaut – sichtbar als Roadmap, aber deaktiviert.
const secondaryNav: NavItem[] = [
  { title: "E-Mails", href: "/emails", icon: Mail, soon: true },
  { title: "Fristen & Termine", href: "/fristen", icon: CalendarClock, soon: true },
  { title: "Bestandsentwicklung", href: "/bestandsentwicklung", icon: TrendingUp, soon: true },
  { title: "Einstellungen", href: "/einstellungen", icon: Settings, soon: true },
];

function isActiveHref(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavMenu({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {items.map((item) => {
        const active = isActiveHref(pathname, item.href);
        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              isActive={item.soon ? false : active}
              tooltip={item.soon ? `${item.title} (in Vorbereitung)` : item.title}
              aria-disabled={item.soon || undefined}
              render={item.soon ? <span /> : <Link href={item.href} />}
            >
              <item.icon />
              <span>{item.title}</span>
            </SidebarMenuButton>
            {item.soon ? (
              <SidebarMenuBadge className="text-[0.6rem] uppercase tracking-wide text-sidebar-foreground/50">
                bald
              </SidebarMenuBadge>
            ) : item.badge ? (
              <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
            ) : null}
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

export function CrmSidebar({ user }: { user: SidebarUser }) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="Startseite"
              render={<Link href="/" />}
              className="data-active:bg-transparent hover:bg-sidebar-accent/60"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Building2 className="size-5" />
              </div>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-semibold">WIMUS ERP</span>
                <span className="truncate text-xs text-sidebar-foreground/60">
                  Schaltzentrale
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="px-1 pt-1 group-data-[collapsible=icon]:hidden">
          <MandantSwitcher />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Hauptmenü</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMenu items={mainNav} />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Bald verfügbar</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMenu items={secondaryNav} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip={`Angemeldet als ${user.name}`}
              className="gap-2.5"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">
                {user.initials}
              </div>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-medium">
                  {user.name}
                </span>
                <span className="truncate text-xs text-sidebar-foreground/60">
                  {user.email}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <form action="/auth/signout" method="post">
              <SidebarMenuButton
                tooltip="Abmelden"
                render={<button type="submit" />}
              >
                <LogOut />
                <span>Abmelden</span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
