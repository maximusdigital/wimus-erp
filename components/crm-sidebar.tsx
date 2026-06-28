"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BedDouble,
  Building2,
  CalendarClock,
  Calculator,
  ClipboardList,
  DoorOpen,
  FileText,
  BookOpen,
  Download,
  FolderArchive,
  GitBranch,
  Inbox,
  Layers,
  LayoutDashboard,
  ListChecks,
  ListTree,
  LogOut,
  Mail,
  Package,
  PieChart,
  Receipt,
  Landmark,
  Settings,
  SlidersHorizontal,
  Tags,
  Target,
  UserCog,
  TrendingUp,
  Truck,
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
import { ProjektSwitcher } from "@/components/layout/projekt-switcher";

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
  { title: "Akteure", href: "/akteure", icon: UserCog },
  { title: "Inventar", href: "/inventar", icon: Package },
  { title: "Buchungen", href: "/buchungen", icon: BedDouble },
  { title: "Belegung", href: "/belegung", icon: CalendarClock },
  { title: "Finanzen", href: "/finanzen", icon: Wallet },
  { title: "Betriebskosten", href: "/betriebskosten", icon: Calculator },
  { title: "Fristen & Termine", href: "/fristen", icon: CalendarClock },
  { title: "Dokumente", href: "/dokumente", icon: FolderArchive },
];

// FiBu (Spec 0002) – Stammdaten/Kontierung.
const fibuNav: NavItem[] = [
  { title: "Belege", href: "/fibu/belege", icon: FileText },
  { title: "Gesellschafter", href: "/fibu/gesellschafter", icon: Landmark },
  { title: "Kontenrahmen", href: "/fibu/konten", icon: BookOpen },
  { title: "Kontierungsregeln", href: "/fibu/kontierungsregeln", icon: Receipt },
  { title: "Lieferanten", href: "/fibu/lieferanten", icon: Truck },
  { title: "Auswertung", href: "/fibu/auswertung", icon: PieChart },
  { title: "Konsolidierung", href: "/fibu/konsolidierung", icon: Layers },
  { title: "Objekt-Tags", href: "/fibu/objekt-tags", icon: Tags },
  { title: "Berichtspositionen", href: "/fibu/reporting-taxonomie", icon: ListTree },
  { title: "Feststellung", href: "/fibu/feststellung", icon: PieChart },
  { title: "DATEV-Export", href: "/fibu/export", icon: Download },
];

// CRM (Spec 0003) – Leads & Deal-Pipelines.
const crmNav: NavItem[] = [
  { title: "Pipeline", href: "/crm", icon: Target },
  { title: "Lead-Inbox", href: "/crm/leads", icon: Inbox },
  { title: "Aktivitäten", href: "/crm/aktivitaeten", icon: ListChecks },
  { title: "Pipelines", href: "/crm/pipelines", icon: GitBranch },
  { title: "Datenfelder", href: "/crm/datenfelder", icon: SlidersHorizontal },
];

// Ab Phase 2: noch nicht gebaut – sichtbar als Roadmap, aber deaktiviert.
const secondaryNav: NavItem[] = [
  { title: "E-Mails", href: "/emails", icon: Mail, soon: true },
  { title: "Bestandsentwicklung", href: "/bestandsentwicklung", icon: TrendingUp, soon: true },
];

// Aktive Verwaltungs-Navigation.
const settingsNav: NavItem[] = [
  { title: "Einstellungen", href: "/einstellungen", icon: Settings },
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
          <ProjektSwitcher />
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
          <SidebarGroupLabel>FiBu</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMenu items={fibuNav} />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Vertrieb (CRM)</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMenu items={crmNav} />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Verwaltung</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMenu items={settingsNav} />
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
