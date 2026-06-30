"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormStatusBanner, FormValidBadge } from "@/components/ui/form-status-banner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import { Select } from "@/components/ui/select";
import { useVehiclesStore } from "@/store/vehicles";
import { branches, users } from "@/data";
import { Vehicle, VehicleStatus, VehicleType } from "@/types";
import { runValidators, validateNumber, validatePlate } from "@/lib/validators";

interface VehicleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle?: Vehicle | null;
}

const emptyForm = {
  plate: "",
  branchId: branches[0]?.id ?? "",
  type: "furgon" as VehicleType,
  status: "disponible" as VehicleStatus,
  weightKg: "",
  volumeM3: "",
  maxPackages: "",
  currentDriverId: "",
};

type FormState = typeof emptyForm;
type FieldErrors = Partial<Record<keyof FormState, string>>;

export function VehicleFormDialog({ open, onOpenChange, vehicle }: VehicleFormDialogProps) {
  const addVehicle = useVehiclesStore((s) => s.addVehicle);
  const updateVehicle = useVehiclesStore((s) => s.updateVehicle);
  const isEdit = Boolean(vehicle);

  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [touched, setTouched] = React.useState<Partial<Record<keyof FormState, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    if (vehicle) {
      setForm({
        plate: vehicle.plate,
        branchId: vehicle.branchId,
        type: vehicle.type,
        status: vehicle.status,
        weightKg: String(vehicle.capacity.weightKg),
        volumeM3: String(vehicle.capacity.volumeM3),
        maxPackages: vehicle.capacity.maxPackages ? String(vehicle.capacity.maxPackages) : "",
        currentDriverId: vehicle.currentDriverId ?? "",
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
    setTouched({});
    setSubmitAttempted(false);
  }, [open, vehicle]);

  const drivers = users.filter((u) => u.role === "driver");

  function buildValidators(): Partial<Record<keyof FormState, () => string | null>> {
    return {
      plate: () => validatePlate(form.plate),
      weightKg: () => validateNumber(form.weightKg, "El peso máximo", { min: 0.1 }),
      volumeM3: () => validateNumber(form.volumeM3, "El volumen", { min: 0.01 }),
      maxPackages: () => (form.maxPackages ? validateNumber(form.maxPackages, "Los bultos máximos", { min: 1 }) : null),
    };
  }

  function handleBlur(key: keyof FormState) {
    setTouched((t) => ({ ...t, [key]: true }));
    const validator = buildValidators()[key];
    if (!validator) return;
    setErrors((e) => ({ ...e, [key]: validator() ?? undefined }));
  }

  React.useEffect(() => {
    const validators = buildValidators();
    setErrors((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(validators) as (keyof FormState)[]) {
        if (touched[key] || submitAttempted) {
          next[key] = validators[key]?.() ?? undefined;
        }
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, submitAttempted]);

  function fieldError(key: keyof FormState) {
    return touched[key] || submitAttempted ? errors[key] : undefined;
  }

  function validateAll(): boolean {
    const next = runValidators(
      Object.fromEntries(Object.entries(buildValidators()).map(([k, v]) => [k, v as () => string | null])),
    );
    setErrors(next);
    setTouched({ plate: true, weightKg: true, volumeM3: true, maxPackages: true });
    setSubmitAttempted(true);
    return Object.keys(next).length === 0;
  }

  const visibleErrors = React.useMemo(() => {
    const result: Record<string, string | undefined> = {};
    for (const key of Object.keys(errors) as (keyof FormState)[]) {
      result[key] = touched[key] || submitAttempted ? errors[key] : undefined;
    }
    return result;
  }, [errors, touched, submitAttempted]);

  const hasVisibleErrors = Object.values(visibleErrors).some(Boolean);
  const isFormComplete = form.plate && form.weightKg && form.volumeM3;
  const showValidBadge = submitAttempted && !hasVisibleErrors && Boolean(isFormComplete);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateAll()) return;

    const payload = {
      plate: form.plate.trim().toUpperCase(),
      branchId: form.branchId,
      type: form.type,
      status: form.status,
      capacity: {
        weightKg: Number(form.weightKg),
        volumeM3: Number(form.volumeM3),
        maxPackages: form.maxPackages ? Number(form.maxPackages) : undefined,
      },
      currentDriverId: form.currentDriverId || null,
    };

    if (isEdit && vehicle) {
      updateVehicle(vehicle.id, payload);
    } else {
      addVehicle(payload as never);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <form onSubmit={handleSubmit} noValidate>
          <DialogHeader>
            <div className="flex items-center justify-between gap-3">
              <DialogTitle>{isEdit ? "Editar vehículo" : "Nuevo vehículo"}</DialogTitle>
              {showValidBadge && <FormValidBadge />}
            </div>
            <DialogDescription>
              {isEdit ? `Actualiza los datos de ${vehicle?.code}` : "Completa los datos para registrar un vehículo en la flota"}
            </DialogDescription>
            <FormStatusBanner errors={visibleErrors} />
          </DialogHeader>

          <DialogBody className="max-h-[65vh] overflow-y-auto scrollbar-thin">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plate">Patente</Label>
                <Input
                  id="plate"
                  placeholder="AB-CD-12"
                  value={form.plate}
                  invalid={Boolean(fieldError("plate"))}
                  valid={(touched.plate || submitAttempted) && !errors.plate && form.plate.trim().length > 0}
                  onChange={(e) => setForm((f) => ({ ...f, plate: e.target.value }))}
                  onBlur={() => handleBlur("plate")}
                  required
                />
                {fieldError("plate") && <p className="text-xs text-destructive">{fieldError("plate")}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select id="type" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as VehicleType }))}>
                  <option value="moto">Moto</option>
                  <option value="furgon">Furgón</option>
                  <option value="camion">Camión</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="branch">Sucursal</Label>
                <Select id="branch" value={form.branchId} onChange={(e) => setForm((f) => ({ ...f, branchId: e.target.value }))}>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select id="status" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as VehicleStatus }))}>
                  <option value="disponible">Disponible</option>
                  <option value="en_ruta">En ruta</option>
                  <option value="mantenimiento">Mantenimiento</option>
                  <option value="fuera_de_servicio">Fuera de servicio</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Peso máx.</Label>
                <NumberInput
                  id="weight"
                  value={form.weightKg}
                  onChange={(v) => setForm((f) => ({ ...f, weightKg: v }))}
                  onBlur={() => handleBlur("weightKg")}
                  min={0}
                  step={50}
                  suffix="kg"
                  invalid={Boolean(fieldError("weightKg"))}
                  valid={(touched.weightKg || submitAttempted) && !errors.weightKg && form.weightKg.trim().length > 0}
                />
                {fieldError("weightKg") && <p className="text-xs text-destructive">{fieldError("weightKg")}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="volume">Volumen</Label>
                <NumberInput
                  id="volume"
                  value={form.volumeM3}
                  onChange={(v) => setForm((f) => ({ ...f, volumeM3: v }))}
                  onBlur={() => handleBlur("volumeM3")}
                  min={0}
                  step={0.5}
                  suffix="m³"
                  invalid={Boolean(fieldError("volumeM3"))}
                  valid={(touched.volumeM3 || submitAttempted) && !errors.volumeM3 && form.volumeM3.trim().length > 0}
                />
                {fieldError("volumeM3") && <p className="text-xs text-destructive">{fieldError("volumeM3")}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxPackages">Bultos máx.</Label>
                <NumberInput
                  id="maxPackages"
                  value={form.maxPackages}
                  onChange={(v) => setForm((f) => ({ ...f, maxPackages: v }))}
                  onBlur={() => handleBlur("maxPackages")}
                  min={0}
                  step={5}
                  invalid={Boolean(fieldError("maxPackages"))}
                />
                {fieldError("maxPackages") && <p className="text-xs text-destructive">{fieldError("maxPackages")}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="driver">Conductor asignado</Label>
              <Select id="driver" value={form.currentDriverId} onChange={(e) => setForm((f) => ({ ...f, currentDriverId: e.target.value }))}>
                <option value="">Sin asignar</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </Select>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-[#ff0066] hover:bg-[#ff0066]/90">
              {isEdit ? "Guardar cambios" : "Crear vehículo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
