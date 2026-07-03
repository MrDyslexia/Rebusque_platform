"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormStatusBanner, FormValidBadge } from "@/components/ui/form-status-banner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useVehiclesStore } from "@/store/vehicles";
import { Maintenance, MaintenanceStatus, MaintenanceType, Vehicle } from "@/types";
import { runValidators, validateDate, validateNumber, validateRequired } from "@/lib/validators";
import { maintenanceStatusLabel, maintenanceStatusOptions, maintenanceTypeLabel, maintenanceTypeOptions } from "@/lib/maintenance";
import { toastError, toastSuccess, TOAST_MSGS } from "@/lib/toast";

interface MaintenanceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maintenance?: Maintenance | null;
  vehicleId?: string | null;
  defaultDate?: Date | null;
}

export function MaintenanceFormDialog({ open, onOpenChange, maintenance, vehicleId, defaultDate }: MaintenanceFormDialogProps) {
  const vehicles = useVehiclesStore((s) => s.vehicles);
  const addMaintenance = useVehiclesStore((s) => s.addMaintenance);
  const updateMaintenance = useVehiclesStore((s) => s.updateMaintenance);

  const isEdit = Boolean(maintenance);
  const initialVehicleId = vehicleId ?? vehicles[0]?.id ?? "";

  const emptyForm = {
    vehicleId: initialVehicleId,
    date: defaultDate ? toInputDate(defaultDate) : todayInput(),
    type: "preventiva" as MaintenanceType,
    description: "",
    provider: "",
    cost: "",
    odometerKm: "",
    nextDate: "",
    nextOdometerKm: "",
    status: "programada" as MaintenanceStatus,
    notes: "",
  };

  const [form, setForm] = React.useState(emptyForm);
  const [errors, setErrors] = React.useState<Partial<Record<keyof typeof emptyForm, string>>>({});
  const [touched, setTouched] = React.useState<Partial<Record<keyof typeof emptyForm, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    if (maintenance) {
      setForm({
        vehicleId: maintenance.vehicleId,
        date: maintenance.date,
        type: maintenance.type,
        description: maintenance.description,
        provider: maintenance.provider ?? "",
        cost: maintenance.cost ? String(maintenance.cost) : "",
        odometerKm: maintenance.odometerKm ? String(maintenance.odometerKm) : "",
        nextDate: maintenance.nextDate ?? "",
        nextOdometerKm: maintenance.nextOdometerKm ? String(maintenance.nextOdometerKm) : "",
        status: maintenance.status,
        notes: maintenance.notes ?? "",
      });
    } else {
      setForm({
        ...emptyForm,
        vehicleId: vehicleId ?? initialVehicleId,
        date: defaultDate ? toInputDate(defaultDate) : todayInput(),
      });
    }
    setErrors({});
    setTouched({});
    setSubmitAttempted(false);
  }, [open, maintenance, vehicleId, defaultDate, initialVehicleId]);

  function buildValidators(): Partial<Record<keyof typeof emptyForm, () => string | null>> {
    return {
      vehicleId: () => validateRequired(form.vehicleId, "El vehículo"),
      date: () => validateDate(form.date, "La fecha"),
      type: () => validateRequired(form.type, "El tipo"),
      description: () => validateRequired(form.description, "La descripción"),
      cost: () => (form.cost ? validateNumber(form.cost, "El costo", { min: 0, required: false }) : null),
      odometerKm: () => (form.odometerKm ? validateNumber(form.odometerKm, "El kilometraje", { min: 0, required: false }) : null),
      nextOdometerKm: () => (form.nextOdometerKm ? validateNumber(form.nextOdometerKm, "El próximo kilometraje", { min: 0, required: false }) : null),
    };
  }

  function handleBlur(key: keyof typeof emptyForm) {
    setTouched((t) => ({ ...t, [key]: true }));
    const validator = buildValidators()[key];
    if (!validator) return;
    setErrors((e) => ({ ...e, [key]: validator() ?? undefined }));
  }

  React.useEffect(() => {
    const validators = buildValidators();
    setErrors((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(validators) as (keyof typeof emptyForm)[]) {
        if (touched[key] || submitAttempted) {
          next[key] = validators[key]?.() ?? undefined;
        }
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, submitAttempted]);

  function fieldError(key: keyof typeof emptyForm) {
    return touched[key] || submitAttempted ? errors[key] : undefined;
  }

  function validateAll(): boolean {
    const validators = buildValidators();
    const next = runValidators(
      Object.fromEntries(Object.entries(validators).map(([k, v]) => [k, v as () => string | null]))
    );
    setErrors(next);
    setTouched({
      vehicleId: true,
      date: true,
      type: true,
      description: true,
      cost: true,
      odometerKm: true,
      nextOdometerKm: true,
    });
    setSubmitAttempted(true);
    return Object.keys(next).length === 0;
  }

  const visibleErrors = React.useMemo(() => {
    const result: Record<string, string | undefined> = {};
    for (const key of Object.keys(errors) as (keyof typeof emptyForm)[]) {
      result[key] = touched[key] || submitAttempted ? errors[key] : undefined;
    }
    return result;
  }, [errors, touched, submitAttempted]);

  const hasVisibleErrors = Object.values(visibleErrors).some(Boolean);
  const isFormComplete = form.vehicleId && form.date && form.type && form.description;
  const showValidBadge = submitAttempted && !hasVisibleErrors && Boolean(isFormComplete);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateAll()) return;

    const payload = {
      vehicleId: form.vehicleId,
      date: form.date,
      type: form.type,
      description: form.description.trim(),
      provider: form.provider.trim() || undefined,
      cost: form.cost ? Number(form.cost) : undefined,
      odometerKm: form.odometerKm ? Number(form.odometerKm) : undefined,
      nextDate: form.nextDate || undefined,
      nextOdometerKm: form.nextOdometerKm ? Number(form.nextOdometerKm) : undefined,
      status: form.status,
      notes: form.notes.trim() || undefined,
    };

    try {
      if (isEdit && maintenance) {
        updateMaintenance(maintenance.vehicleId, maintenance.id, payload);
        toastSuccess(TOAST_MSGS.updated("Mantención"));
      } else {
        addMaintenance(form.vehicleId, payload);
        toastSuccess(TOAST_MSGS.created("Mantención"));
      }
      onOpenChange(false);
    } catch {
      toastError(TOAST_MSGS.saveError("la mantención"));
    }
  }

  const selectedVehicle = vehicles.find((v) => v.id === form.vehicleId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-2xl">
        <form onSubmit={handleSubmit} noValidate>
          <DialogHeader>
            <div className="flex items-center justify-between gap-3">
              <DialogTitle>{isEdit ? "Editar mantención" : "Nueva mantención"}</DialogTitle>
              {showValidBadge && <FormValidBadge />}
            </div>
            <DialogDescription>
              {isEdit
                ? `Actualiza los datos de la mantención`
                : selectedVehicle
                  ? `Registra una mantención para ${selectedVehicle.code}`
                  : "Completa los datos para registrar una mantención"}
            </DialogDescription>
            <FormStatusBanner errors={visibleErrors} />
          </DialogHeader>

          <DialogBody className="max-h-[65vh] overflow-y-auto scrollbar-thin">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicleId">Vehículo</Label>
                <Select
                  id="vehicleId"
                  value={form.vehicleId}
                  onChange={(e) => setForm((f) => ({ ...f, vehicleId: e.target.value }))}
                  onBlur={() => handleBlur("vehicleId")}
                  invalid={Boolean(fieldError("vehicleId"))}
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.code} — {v.plate}</option>
                  ))}
                </Select>
                {fieldError("vehicleId") && <p className="text-xs text-destructive">{fieldError("vehicleId")}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  onBlur={() => handleBlur("date")}
                  invalid={Boolean(fieldError("date"))}
                  valid={(touched.date || submitAttempted) && !errors.date && Boolean(form.date)}
                  required
                />
                {fieldError("date") && <p className="text-xs text-destructive">{fieldError("date")}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select
                  id="type"
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as MaintenanceType }))}
                  onBlur={() => handleBlur("type")}
                  invalid={Boolean(fieldError("type"))}
                >
                  {maintenanceTypeOptions.map((t) => (
                    <option key={t} value={t}>{maintenanceTypeLabel[t]}</option>
                  ))}
                </Select>
                {fieldError("type") && <p className="text-xs text-destructive">{fieldError("type")}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select
                  id="status"
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as MaintenanceStatus }))}
                >
                  {maintenanceStatusOptions.map((s) => (
                    <option key={s} value={s}>{maintenanceStatusLabel[s]}</option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder="Describe el trabajo a realizar..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                onBlur={() => handleBlur("description")}
                invalid={Boolean(fieldError("description"))}
                required
              />
              {fieldError("description") && <p className="text-xs text-destructive">{fieldError("description")}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="provider">Taller / Proveedor</Label>
                <Input
                  id="provider"
                  placeholder="Ej: Taller Norte"
                  value={form.provider}
                  onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Costo</Label>
                <NumberInput
                  id="cost"
                  value={form.cost}
                  onChange={(v) => setForm((f) => ({ ...f, cost: v }))}
                  onBlur={() => handleBlur("cost")}
                  min={0}
                  step={1000}
                  suffix="$"
                  invalid={Boolean(fieldError("cost"))}
                />
                {fieldError("cost") && <p className="text-xs text-destructive">{fieldError("cost")}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="odometerKm">Kilometraje actual</Label>
                <NumberInput
                  id="odometerKm"
                  value={form.odometerKm}
                  onChange={(v) => setForm((f) => ({ ...f, odometerKm: v }))}
                  onBlur={() => handleBlur("odometerKm")}
                  min={0}
                  step={100}
                  suffix="km"
                  invalid={Boolean(fieldError("odometerKm"))}
                />
                {fieldError("odometerKm") && <p className="text-xs text-destructive">{fieldError("odometerKm")}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="nextOdometerKm">Próximo kilometraje</Label>
                <NumberInput
                  id="nextOdometerKm"
                  value={form.nextOdometerKm}
                  onChange={(v) => setForm((f) => ({ ...f, nextOdometerKm: v }))}
                  onBlur={() => handleBlur("nextOdometerKm")}
                  min={0}
                  step={100}
                  suffix="km"
                  invalid={Boolean(fieldError("nextOdometerKm"))}
                />
                {fieldError("nextOdometerKm") && <p className="text-xs text-destructive">{fieldError("nextOdometerKm")}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nextDate">Próxima fecha de mantención</Label>
              <Input
                id="nextDate"
                type="date"
                value={form.nextDate}
                onChange={(e) => setForm((f) => ({ ...f, nextDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas adicionales</Label>
              <Textarea
                id="notes"
                placeholder="Observaciones, repuestos, etc."
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-[#ff0066] hover:bg-[#ff0066]/90">
              {isEdit ? "Guardar cambios" : "Crear mantención"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function todayInput() {
  return toInputDate(new Date());
}

function toInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
