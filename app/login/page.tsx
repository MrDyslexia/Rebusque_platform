"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.18),transparent_34rem)] px-4 py-12">
      <div className="absolute right-4 top-4">
        <ThemeToggle className="w-auto gap-1 bg-background/80 backdrop-blur" />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#ff0066] text-white">
            <Package className="h-7 w-7" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl">El Rebusque</CardTitle>
          <CardDescription>Ingresa tus credenciales para continuar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Correo electrónico</label>
              <Input id="email" type="email" placeholder="maria@rebusque.cl" defaultValue="maria@rebusque.cl" />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Contraseña</label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  defaultValue="password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button asChild className="w-full bg-[#ff0066] hover:bg-[#ff0066]/90">
              <Link href="/dashboard">Iniciar sesión</Link>
            </Button>
          </form>

          <div className="text-center text-xs text-muted-foreground">
            También puedes{" "}
            <Link href="/dashboard" className="text-[#ff0066] hover:underline">
              ingresar como conductor
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
