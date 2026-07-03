"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MaintenanceStatusBadge } from "./maintenance-status-badge";
import { Maintenance, Vehicle } from "@/types";
import { formatDate } from "@/lib/format";
import { maintenanceTypeLabel, maintenanceUrgency } from "@/lib/maintenance";
import { cn } from "@/lib/utils";

interface MaintenanceCalendarProps {
  maintenances: Maintenance[];
  vehicles: Vehicle[];
  onSelectMaintenance?: (maintenance: Maintenance) => void;
  onNewMaintenance?: (date?: Date) => void;
}

const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function MaintenanceCalendar({
  maintenances,
  vehicles,
  onSelectMaintenance,
  onNewMaintenance,
}: MaintenanceCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const maintenancesByDay = useMemo(() => {
    const map = new Map<string, Maintenance[]>();
    for (const m of maintenances) {
      const key = format(new Date(m.date), "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(m);
      map.set(key, list);
    }
    return map;
  }, [maintenances]);

  const selectedMaintenances = useMemo(() => {
    if (!selectedDate) return [];
    const key = format(selectedDate, "yyyy-MM-dd");
    return maintenancesByDay.get(key) ?? [];
  }, [selectedDate, maintenancesByDay]);

  function urgencyClasses(urgency: ReturnType<typeof maintenanceUrgency>) {
    switch (urgency) {
      case "overdue":
        return "bg-destructive";
      case "soon":
        return "bg-amber-500";
      case "done":
        return "bg-emerald-500";
      default:
        return "bg-[#ff0066]";
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Calendario de mantenciones</CardTitle>
              <p className="text-sm text-muted-foreground">
                {format(currentMonth, "MMMM yyyy", { locale: es })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth((d) => subMonths(d, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(new Date())}
              >
                Hoy
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth((d) => addMonths(d, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-muted-foreground">
            {weekDays.map((d) => (
              <div key={d} className="py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const dayMaintenances = maintenancesByDay.get(key) ?? [];
              const selected = selectedDate ? isSameDay(day, selectedDate) : false;
              const inMonth = isSameMonth(day, currentMonth);
              const today = isToday(day);

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "relative flex min-h-[72px] flex-col items-start justify-start rounded-md border p-1.5 text-left transition-colors hover:bg-accent",
                    !inMonth && "bg-muted/30 text-muted-foreground",
                    selected && "border-[#ff0066] bg-[#ff0066]/5 ring-1 ring-[#ff0066]",
                    today && !selected && "border-primary/50 bg-primary/5 font-semibold"
                  )}
                >
                  <span
                    className={cn(
                      "text-xs",
                      today && "rounded-full bg-[#ff0066] px-1.5 py-0.5 text-white"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  <div className="mt-1 flex w-full flex-wrap gap-1">
                    {dayMaintenances.slice(0, 4).map((m) => (
                      <span
                        key={m.id}
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          urgencyClasses(maintenanceUrgency(m))
                        )}
                        title={`${maintenanceTypeLabel[m.type]} - ${m.description}`}
                      />
                    ))}
                    {dayMaintenances.length > 4 && (
                      <span className="text-[10px] leading-none text-muted-foreground">
                        +{dayMaintenances.length - 4}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-destructive" />
              Vencida
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Próxima (7 días)
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#ff0066]" />
              Programada
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Completada
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {selectedDate ? formatDate(selectedDate.toISOString()) : "Selecciona un día"}
            </CardTitle>
            {selectedDate && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={() => onNewMaintenance?.(selectedDate)}
              >
                <Plus className="h-3.5 w-3.5" /> Agregar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {selectedMaintenances.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-sm text-muted-foreground">
              <Wrench className="h-8 w-8 opacity-50" />
              <p>No hay mantenciones para este día</p>
              {selectedDate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-[#ff0066]"
                  onClick={() => onNewMaintenance?.(selectedDate)}
                >
                  <Plus className="h-3.5 w-3.5" /> Crear mantención
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {selectedMaintenances.map((m) => {
                const vehicle = vehicles.find((v) => v.id === m.vehicleId);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onSelectMaintenance?.(m)}
                    className="w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {maintenanceTypeLabel[m.type]}
                        </p>
                        <p className="text-xs text-muted-foreground">{vehicle?.code ?? "—"}</p>
                      </div>
                      <MaintenanceStatusBadge status={m.status} />
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {m.description}
                    </p>
                    {m.provider && (
                      <p className="mt-1 text-xs text-muted-foreground">{m.provider}</p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
