import type { UserResponse } from "./api/types";

type SessionListener = () => void;

let currentUser: UserResponse | null = null;
const listeners = new Set<SessionListener>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

export const customerSession = {
  getUser: () => currentUser,
  setUser: (user: UserResponse) => {
    currentUser = user;
    emitChange();
  },
  clear: () => {
    if (!currentUser) return;
    currentUser = null;
    emitChange();
  },
  subscribe: (listener: SessionListener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function isCustomerUser(user: UserResponse | null): user is UserResponse {
  const role = user?.role?.trim().toLowerCase();
  return role === "customer" || role === "user";
}
