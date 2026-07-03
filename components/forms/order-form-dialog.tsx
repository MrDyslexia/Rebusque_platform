"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormStatusBanner, FormValidBadge } from "@/components/ui/form-status-banner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import { RutInput } from "@/components/ui/rut-input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useOrdersStore } from "@/store/orders";
import { branches } from "@/data";
import { Order, OrderStatus, OrderType, ServiceType } from "@/types";
import { formatRut } from "@/lib/rut";
import { toastError, toastSuccess, TOAST_MSGS } from "@/lib/toast";
import {
  runValidators,
  validateClPhone,
  validateNumber,
  validateRequired,
  validateRut,
} from "@/lib/validators";

interface OrderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: Order | null;
}

const orderStatuses: OrderStatus[] = [
  "INGRESADO",
  "ALMACENADO",
  "ASIGNADO_A_RUTA",
  "EN_RUTA",
  "ENTREGADO",
  "ENTREGA_FALLIDA",
  "REINTENTO_1",
  "REINTENTO_2",
  "DEVUELTO_A_ORIGEN",
  "CANCELADO",
  "PERDIDO",
  "EN_CUSTODIA",
];

const emptyForm = {
  serviceType: "estandar" as ServiceType,
  type: "propio" as OrderType,
  externalReference: "",
  status: "INGRESADO" as OrderStatus,
  lengthCm: "",
  widthCm: "",
  heightCm: "",
  weightKg: "",
  description: "",
  fragile: false,
  declaredValue: "",
  insuranceCovered: false,
  insuranceAmount: "",
  originBranchId: branches[0]?.id ?? "",
  recipientName: "",
  recipientRut: "",
  recipientPhone: "",
  address: "",
  instructions: "",
  senderName: "",
  senderRut: "",
  senderPhone: "",
};

type FormState = typeof emptyForm;
type FieldErrors = Partial<Record<keyof FormState, string>>;

