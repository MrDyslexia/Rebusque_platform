"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Wrench, Pencil, Trash2, CalendarDays, LayoutGrid } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VehicleStatusBadge } from "@/components/status-badge";
import { MaintenanceCalendar } from "@/components/vehicles/maintenance-calendar";
import { MaintenanceFormDialog } from "@/components/vehicles/maintenance-form-dialog";
import { VehicleDetailSheet } from "@/components/vehicles/vehicle-detail-sheet";
import { useVehiclesStore } from "@/store/vehicles";
import { branches, users } from "@/data";
import { Maintenance, Vehicle, VehicleStatus } from "@/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { nextScheduledMaintenance } from "@/lib/maintenance";
import { VehicleFormDialog } from "@/components/forms/vehicle-form-dialog";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { toastSuccess, toastError, TOAST_MSGS } from "@/lib/toast";

const statuses: VehicleStatus[] = ["disponible", "en_ruta", "mantenimiento", "fuera_de_servicio"];

export default function VehiclesPage() {
  const vehicles = useVehiclesStore((s) => s.vehicles);
  const removeVehicle = useVehiclesStore((s) => s.removeVehicle);

  const [activeTab, setActiveTab] = useState("fleet");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | VehicleStatus>("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null);

  const [detailVehicle, setDetailVehicle] = useState<Vehicle | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [maintenanceFormOpen, setMaintenanceFormOpen] = useState(false);
  const [maintenanceVehicleId, setMaintenanceVehicleId] = useState<string | null>(null);
  const [maintenanceDefaultDate, setMaintenanceDefaultDate] = useState<Date | null>(null);
  const [editingMaintenance, setEditingMaintenance] = useState<Maintenance | null>(null);

  const allMaintenances = useMemo(
    () => vehicles.flatMap((v) => v.maintenanceHistory),
    [vehicles]
  );

  const overdueCount = useMemo(() => {
    const now = new Date();
    return allMaintenances.filter(
      (m) =>
        (m.status === "programada" || m.status === "en_progreso") &&
        m.nextDate &&
        new Date(m.nextDate) < now
    ).length;
  }, [allMaintenances]);

  const soonCount = useMemo(() => {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return allMaintenances.filter(
      (m) =>
        (m.status === "programada" || m.status === "en_progreso") &&
        m.nextDate &&
        new Date(m.nextDate) >= now &&
        new Date(m.nextDate) <= in7Days
    ).length;
  }, [allMaintenances]);

  const filtered = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const matchesQuery =
        vehicle.code.toLowerCase().includes(query.toLowerCase()) ||
        vehicle.plate.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter ? vehicle.status === statusFilter : true;
      return matchesQuery && matchesStatus;
    });
  }, [vehicles, query, statusFilter]);

  function openVehicleDetail(vehicle: Vehicle) {
    setDetailVehicle(vehicle);
    setDetailOpen(true);
  }

  function openMaintenanceForm(vehicleId?: string, date?: Date, maintenance?: Maintenance) {
    if (maintenance) {
      setEditingMaintenance(maintenance);
      setMaintenanceVehicleId(maintenance.vehicleId);
      setMaintenanceDefaultDate(null);
    } else {
      setEditingMaintenance(null);
      setMaintenanceVehicleId(vehicleId ?? null);
      setMaintenanceDefaultDate(date ?? null);
    }
    setMaintenanceFormOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Vehículos</h1>
          <p className="text-muted-foreground">Gestión de flota, mantenciones y calendario</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => openMaintenanceForm()}
          >
            <Wrench className="h-4 w-4" /> Nueva mantención
          </Button>
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
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard
          label="Vehículos en flota"
          value={vehicles.length}
          icon={LayoutGrid}
        />
        <SummaryCard
          label="Mantenciones vencidas"
          value={overdueCount}
          icon={Wrench}
          variant="danger"
        />
        <SummaryCard
          label="Mantenciones próximas (7 días)"
          value={soonCount}
          icon={CalendarDays}
          variant="warning"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="fleet" className="gap-2">
            <LayoutGrid className="h-4 w-4" /> Flota
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <CalendarDays className="h-4 w-4" /> Calendario de mantenciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fleet" className="space-y-4">
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
                    <Input
                      placeholder="Buscar código o patente..."
                      className="pl-9"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as VehicleStatus | "")}
                  >
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
                {filtered.map((vehicle) => (
                  <VehicleCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    onOpenDetail={() => openVehicleDetail(vehicle)}
                    onEdit={() => {
                      setEditingVehicle(vehicle);
                      setFormOpen(true);
                    }}
                    onDelete={() => setDeletingVehicle(vehicle)}
                    onAddMaintenance={() => openMaintenanceForm(vehicle.id)}
                  />
                ))}
                {filtered.length === 0 && (
                  <div className="col-span-full py-12 text-center text-muted-foreground">
                    No se encontraron vehículos
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <MaintenanceCalendar
            maintenances={allMaintenances}
            vehicles={vehicles}
            onSelectMaintenance={(m) => openMaintenanceForm(undefined, undefined, m)}
            onNewMaintenance={(date) => openMaintenanceForm(undefined, date)}
          />
        </TabsContent>
      </Tabs>

      <VehicleFormDialog open={formOpen} onOpenChange={setFormOpen} vehicle={editingVehicle} />

      <MaintenanceFormDialog
        open={maintenanceFormOpen}
        onOpenChange={setMaintenanceFormOpen}
        maintenance={editingMaintenance}
        vehicleId={maintenanceVehicleId}
        defaultDate={maintenanceDefaultDate}
      />

      <VehicleDetailSheet
        vehicle={detailVehicle}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEditVehicle={(v) => {
          setEditingVehicle(v);
          setFormOpen(true);
        }}
      />

      <ConfirmDeleteDialog
        open={Boolean(deletingVehicle)}
        onOpenChange={(open) => !open && setDeletingVehicle(null)}
        title="Eliminar vehículo"
        description={`Esta acción eliminará el vehículo ${deletingVehicle?.code ?? ""} de la flota. No se puede deshacer.`}
        onConfirm={() => {
          try {
            if (deletingVehicle) {
              removeVehicle(deletingVehicle.id);
              toastSuccess(TOAST_MSGS.deleted("Vehículo"));
            }
          } catch {
            toastError(TOAST_MSGS.deleteError("el vehículo"));
          }
        }}
      />
    </div>
  );
}

