"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Wrench, Calendar, Gauge, DollarSign, MapPin, User } from "lucide-react";

import { Sheet, SheetBody, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VehicleStatusBadge } from "@/components/status-badge";
import { MaintenanceStatusBadge } from "./maintenance-status-badge";
import { MaintenanceFormDialog } from "./maintenance-form-dialog";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { useVehiclesStore } from "@/store/vehicles";
import { branches, users } from "@/data";
import { Maintenance, Vehicle } from "@/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { maintenanceTypeLabel, nextScheduledMaintenance } from "@/lib/maintenance";
import { cn } from "@/lib/utils";

interface VehicleDetailSheetProps {
  vehicle: Vehicle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditVehicle?: (vehicle: Vehicle) => void;
}

export function VehicleDetailSheet({ vehicle, open, onOpenChange, onEditVehicle }: VehicleDetailSheetProps) {
  const removeMaintenance = useVehiclesStore((s) => s.removeMaintenance);

  const [maintenanceFormOpen, setMaintenanceFormOpen] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState<Maintenance | null>(null);
  const [deletingMaintenance, setDeletingMaintenance] = useState<Maintenance | null>(null);

  const branch = vehicle ? branches.find((b) => b.id === vehicle.branchId) : undefined;
  const driver = vehicle ? users.find((u) => u.id === vehicle.currentDriverId) : undefined;

  const sortedHistory = useMemo(() => {
    if (!vehicle) return [];
    return [...vehicle.maintenanceHistory].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [vehicle]);

  const nextMaintenance = useMemo(() => {
    if (!vehicle) return undefined;
    return nextScheduledMaintenance(vehicle.maintenanceHistory);
  }, [vehicle]);

  const stats = useMemo(() => {
    if (!vehicle) return { total: 0, completed: 0, pending: 0, totalCost: 0 };
    const completed = vehicle.maintenanceHistory.filter((m) => m.status === "completada").length;
    const pending = vehicle.maintenanceHistory.filter(
      (m) => m.status === "programada" || m.status === "en_progreso"
    ).length;
    const totalCost = vehicle.maintenanceHistory.reduce(
      (acc, m) => acc + (m.cost ?? 0),
      0
    );
    return {
      total: vehicle.maintenanceHistory.length,
      completed,
      pending,
      totalCost,
    };
  }, [vehicle]);

  if (!vehicle) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetHeader className="pr-12">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ff0066]/10 text-[#ff0066]">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <SheetTitle>{vehicle.code}</SheetTitle>
              <SheetDescription>
                {vehicle.plate} · <span className="capitalize">{vehicle.type}</span>
              </SheetDescription>
            </div>
          </div>
          <div className="pt-2">
            <VehicleStatusBadge status={vehicle.status} />
          </div>
        </SheetHeader>

        <SheetBody className="max-h-[calc(100vh-140px)]">
          <Tabs defaultValue="details">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Detalles</TabsTrigger>
              <TabsTrigger value="history">Historial</TabsTrigger>
              <TabsTrigger value="stats">Resumen</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Información general</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <InfoRow icon={MapPin} label="Sucursal" value={branch?.name ?? "—"} />
                  <InfoRow
                    icon={Gauge}
                    label="Capacidad"
                    value={`${vehicle.capacity.weightKg} kg / ${vehicle.capacity.volumeM3} m³`}
                  />
                  <InfoRow icon={User} label="Conductor" value={driver?.name ?? "Sin asignar"} />
                  <InfoRow
                    icon={Calendar}
                    label="Próxima mantención"
                    value={nextMaintenance ? formatDate(nextMaintenance.date) : "Sin mantención programada"}
                    highlight={Boolean(nextMaintenance)}
                  />
                </CardContent>
              </Card>

              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => {
                  onEditVehicle?.(vehicle);
                  onOpenChange(false);
                }}
              >
                <Pencil className="h-4 w-4" /> Editar vehículo
              </Button>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {stats.total} mantenciones registradas
                </h3>
                <Button
                  size="sm"
                  className="gap-1.5 bg-[#ff0066] hover:bg-[#ff0066]/90"
                  onClick={() => {
                    setEditingMaintenance(null);
                    setMaintenanceFormOpen(true);
                  }}
                >
                  <Plus className="h-3.5 w-3.5" /> Nueva
                </Button>
              </div>

              {sortedHistory.length === 0 ? (
                <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
                  <Wrench className="mx-auto mb-2 h-8 w-8 opacity-50" />
                  <p>No hay mantenciones registradas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedHistory.map((m) => (
                    <Card key={m.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{maintenanceTypeLabel[m.type]}</p>
                              <MaintenanceStatusBadge status={m.status} />
                            </div>
                            <p className="text-sm text-muted-foreground">{formatDate(m.date)}</p>
                            <p className="mt-1 text-sm">{m.description}</p>
                            {m.provider && (
                              <p className="text-xs text-muted-foreground">Taller: {m.provider}</p>
                            )}
                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                              {m.cost !== undefined && (
                                <Badge variant="outline" className="gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  {formatCurrency(m.cost)}
                                </Badge>
                              )}
                              {m.odometerKm !== undefined && (
                                <Badge variant="outline" className="gap-1">
                                  <Gauge className="h-3 w-3" />
                                  {m.odometerKm.toLocaleString("es-CL")} km
                                </Badge>
                              )}
                              {m.nextDate && (
                                <Badge variant="outline" className="gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Próx: {formatDate(m.nextDate)}
                                </Badge>
                              )}
                            </div>
                            {m.notes && (
                              <p className="mt-2 text-xs text-muted-foreground">Notas: {m.notes}</p>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 flex justify-end gap-2 border-t pt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            onClick={() => {
                              setEditingMaintenance(m);
                              setMaintenanceFormOpen(true);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" /> Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setDeletingMaintenance(m)}
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Eliminar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="stats" className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Total mantenciones" value={String(stats.total)} />
                <StatCard label="Completadas" value={String(stats.completed)} variant="success" />
                <StatCard label="Pendientes" value={String(stats.pending)} variant="warning" />
                <StatCard label="Costo total" value={formatCurrency(stats.totalCost)} />
              </div>

              {nextMaintenance && (
                <Card className="border-[#ff0066]/20 bg-[#ff0066]/5">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium">Próxima mantención programada</p>
                    <p className="text-2xl font-semibold">{formatDate(nextMaintenance.date)}</p>
                    <p className="text-sm text-muted-foreground">
                      {maintenanceTypeLabel[nextMaintenance.type]} — {nextMaintenance.description}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </SheetBody>
      </Sheet>

      <MaintenanceFormDialog
        open={maintenanceFormOpen}
        onOpenChange={setMaintenanceFormOpen}
        maintenance={editingMaintenance}
        vehicleId={vehicle.id}
      />

      <ConfirmDeleteDialog
        open={Boolean(deletingMaintenance)}
        onOpenChange={(open) => !open && setDeletingMaintenance(null)}
        title="Eliminar mantención"
        description={`Esta acción eliminará el registro de mantención. No se puede deshacer.`}
        onConfirm={() => {
          if (deletingMaintenance) {
            removeMaintenance(vehicle.id, deletingMaintenance.id);
            setDeletingMaintenance(null);
          }
        }}
      />
    </>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <span className={cn("text-sm font-medium", highlight && "text-[#ff0066]")}>{value}</span>
    </div>
  );
}

function StatCard({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant?: "default" | "success" | "warning";
}) {
  return (
    <Card className={cn(variant === "success" && "border-emerald-500/20", variant === "warning" && "border-amber-500/20")}>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p
          className={cn(
            "text-xl font-semibold",
            variant === "success" && "text-emerald-600",
            variant === "warning" && "text-amber-600"
          )}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