export function OrderFormDialog({ open, onOpenChange, order }: OrderFormDialogProps) {
  const addOrder = useOrdersStore((s) => s.addOrder);
  const updateOrder = useOrdersStore((s) => s.updateOrder);
  const isEdit = Boolean(order);

  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [touched, setTouched] = React.useState<Partial<Record<keyof FormState, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    if (order) {
      setForm({
        serviceType: order.serviceType,
        type: order.type,
        externalReference: order.externalReference ?? "",
        status: order.status,
        lengthCm: String(order.dimensions.lengthCm),
        widthCm: String(order.dimensions.widthCm),
        heightCm: String(order.dimensions.heightCm),
        weightKg: String(order.dimensions.weightKg),
        description: order.content.description,
        fragile: order.content.fragile,
        declaredValue: order.content.declaredValue ? String(order.content.declaredValue) : "",
        insuranceCovered: order.insurance.covered,
        insuranceAmount: order.insurance.amount ? String(order.insurance.amount) : "",
        originBranchId: order.origin.branchId,
        recipientName: order.destination.recipientName,
        recipientRut: order.destination.recipientRut ?? "",
        recipientPhone: order.destination.recipientPhone,
        address: order.destination.address,
        instructions: order.destination.instructions ?? "",
        senderName: order.sender.name,
        senderRut: order.sender.rut ?? "",
        senderPhone: order.sender.phone ?? "",
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
    setTouched({});
    setSubmitAttempted(false);
  }, [open, order]);

  function buildValidators(): Partial<Record<keyof FormState, () => string | null>> {
    return {
      externalReference: () =>
        form.type !== "propio" && !form.externalReference.trim()
          ? "La referencia externa es obligatoria para encomiendas de terceros"
          : null,
      lengthCm: () => validateNumber(form.lengthCm, "El largo", { min: 1 }),
      widthCm: () => validateNumber(form.widthCm, "El ancho", { min: 1 }),
      heightCm: () => validateNumber(form.heightCm, "El alto", { min: 1 }),
      weightKg: () => validateNumber(form.weightKg, "El peso", { min: 0.1 }),
      description: () => validateRequired(form.description, "La descripción del contenido"),
      declaredValue: () => (form.declaredValue ? validateNumber(form.declaredValue, "El valor declarado", { min: 0 }) : null),
      insuranceAmount: () =>
        form.insuranceCovered ? validateNumber(form.insuranceAmount, "El monto asegurado", { min: 1 }) : null,
      recipientName: () => validateRequired(form.recipientName, "El nombre del destinatario"),
      recipientRut: () => (form.recipientRut ? validateRut(form.recipientRut) : null),
      recipientPhone: () => validateClPhone(form.recipientPhone),
      address: () => validateRequired(form.address, "La dirección de destino"),
      senderName: () => validateRequired(form.senderName, "El nombre del remitente"),
      senderRut: () => (form.senderRut ? validateRut(form.senderRut, false) : null),
      senderPhone: () => (form.senderPhone ? validateClPhone(form.senderPhone, false) : null),
    };
  }

  function handleBlur(key: keyof FormState) {
    setTouched((t) => ({ ...t, [key]: true }));
    const validators = buildValidators();
    const validator = validators[key];
    if (!validator) return;
    setErrors((e) => ({ ...e, [key]: validator() ?? undefined }));
  }

  // Revalida en vivo los campos ya tocados (o tras intentar enviar) para que el
  // banner del header y los íconos de los inputs se actualicen mientras se corrige.
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
      Object.fromEntries(
        Object.entries(buildValidators()).map(([key, validator]) => [key, validator as () => string | null]),
      ),
    );
    setErrors(next);
    setTouched((t) => {
      const allTouched: Partial<Record<keyof FormState, boolean>> = { ...t };
      for (const key of Object.keys(buildValidators())) {
        allTouched[key as keyof FormState] = true;
      }
      return allTouched;
    });
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
  const isFormComplete =
    form.description && form.recipientName && form.recipientPhone && form.address && form.senderName;
  const showValidBadge = submitAttempted && !hasVisibleErrors && Boolean(isFormComplete);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateAll()) return;

    const length = Number(form.lengthCm);
    const width = Number(form.widthCm);
    const height = Number(form.heightCm);
    const weight = Number(form.weightKg);
    const volumetricWeight = Number(((length * width * height) / 5000).toFixed(2));
    const insuranceAmount = form.insuranceCovered ? Number(form.insuranceAmount) : undefined;
    const branch = branches.find((b) => b.id === form.originBranchId);

    const basePayload = {
      status: form.status,
      serviceType: form.serviceType,
      type: form.type,
      externalReference: form.type !== "propio" ? form.externalReference.trim() : undefined,
      dimensions: { lengthCm: length, widthCm: width, heightCm: height, weightKg: weight, volumetricWeight },
      content: {
        description: form.description.trim(),
        fragile: form.fragile,
        declaredValue: form.declaredValue ? Number(form.declaredValue) : undefined,
      },
      insurance: {
        covered: form.insuranceCovered,
        amount: insuranceAmount,
        premium: insuranceAmount ? Number((insuranceAmount * 0.01).toFixed(0)) : undefined,
      },
      origin: { branchId: form.originBranchId, address: branch?.address ?? "" },
      destination: {
        recipientName: form.recipientName.trim(),
        recipientRut: form.recipientRut ? formatRut(form.recipientRut) : undefined,
        recipientPhone: form.recipientPhone.trim(),
        address: form.address.trim(),
        instructions: form.instructions.trim() || undefined,
      },
      sender: {
        name: form.senderName.trim(),
        rut: form.senderRut ? formatRut(form.senderRut) : undefined,
        phone: form.senderPhone.trim() || undefined,
      },
      billing: order?.billing ?? { status: "pendiente" as const, amount: 0, tax: 0, total: 0 },
    };

    try {
      if (isEdit && order) {
        updateOrder(order.id, basePayload);
        toastSuccess(TOAST_MSGS.updated("Encomienda"));
      } else {
        addOrder(basePayload);
        toastSuccess(TOAST_MSGS.created("Encomienda"));
      }
      onOpenChange(false);
    } catch {
      toastError(TOAST_MSGS.saveError("la encomienda"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" onClose={() => onOpenChange(false)}>
        <form onSubmit={handleSubmit} noValidate>
          <DialogHeader>
            <div className="flex items-center justify-between gap-3">
              <DialogTitle>{isEdit ? `Editar ${order?.trackingNumber}` : "Nueva encomienda"}</DialogTitle>
              {showValidBadge && <FormValidBadge />}
            </div>
            <DialogDescription>
              {isEdit ? "Actualiza los datos de la encomienda" : "Registra una nueva orden de despacho o retiro"}
            </DialogDescription>
            <FormStatusBanner errors={visibleErrors} />
          </DialogHeader>

          <DialogBody className="max-h-[60vh] overflow-y-auto scrollbar-thin">
            <div className="space-y-3 rounded-lg border p-4">
              <h3 className="text-sm font-semibold text-muted-foreground">Servicio</h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="serviceType">Tipo de servicio</Label>
                  <Select id="serviceType" value={form.serviceType} onChange={(e) => setForm((f) => ({ ...f, serviceType: e.target.value as ServiceType }))}>
                    <option value="estandar">Estándar</option>
                    <option value="express">Express</option>
                    <option value="mismo_dia">Mismo día</option>
                    <option value="programado">Programado</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Origen de la orden</Label>
                  <Select id="type" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as OrderType }))}>
                    <option value="propio">Propio</option>
                    <option value="chilexpress">Chilexpress</option>
                    <option value="starken">Starken</option>
                    <option value="mercado_libre">Mercado Libre</option>
                  </Select>
                </div>
                {isEdit && (
                  <div className="space-y-2">
                    <Label htmlFor="status">Estado</Label>
                    <Select id="status" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as OrderStatus }))}>
                      {orderStatuses.map((s) => (
                        <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                      ))}
                    </Select>
                  </div>
                )}
              </div>
              {form.type !== "propio" && (
                <div className="space-y-2">
                  <Label htmlFor="externalReference">Referencia externa</Label>
                  <Input
                    id="externalReference"
                    placeholder="CHX-998877"
                    value={form.externalReference}
                    invalid={Boolean(fieldError("externalReference"))}
                    onChange={(e) => setForm((f) => ({ ...f, externalReference: e.target.value }))}
                    onBlur={() => handleBlur("externalReference")}
                  />
                  {fieldError("externalReference") && <p className="text-xs text-destructive">{fieldError("externalReference")}</p>}
                </div>
              )}
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <h3 className="text-sm font-semibold text-muted-foreground">Paquete</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="lengthCm">Largo</Label>
                  <NumberInput
                    id="lengthCm"
                    value={form.lengthCm}
                    onChange={(v) => setForm((f) => ({ ...f, lengthCm: v }))}
                    onBlur={() => handleBlur("lengthCm")}
                    min={0}
                    step={1}
                    suffix="cm"
                    invalid={Boolean(fieldError("lengthCm"))}
                  />
                  {fieldError("lengthCm") && <p className="text-xs text-destructive">{fieldError("lengthCm")}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="widthCm">Ancho</Label>
                  <NumberInput
                    id="widthCm"
                    value={form.widthCm}
                    onChange={(v) => setForm((f) => ({ ...f, widthCm: v }))}
                    onBlur={() => handleBlur("widthCm")}
                    min={0}
                    step={1}
                    suffix="cm"
                    invalid={Boolean(fieldError("widthCm"))}
                  />
                  {fieldError("widthCm") && <p className="text-xs text-destructive">{fieldError("widthCm")}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="heightCm">Alto</Label>
                  <NumberInput
                    id="heightCm"
                    value={form.heightCm}
                    onChange={(v) => setForm((f) => ({ ...f, heightCm: v }))}
                    onBlur={() => handleBlur("heightCm")}
                    min={0}
                    step={1}
                    suffix="cm"
                    invalid={Boolean(fieldError("heightCm"))}
                  />
                  {fieldError("heightCm") && <p className="text-xs text-destructive">{fieldError("heightCm")}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weightKg">Peso</Label>
                  <NumberInput
                    id="weightKg"
                    value={form.weightKg}
                    onChange={(v) => setForm((f) => ({ ...f, weightKg: v }))}
                    onBlur={() => handleBlur("weightKg")}
                    min={0}
                    step={0.5}
                    suffix="kg"
                    invalid={Boolean(fieldError("weightKg"))}
                  />
                  {fieldError("weightKg") && <p className="text-xs text-destructive">{fieldError("weightKg")}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción del contenido</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  invalid={Boolean(fieldError("description"))}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  onBlur={() => handleBlur("description")}
                />
                {(touched.description || submitAttempted) && !errors.description && form.description.trim().length > 0 && (
                  <p className="flex items-center gap-1 text-xs text-emerald-500">Descripción válida</p>
                )}
                {fieldError("description") && <p className="text-xs text-destructive">{fieldError("description")}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="declaredValue">Valor declarado</Label>
                  <NumberInput
                    id="declaredValue"
                    value={form.declaredValue}
                    onChange={(v) => setForm((f) => ({ ...f, declaredValue: v }))}
                    onBlur={() => handleBlur("declaredValue")}
                    min={0}
                    step={1000}
                    suffix="CLP"
                    invalid={Boolean(fieldError("declaredValue"))}
                  />
                  {fieldError("declaredValue") && <p className="text-xs text-destructive">{fieldError("declaredValue")}</p>}
                </div>
                <label className="flex items-center gap-2 self-end pb-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-input accent-[#ff0066]"
                    checked={form.fragile}
                    onChange={(e) => setForm((f) => ({ ...f, fragile: e.target.checked }))}
                  />
                  Contenido frágil
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2 self-end pb-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-input accent-[#ff0066]"
                    checked={form.insuranceCovered}
                    onChange={(e) => setForm((f) => ({ ...f, insuranceCovered: e.target.checked }))}
                  />
                  Con seguro
                </label>
                {form.insuranceCovered && (
                  <div className="space-y-2">
                    <Label htmlFor="insuranceAmount">Monto asegurado</Label>
                    <NumberInput
                      id="insuranceAmount"
                      value={form.insuranceAmount}
                      onChange={(v) => setForm((f) => ({ ...f, insuranceAmount: v }))}
                      onBlur={() => handleBlur("insuranceAmount")}
                      min={0}
                      step={1000}
                      suffix="CLP"
                      invalid={Boolean(fieldError("insuranceAmount"))}
                    />
                    {fieldError("insuranceAmount") && <p className="text-xs text-destructive">{fieldError("insuranceAmount")}</p>}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <h3 className="text-sm font-semibold text-muted-foreground">Origen y destino</h3>
              <div className="space-y-2">
                <Label htmlFor="originBranch">Sucursal de origen</Label>
                <Select id="originBranch" value={form.originBranchId} onChange={(e) => setForm((f) => ({ ...f, originBranchId: e.target.value }))}>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recipientName">Destinatario</Label>
                  <Input
                    id="recipientName"
                    value={form.recipientName}
                    invalid={Boolean(fieldError("recipientName"))}
                    valid={(touched.recipientName || submitAttempted) && !errors.recipientName && form.recipientName.trim().length > 0}
                    onChange={(e) => setForm((f) => ({ ...f, recipientName: e.target.value }))}
                    onBlur={() => handleBlur("recipientName")}
                  />
                  {fieldError("recipientName") && <p className="text-xs text-destructive">{fieldError("recipientName")}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipientRut">RUT destinatario (opcional)</Label>
                  <RutInput
                    id="recipientRut"
                    placeholder="12.345.678-9"
                    value={form.recipientRut}
                    required={false}
                    onChange={(value) => setForm((f) => ({ ...f, recipientRut: value }))}
                    onBlur={() => handleBlur("recipientRut")}
                  />
                  {fieldError("recipientRut") && <p className="text-xs text-destructive">{fieldError("recipientRut")}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recipientPhone">Teléfono destinatario</Label>
                  <Input
                    id="recipientPhone"
                    placeholder="+56912345678"
                    value={form.recipientPhone}
                    invalid={Boolean(fieldError("recipientPhone"))}
                    valid={(touched.recipientPhone || submitAttempted) && !errors.recipientPhone && form.recipientPhone.trim().length > 0}
                    onChange={(e) => setForm((f) => ({ ...f, recipientPhone: e.target.value }))}
                    onBlur={() => handleBlur("recipientPhone")}
                  />
                  {fieldError("recipientPhone") && <p className="text-xs text-destructive">{fieldError("recipientPhone")}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Dirección de destino</Label>
                  <Input
                    id="address"
                    value={form.address}
                    invalid={Boolean(fieldError("address"))}
                    valid={(touched.address || submitAttempted) && !errors.address && form.address.trim().length > 0}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    onBlur={() => handleBlur("address")}
                  />
                  {fieldError("address") && <p className="text-xs text-destructive">{fieldError("address")}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">Instrucciones de entrega (opcional)</Label>
                <Textarea id="instructions" value={form.instructions} onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <h3 className="text-sm font-semibold text-muted-foreground">Remitente</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="senderName">Nombre</Label>
                  <Input
                    id="senderName"
                    value={form.senderName}
                    invalid={Boolean(fieldError("senderName"))}
                    valid={(touched.senderName || submitAttempted) && !errors.senderName && form.senderName.trim().length > 0}
                    onChange={(e) => setForm((f) => ({ ...f, senderName: e.target.value }))}
                    onBlur={() => handleBlur("senderName")}
                  />
                  {fieldError("senderName") && <p className="text-xs text-destructive">{fieldError("senderName")}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senderRut">RUT (opcional)</Label>
                  <RutInput
                    id="senderRut"
                    placeholder="76.543.210-K"
                    value={form.senderRut}
                    required={false}
                    onChange={(value) => setForm((f) => ({ ...f, senderRut: value }))}
                    onBlur={() => handleBlur("senderRut")}
                  />
                  {fieldError("senderRut") && <p className="text-xs text-destructive">{fieldError("senderRut")}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senderPhone">Teléfono (opcional)</Label>
                  <Input
                    id="senderPhone"
                    placeholder="+56987654321"
                    value={form.senderPhone}
                    invalid={Boolean(fieldError("senderPhone"))}
                    onChange={(e) => setForm((f) => ({ ...f, senderPhone: e.target.value }))}
                    onBlur={() => handleBlur("senderPhone")}
                  />
                  {fieldError("senderPhone") && <p className="text-xs text-destructive">{fieldError("senderPhone")}</p>}
                </div>
              </div>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-[#ff0066] hover:bg-[#ff0066]/90">
              {isEdit ? "Guardar cambios" : "Crear encomienda"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