function VehicleCard({
  vehicle,
  onOpenDetail,
  onEdit,
  onDelete,
  onAddMaintenance,
}: {
  vehicle: Vehicle;
  onOpenDetail: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddMaintenance: () => void;
}) {
  const branch = branches.find((b) => b.id === vehicle.branchId);
  const driver = users.find((u) => u.id === vehicle.currentDriverId);
  const nextMaintenance = nextScheduledMaintenance(vehicle.maintenanceHistory);
  const lastMaintenance = [...vehicle.maintenanceHistory].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )[0];

  return (
    <Card className="bg-secondary/30 transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <button
          type="button"
          onClick={onOpenDetail}
          className="w-full text-left"
        >
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

          <div className="mt-4 space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              {nextMaintenance ? (
                <span>Próxima: {formatDate(nextMaintenance.date)}</span>
              ) : (
                <span className="text-muted-foreground">Sin mantención programada</span>
              )}
            </div>
            {lastMaintenance?.cost !== undefined && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>Último costo: {formatCurrency(lastMaintenance.cost)}</span>
              </div>
            )}
          </div>
        </button>

        <div className="mt-4 flex flex-wrap justify-end gap-2 border-t pt-4">
          <Button size="sm" variant="outline" className="gap-1.5" onClick={onAddMaintenance}>
            <Wrench className="h-3.5 w-3.5" /> Mantención
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" /> Editar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" /> Eliminar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  variant,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  variant?: "default" | "warning" | "danger";
}) {
  return (
    <Card
      className={
        variant === "danger"
          ? "border-destructive/20"
          : variant === "warning"
            ? "border-amber-500/20"
            : undefined
      }
    >
      <CardContent className="flex items-center gap-4 p-4">
        <div
          className={
            variant === "danger"
              ? "rounded-full bg-destructive/10 p-2.5 text-destructive"
              : variant === "warning"
                ? "rounded-full bg-amber-500/10 p-2.5 text-amber-600"
                : "rounded-full bg-[#ff0066]/10 p-2.5 text-[#ff0066]"
          }
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p
            className={
              variant === "danger"
                ? "text-2xl font-semibold text-destructive"
                : variant === "warning"
                  ? "text-2xl font-semibold text-amber-600"
                  : "text-2xl font-semibold"
            }
          >
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
