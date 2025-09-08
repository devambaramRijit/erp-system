import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, Plus, Home, ChevronRight } from "lucide-react";
import { ModuleType } from "@/pages/dashboard";

interface TopBarProps {
  activeModule: ModuleType;
}

const moduleLabels = {
  dashboard: 'Dashboard',
  inventory: 'Inventory Management',
  sales: 'Sales & Orders',
  expenses: 'Expense Management',
  employees: 'Employee Management',
  audit: 'Audit Logs',
};

export default function TopBar({ activeModule }: TopBarProps) {
  const [notificationCount] = useState(0);

  return (
    <header className="bg-card shadow-sm px-6 py-4 flex items-center justify-between border-b" data-testid="topbar">
      <div className="flex items-center space-x-4">
        <h2 className="text-2xl font-semibold text-card-foreground">
          {moduleLabels[activeModule]}
        </h2>
        <nav className="flex items-center text-sm text-muted-foreground">
          <Home className="h-4 w-4 mr-1" />
          <span>Home</span>
          <ChevronRight className="h-4 w-4 mx-2" />
          <span className="text-foreground">{moduleLabels[activeModule]}</span>
        </nav>
      </div>

      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          className="relative"
          data-testid="button-notifications"
        >
          <Bell className="h-4 w-4" />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {notificationCount}
            </span>
          )}
        </Button>

        <Button className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-quick-add">
          <Plus className="h-4 w-4 mr-2" />
          Quick Add
        </Button>
      </div>
    </header>
  );
}
