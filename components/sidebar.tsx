"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Boxes,
  LayoutDashboard,
  LogOut,
  Map,
  Package,
  Route,
  Settings,
  Truck,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/orders", label: "Encomiendas", icon: Package },
  { href: "/dashboard/routes", label: "Rutas", icon: Route },
  { href: "/dashboard/vehicles", label: "Vehículos", icon: Truck },
  { href: "/dashboard/map", label: "Mapa en vivo", icon: Map },
  { href: "/dashboard/users", label: "Usuarios", icon: Users },
  { href: "/dashboard/billing", label: "Facturación", icon: Boxes },
  { href: "/dashboard/settings", label: "Configuración", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center gap-3 border-b px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#ff0066] text-white font-bold">R</div>
        <span className="text-lg font-semibold tracking-tight">El Rebusque</span>
      </div>

      <nav className="flex-1 overflow-auto py-4">
        <ul className="space-y-1 px-3">
          {nav.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-[#ff0066]"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t p-4 space-y-3">
        <ThemeToggle />
        <Link
          href="/login"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-5 w-5" aria-hidden="true" />
          Cerrar sesión
        </Link>
      </div>
    </aside>
  );
}
