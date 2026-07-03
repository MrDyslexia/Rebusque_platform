"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/format";
import { useUsersStore } from "@/store/users";
import { User } from "@/types";
import { UserFormDialog } from "@/components/forms/user-form-dialog";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { toastSuccess, toastError, TOAST_MSGS } from "@/lib/toast";

export default function UsersPage() {
  const users = useUsersStore((s) => s.users);
  const removeUser = useUsersStore((s) => s.removeUser);

  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground">Administración de conductores, secretarias y clientes</p>
        </div>
        <Button
          className="gap-2 bg-[#ff0066] hover:bg-[#ff0066]/90"
          onClick={() => {
            setEditingUser(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Nuevo usuario
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <Card key={user.id} className="bg-secondary/30">
            <CardContent className="flex items-start gap-4 p-5">
              <Avatar className="h-12 w-12 bg-[#ff0066]">
                <AvatarFallback className="bg-[#ff0066] text-white">{initials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{user.name}</div>
                <div className="truncate text-sm text-muted-foreground">{user.email}</div>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">{user.role}</Badge>
                  {user.active && <Badge variant="success">Activo</Badge>}
                </div>
                <div className="mt-3 flex justify-end gap-2 border-t pt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => {
                      setEditingUser(user);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeletingUser(user)}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Eliminar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {users.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">No hay usuarios registrados</div>
        )}
      </div>

      <UserFormDialog open={formOpen} onOpenChange={setFormOpen} user={editingUser} />

      <ConfirmDeleteDialog
        open={Boolean(deletingUser)}
        onOpenChange={(open) => !open && setDeletingUser(null)}
        title="Eliminar usuario"
        description={`Esta acción eliminará a ${deletingUser?.name ?? ""} del sistema. No se puede deshacer.`}
        onConfirm={() => {
          try {
            if (deletingUser) {
              removeUser(deletingUser.id);
              toastSuccess(TOAST_MSGS.deleted("Usuario"));
            }
          } catch {
            toastError(TOAST_MSGS.deleteError("el usuario"));
          }
        }}
      />
    </div>
  );
}
