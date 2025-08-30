import { ReactNode } from "react";
import Sidebar from "./sidebar";
import TopBar from "./topbar";
import { ModuleType } from "@/pages/dashboard";

interface MainLayoutProps {
  children: ReactNode;
  activeModule: ModuleType;
  onModuleChange: (module: ModuleType) => void;
}

export default function MainLayout({ children, activeModule, onModuleChange }: MainLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeModule={activeModule} onModuleChange={onModuleChange} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar activeModule={activeModule} />
        <main className="flex-1 overflow-y-auto p-6" data-testid="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
