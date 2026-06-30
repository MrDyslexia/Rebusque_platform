"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Wrench, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { VehicleStatusBadge } from "@/components/status-badge";
import { useVehiclesStore } from "@/store/vehicles";
import { branches, users } from "@/data";
import { VehicleStatus, Vehicle } from "@/types";
import { formatDate } from "@/lib/format";
import { VehicleFormDialog } from "@/components/forms/vehicle-form-dialog";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";

const statuses: VehicleStatus[] = ["disponible", "en_ruta", "mantenimiento", "fuera_de_servicio"];

export default function VehiclesPage() {
  const vehicles = useVehiclesStore((s) => s.vehicles);
  const removeVehicle = useVehiclesStore((s) => s.removeVehicle);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | VehicleStatus>("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null);

  const filtered = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const matchesQuery =
        vehicle.code.toLowerCase().includes(query.toLowerCase()) ||
        vehicle.plate.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter ? vehicle.status === statusFilter : true;
      return matchesQuery && matchesStatus;
    });
  }, [vehicles, query, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Vehículos</h1>
          <p className="text-muted-foreground">Gestión de camiones, furgones y mantenciones</p>
        </div>
        <Button
          className="gap-2 bg-[#ff0066] hover:bg-[#ff0066]/90"
          onClick={() => {
            setEditingVehicle(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Nuevo vehículo
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">Flota</CardTitle>
              <CardDescription>{filtered.length} vehículos encontrados</CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Buscar código o patente..." className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as VehicleStatus | "")}>
                <option value="">Todos los estados</option>
                {statuses.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                ))}
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((vehicle) => {
              const branch = branches.find((b) => b.id === vehicle.branchId);
              const driver = users.find((u) => u.id === vehicle.currentDriverId);
              const nextMaintenance = vehicle.maintenanceHistory[0]?.nextDate;
              return (
                <Card key={vehicle.id} className="bg-secondary/30">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-lg font-semibold">{vehicle.code}</div>
                        <div className="text-sm text-muted-foreground">{vehicle.plate}</div>
                      </div>
                      <VehicleStatusBadge status={vehicle.status} />
                    </div>

                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tipo</span>
                        <span className="capitalize">{vehicle.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sucursal</span>
                        <span>{branch?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Capacidad</span>
                        <span>{vehicle.capacity.weightKg} kg / {vehicle.capacity.volumeM3} m³</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Conductor</span>
                        <span>{driver?.name ?? "Sin asignar"}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-sm">
                      <Wrench className="h-4 w-4 text-muted-foreground" />
                      {nextMaintenance ? (
                        <span>Próxima mantención: {formatDate(nextMaintenance)}</span>
                      ) : (
                        <span className="text-muted-foreground">Sin mantención programada</span>
                      )}
                    </div>

                    <div className="mt-4 flex justify-end gap-2 border-t pt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => {
                          setEditingVehicle(vehicle);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" /> Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setDeletingVehicle(vehicle)}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Eliminar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground">No se encontraron vehículos</div>
            )}
          </div>
        </CardContent>
      </Card>

      <VehicleFormDialog open={formOpen} onOpenChange={setFormOpen} vehicle={editingVehicle} />

      <ConfirmDeleteDialog
        open={Boolean(deletingVehicle)}
        onOpenChange={(open) => !open && setDeletingVehicle(null)}
        title="Eliminar vehículo"
        description={`Esta acción eliminará el vehículo ${deletingVehicle?.code ?? ""} de la flota. No se puede deshacer.`}
        onConfirm={() => {
          if (deletingVehicle) removeVehicle(deletingVehicle.id);
        }}
      />
    </div>
  );
}
