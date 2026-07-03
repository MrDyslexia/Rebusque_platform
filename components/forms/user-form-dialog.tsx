"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormStatusBanner, FormValidBadge } from "@/components/ui/form-status-banner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RutInput } from "@/components/ui/rut-input";
import { Select } from "@/components/ui/select";
import { useUsersStore } from "@/store/users";
import { useVehiclesStore } from "@/store/vehicles";
import { branches } from "@/data";
import { Role, User } from "@/types";
import { formatRut } from "@/lib/rut";
import { toastError, toastSuccess, TOAST_MSGS } from "@/lib/toast";
import { runValidators, validateClPhone, validateEmail, validateRequired, validateRut } from "@/lib/validators";

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
}

const emptyForm = {
  rut: "",
  name: "",
  email: "",
  phone: "",
  role: "secretary" as Role,
  branchId: branches[0]?.id ?? "",
  shiftStart: "08:00",
  shiftEnd: "18:00",
  vehicleId: "",
};

type FormState = typeof emptyForm;
type FieldErrors = Partial<Record<keyof FormState, string>>;

export function UserFormDialog({ open, onOpenChange, user }: UserFormDialogProps) {
  const addUser = useUsersStore((s) => s.addUser);
  const updateUser = useUsersStore((s) => s.updateUser);
  const vehicles = useVehiclesStore((s) => s.vehicles);
  const isEdit = Boolean(user);

  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [touched, setTouched] = React.useState<Partial<Record<keyof FormState, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    if (user) {
      setForm({
        rut: user.rut,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        branchId: user.branchId ?? branches[0]?.id ?? "",
        shiftStart: user.shift?.start ?? "08:00",
        shiftEnd: user.shift?.end ?? "18:00",
        vehicleId: user.vehicleId ?? "",
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
    setTouched({});
    setSubmitAttempted(false);
  }, [open, user]);

  const needsBranchAndShift = form.role === "driver" || form.role === "secretary";
  const needsVehicle = form.role === "driver";

  function buildValidators() {
    return {
      rut: () => validateRut(form.rut),
      name: () => validateRequired(form.name, "El nombre"),
      email: () => validateEmail(form.email),
      phone: () => validateClPhone(form.phone),
      branchId: () => (needsBranchAndShift && !form.branchId ? "La sucursal es obligatoria para este rol" : null),
      vehicleId: () => (needsVehicle && !form.vehicleId ? "El vehículo es obligatorio para conductores" : null),
    };
  }

  function handleBlur(key: keyof FormState) {
    setTouched((t) => ({ ...t, [key]: true }));
    const validators = buildValidators();
    const validator = validators[key as keyof typeof validators];
    if (!validator) return;
    setErrors((e) => ({ ...e, [key]: validator() ?? undefined }));
  }

  // Revalida en vivo los campos ya tocados (o tras intentar enviar) para que el
  // banner del header y los íconos de los inputs se actualicen mientras se corrige.
  React.useEffect(() => {
    const validators = buildValidators();
    setErrors((prev) => {
      const next = { ...prev };
      (Object.keys(validators) as (keyof typeof validators)[]).forEach((key) => {
        if (touched[key as keyof FormState] || submitAttempted) {
          next[key as keyof FormState] = validators[key]() ?? undefined;
        }
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, submitAttempted]);

  function fieldError(key: keyof FormState) {
    return touched[key] || submitAttempted ? errors[key] : undefined;
  }

  function validateAll(): boolean {
    const next = runValidators(buildValidators());
    setErrors(next);
    setTouched({ rut: true, name: true, email: true, phone: true, branchId: true, vehicleId: true });
    setSubmitAttempted(true);
    return Object.keys(next).length === 0;
  }

  // Errores visibles en el banner: solo los de campos tocados o tras intentar enviar.
  const visibleErrors = React.useMemo(() => {
    const result: Record<string, string | undefined> = {};
    for (const key of Object.keys(errors) as (keyof FormState)[]) {
      result[key] = touched[key] || submitAttempted ? errors[key] : undefined;
    }
    return result;
  }, [errors, touched, submitAttempted]);

  const hasVisibleErrors = Object.values(visibleErrors).some(Boolean);
  const isFormComplete = form.rut && form.name && form.email && form.phone;
  const showValidBadge = submitAttempted && !hasVisibleErrors && Boolean(isFormComplete);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateAll()) return;

    const payload = {
      rut: formatRut(form.rut),
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      role: form.role,
      branchId: needsBranchAndShift ? form.branchId : undefined,
      shift: needsBranchAndShift ? { start: form.shiftStart, end: form.shiftEnd, days: [1, 2, 3, 4, 5] } : undefined,
      vehicleId: needsVehicle ? form.vehicleId : undefined,
    };

    try {
      if (isEdit && user) {
        updateUser(user.id, payload);
        toastSuccess(TOAST_MSGS.updated("Usuario"));
      } else {
        addUser(payload);
        toastSuccess(TOAST_MSGS.created("Usuario"));
      }
      onOpenChange(false);
    } catch {
      toastError(TOAST_MSGS.saveError("el usuario"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <form onSubmit={handleSubmit} noValidate>
          <DialogHeader>
            <div className="flex items-center justify-between gap-3">
              <DialogTitle>{isEdit ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
              {showValidBadge && <FormValidBadge />}
            </div>
            <DialogDescription>
              {isEdit ? `Actualiza los datos de ${user?.name}` : "Completa los datos para crear un usuario del sistema"}
            </DialogDescription>
            <FormStatusBanner errors={visibleErrors} />
          </DialogHeader>

          <DialogBody className="max-h-[65vh] overflow-y-auto scrollbar-thin">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rut">RUT</Label>
                <RutInput
                  id="rut"
                  placeholder="12.345.678-9"
                  value={form.rut}
                  invalid={Boolean(fieldError("rut")) && form.rut.trim() === "" ? true : undefined}
                  onChange={(value) => setForm((f) => ({ ...f, rut: value }))}
                  onBlur={() => handleBlur("rut")}
                  required
                />
                {fieldError("rut") && <p className="text-xs text-destructive">{fieldError("rut")}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <Select id="role" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}>
                  <option value="admin">Administrador</option>
                  <option value="secretary">Secretaria</option>
                  <option value="driver">Conductor</option>
                  <option value="client">Cliente</option>
                  <option value="api">API</option>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                value={form.name}
                invalid={Boolean(fieldError("name"))}
                valid={touched.name && !errors.name && form.name.trim().length > 0}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                onBlur={() => handleBlur("name")}
                required
              />
              {fieldError("name") && <p className="text-xs text-destructive">{fieldError("name")}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  invalid={Boolean(fieldError("email"))}
                  valid={touched.email && !errors.email && form.email.trim().length > 0}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  onBlur={() => handleBlur("email")}
                  required
                />
                {fieldError("email") && <p className="text-xs text-destructive">{fieldError("email")}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  placeholder="+56912345678"
                  value={form.phone}
                  invalid={Boolean(fieldError("phone"))}
                  valid={touched.phone && !errors.phone && form.phone.trim().length > 0}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  onBlur={() => handleBlur("phone")}
                  required
                />
                {fieldError("phone") && <p className="text-xs text-destructive">{fieldError("phone")}</p>}
              </div>
            </div>

            {needsBranchAndShift && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="branch">Sucursal</Label>
                  <Select
                    id="branch"
                    value={form.branchId}
                    invalid={Boolean(fieldError("branchId"))}
                    onChange={(e) => setForm((f) => ({ ...f, branchId: e.target.value }))}
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </Select>
                  {fieldError("branchId") && <p className="text-xs text-destructive">{fieldError("branchId")}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="shiftStart">Inicio de turno</Label>
                    <Input id="shiftStart" type="time" value={form.shiftStart} onChange={(e) => setForm((f) => ({ ...f, shiftStart: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shiftEnd">Fin de turno</Label>
                    <Input id="shiftEnd" type="time" value={form.shiftEnd} onChange={(e) => setForm((f) => ({ ...f, shiftEnd: e.target.value }))} />
                  </div>
                </div>
              </>
            )}

            {needsVehicle && (
              <div className="space-y-2">
                <Label htmlFor="vehicle">Vehículo asignado</Label>
                <Select
                  id="vehicle"
                  value={form.vehicleId}
                  invalid={Boolean(fieldError("vehicleId"))}
                  onChange={(e) => setForm((f) => ({ ...f, vehicleId: e.target.value }))}
                >
                  <option value="">Selecciona un vehículo</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.code} — {v.plate}</option>
                  ))}
                </Select>
                {fieldError("vehicleId") && <p className="text-xs text-destructive">{fieldError("vehicleId")}</p>}
              </div>
            )}
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-[#ff0066] hover:bg-[#ff0066]/90">
              {isEdit ? "Guardar cambios" : "Crear usuario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
