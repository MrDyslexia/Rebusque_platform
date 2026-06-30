import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">Variables de entorno y preferencias del sistema</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Variables de entorno</CardTitle>
          <CardDescription>Configuración de conexión a servicios externos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: "API Base URL", value: "http://localhost:3001/api/v1" },
            { label: "WebSocket URL", value: "ws://localhost:3001" },
            { label: "JWT Secret", value: "***" },
            { label: "MongoDB URI", value: "mongodb://localhost:27017/rebusque" },
            { label: "Redis URL", value: "redis://localhost:6379" },
          ].map((field) => (
            <div key={field.label} className="space-y-2">
              <label className="text-sm font-medium">{field.label}</label>
              <Input defaultValue={field.value} readOnly={field.value === "***"} />
            </div>
          ))}
          <Separator />
          <div className="flex justify-end gap-2">
            <Button variant="outline">Cancelar</Button>
            <Button className="bg-[#ff0066] hover:bg-[#ff0066]/90">Guardar cambios</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
