import { create } from "zustand";

import { users as seedUsers } from "@/data";
import { User } from "@/types";

interface UsersState {
  users: User[];
  addUser: (user: Omit<User, "id" | "active">) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  removeUser: (id: string) => void;
}

export const useUsersStore = create<UsersState>((set) => ({
  users: seedUsers,
  addUser: (user) =>
    set((state) => ({
      users: [...state.users, { ...user, id: `usr_${Date.now()}`, active: true }],
    })),
  updateUser: (id, patch) =>
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? { ...u, ...patch } : u)),
    })),
  removeUser: (id) =>
    set((state) => ({
      users: state.users.filter((u) => u.id !== id),
    })),
}));
