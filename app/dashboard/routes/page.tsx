"use client";

import { useMemo, useState } from "react";
import { Calendar, MapPin, Pencil, Plus, Search, Trash2, Truck, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RouteStatusBadge } from "@/components/status-badge";
import { useRoutesStore } from "@/store/routes";
import { useVehiclesStore } from "@/store/vehicles";
import { useUsersStore } from "@/store/users";
import { branches, orders } from "@/data";
import { formatDate } from "@/lib/format";
import { Route, RouteStatus } from "@/types";
import { RouteFormDialog } from "@/components/forms/route-form-dialog";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";

const statuses: RouteStatus[] = ["planificado", "en_curso", "completado", "cancelado"];

export default function RoutesPage() {
  const routes = useRoutesStore((s) => s.routes);
  const removeRoute = useRoutesStore((s) => s.removeRoute);
  const vehicles = useVehiclesStore((s) => s.vehicles);
  const users = useUsersStore((s) => s.users);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | RouteStatus>("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [deletingRoute, setDeletingRoute] = useState<Route | null>(null);

  const filtered = useMemo(() => {
    return routes.filter((route) => {
      const matchesQuery =
        route.code.toLowerCase().includes(query.toLowerCase()) ||
        route.vehicleId.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter ? route.status === statusFilter : true;
      return matchesQuery && matchesStatus;
    });
  }, [routes, query, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Rutas</h1>
          <p className="text-muted-foreground">Planificación y seguimiento de rutas de reparto</p>
        </div>
        <Button
          className="gap-2 bg-[#ff0066] hover:bg-[#ff0066]/90"
          onClick={() => {
            setEditingRoute(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Nueva ruta
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">Listado de rutas</CardTitle>
              <CardDescription>{filtered.length} rutas encontradas</CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Buscar código..." className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as RouteStatus | "")}>
                <option value="">Todos los estados</option>
                {statuses.map((s) => (
                  <option key={s} value={s}>{s.replace("_", " ")}</option>
                ))}
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {filtered.map((route) => {
              const vehicle = vehicles.find((v) => v.id === route.vehicleId);
              const driver = users.find((u) => u.id === route.driverId);
              const branch = branches.find((b) => b.id === route.branchId);
              const stops = orders.filter((o) => o.routeAssignment?.routeId === route.id);
              return (
                <Card key={route.id} className="bg-secondary/30">
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-semibold">{route.code}</span>
                          <RouteStatusBadge status={route.status} />
                        </div>
                        <div className="grid gap-x-6 gap-y-2 text-sm text-muted-foreground sm:grid-cols-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {formatDate(route.date)}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {branch?.name}
                          </div>
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4" />
                            {vehicle?.code} — {vehicle?.plate}
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {driver?.name}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <div className="flex flex-col gap-2 text-right">
                          <Badge variant="outline">{stops.length} paradas</Badge>
                          <div className="text-sm text-muted-foreground">
                            {route.metrics?.plannedDistanceKm ?? 0} km planificados
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {route.metrics?.plannedTimeMin ?? 0} min estimados
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            onClick={() => {
                              setEditingRoute(route);
                              setFormOpen(true);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" /> Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setDeletingRoute(route)}
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Eliminar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {filtered.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">No se encontraron rutas</div>
            )}
          </div>
        </CardContent>
      </Card>

      <RouteFormDialog open={formOpen} onOpenChange={setFormOpen} route={editingRoute} />

      <ConfirmDeleteDialog
        open={Boolean(deletingRoute)}
        onOpenChange={(open) => !open && setDeletingRoute(null)}
        title="Eliminar ruta"
        description={`Esta acción eliminará la ruta ${deletingRoute?.code ?? ""}. No se puede deshacer.`}
        onConfirm={() => {
          if (deletingRoute) removeRoute(deletingRoute.id);
        }}
      />
    </div>
  );
}
