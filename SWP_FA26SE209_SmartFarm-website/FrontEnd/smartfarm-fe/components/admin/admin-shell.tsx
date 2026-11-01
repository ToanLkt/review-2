"use client";
import { useEffect, useState } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { Header } from "./header";
export function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1280px)");
    const update = () => setOpen(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return (
    <SidebarProvider
      open={open}
      onOpenChange={setOpen}
      style={{ "--sidebar-width": "248px" } as React.CSSProperties}
    >
      <AppSidebar />
      <SidebarInset className="min-w-0 bg-background">
        <Header />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
