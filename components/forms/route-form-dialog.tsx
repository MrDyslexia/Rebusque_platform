"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormStatusBanner, FormValidBadge } from "@/components/ui/form-status-banner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useRoutesStore } from "@/store/routes";
import { useVehiclesStore } from "@/store/vehicles";
import { useUsersStore } from "@/store/users";
import { branches } from "@/data";
import { Route, RouteStatus } from "@/types";
import { validateDate, validateTime } from "@/lib/validators";

interface RouteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  route?: Route | null;
}

const today = new Date().toISOString().slice(0, 10);

const emptyForm = {
  branchId: branches[0]?.id ?? "",
  date: today,
  status: "planificado" as RouteStatus,
  vehicleId: "",
  driverId: "",
  estimatedStartAt: "08:00",
  estimatedEndAt: "14:00",
};

type FormState = typeof emptyForm;

export function RouteFormDialog({ open, onOpenChange, route }: RouteFormDialogProps) {
  const addRoute = useRoutesStore((s) => s.addRoute);
  const updateRoute = useRoutesStore((s) => s.updateRoute);
  const vehicles = useVehiclesStore((s) => s.vehicles);
  const users = useUsersStore((s) => s.users);
  const isEdit = Boolean(route);

  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitAttempted, setSubmitAttempted] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    if (route) {
      setForm({
        branchId: route.branchId,
        date: route.date.slice(0, 10),
        status: route.status,
        vehicleId: route.vehicleId,
        driverId: route.driverId,
        estimatedStartAt: route.estimatedStartAt?.slice(11, 16) ?? "08:00",
        estimatedEndAt: route.estimatedEndAt?.slice(11, 16) ?? "14:00",
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
    setSubmitAttempted(false);
  }, [open, route]);

  const branchVehicles = vehicles.filter((v) => v.branchId === form.branchId);
  const branchDrivers = users.filter((u) => u.role === "driver" && u.branchId === form.branchId);

  function computeErrors(): Record<string, string> {
    const next: Record<string, string> = {};
    if (!form.vehicleId) next.vehicleId = "Selecciona un vehículo de la sucursal";
    if (!form.driverId) next.driverId = "Selecciona un conductor de la sucursal";

    const dateError = validateDate(form.date, "La fecha");
    if (dateError) next.date = dateError;

    const startError = validateTime(form.estimatedStartAt, "El inicio estimado");
    if (startError) next.estimatedStartAt = startError;

    const endError = validateTime(form.estimatedEndAt, "El término estimado");
    if (endError) {
      next.estimatedEndAt = endError;
    } else if (form.estimatedEndAt <= form.estimatedStartAt) {
      next.estimatedEndAt = "La hora de término debe ser posterior al inicio";
    }

    return next;
  }

  // Revalida en vivo una vez que el usuario intentó enviar al menos una vez,
  // para que el banner y los íconos reflejen las correcciones sin esperar otro submit.
  React.useEffect(() => {
    if (!submitAttempted) return;
    setErrors(computeErrors());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, submitAttempted]);

  function validate(): boolean {
    const next = computeErrors();
    setErrors(next);
    setSubmitAttempted(true);
    return Object.keys(next).length === 0;
  }

  const hasVisibleErrors = submitAttempted && Object.values(errors).some(Boolean);
  const isFormComplete = form.vehicleId && form.driverId && form.date;
  const showValidBadge = submitAttempted && !hasVisibleErrors && Boolean(isFormComplete);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      branchId: form.branchId,
      date: form.date,
      status: form.status,
      vehicleId: form.vehicleId,
      driverId: form.driverId,
      estimatedStartAt: `${form.date}T${form.estimatedStartAt}:00Z`,
      estimatedEndAt: `${form.date}T${form.estimatedEndAt}:00Z`,
    };

    if (isEdit && route) {
      updateRoute(route.id, payload);
    } else {
      addRoute(payload);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <form onSubmit={handleSubmit} noValidate>
          <DialogHeader>
            <div className="flex items-center justify-between gap-3">
              <DialogTitle>{isEdit ? "Editar ruta" : "Nueva ruta"}</DialogTitle>
              {showValidBadge && <FormValidBadge />}
            </div>
            <DialogDescription>
              {isEdit ? `Actualiza los datos de ${route?.code}` : "Planifica una nueva ruta de reparto"}
            </DialogDescription>
            <FormStatusBanner errors={submitAttempted ? errors : {}} />
          </DialogHeader>

          <DialogBody className="max-h-[65vh] overflow-y-auto scrollbar-thin">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="branch">Sucursal</Label>
                <Select
                  id="branch"
                  value={form.branchId}
                  onChange={(e) => setForm((f) => ({ ...f, branchId: e.target.value, vehicleId: "", driverId: "" }))}
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  invalid={submitAttempted && Boolean(errors.date)}
                  valid={submitAttempted && !errors.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  required
                />
                {submitAttempted && errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle">Vehículo</Label>
                <Select
                  id="vehicle"
                  value={form.vehicleId}
                  invalid={submitAttempted && Boolean(errors.vehicleId)}
                  valid={submitAttempted && !errors.vehicleId}
                  onChange={(e) => setForm((f) => ({ ...f, vehicleId: e.target.value }))}
                >
                  <option value="">Selecciona un vehículo</option>
                  {branchVehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.code} — {v.plate}</option>
                  ))}
                </Select>
                {submitAttempted && errors.vehicleId && <p className="text-xs text-destructive">{errors.vehicleId}</p>}
                {branchVehicles.length === 0 && <p className="text-xs text-muted-foreground">No hay vehículos en esta sucursal</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="driver">Conductor</Label>
                <Select
                  id="driver"
                  value={form.driverId}
                  invalid={submitAttempted && Boolean(errors.driverId)}
                  valid={submitAttempted && !errors.driverId}
                  onChange={(e) => setForm((f) => ({ ...f, driverId: e.target.value }))}
                >
                  <option value="">Selecciona un conductor</option>
                  {branchDrivers.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </Select>
                {submitAttempted && errors.driverId && <p className="text-xs text-destructive">{errors.driverId}</p>}
                {branchDrivers.length === 0 && <p className="text-xs text-muted-foreground">No hay conductores en esta sucursal</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select id="status" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as RouteStatus }))}>
                  <option value="planificado">Planificado</option>
                  <option value="en_curso">En curso</option>
                  <option value="completado">Completado</option>
                  <option value="cancelado">Cancelado</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="start">Inicio estimado</Label>
                <Input
                  id="start"
                  type="time"
                  value={form.estimatedStartAt}
                  invalid={submitAttempted && Boolean(errors.estimatedStartAt)}
                  onChange={(e) => setForm((f) => ({ ...f, estimatedStartAt: e.target.value }))}
                />
                {submitAttempted && errors.estimatedStartAt && <p className="text-xs text-destructive">{errors.estimatedStartAt}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">Término estimado</Label>
                <Input
                  id="end"
                  type="time"
                  value={form.estimatedEndAt}
                  invalid={submitAttempted && Boolean(errors.estimatedEndAt)}
                  onChange={(e) => setForm((f) => ({ ...f, estimatedEndAt: e.target.value }))}
                />
                {submitAttempted && errors.estimatedEndAt && <p className="text-xs text-destructive">{errors.estimatedEndAt}</p>}
              </div>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-[#ff0066] hover:bg-[#ff0066]/90">
              {isEdit ? "Guardar cambios" : "Crear ruta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
