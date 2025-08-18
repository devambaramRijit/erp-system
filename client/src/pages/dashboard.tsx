import { useState } from "react";
import MainLayout from "@/components/layout/main-layout";
import KPICards from "@/components/dashboard/kpi-cards";
import RevenueChart from "@/components/dashboard/revenue-chart";
import CategoryChart from "@/components/dashboard/category-chart";
import RecentActivity from "@/components/dashboard/recent-activity";
import InventoryModule from "@/components/inventory/inventory-module";
import SalesModule from "@/components/sales/sales-module";
import ExpensesModule from "@/components/expenses/expenses-module";
import EmployeesModule from "@/components/employees/employees-module";
import AuditModule from "@/components/audit/audit-module";

export type ModuleType = 'dashboard' | 'inventory' | 'sales' | 'expenses' | 'employees' | 'audit';

export default function Dashboard() {
  const [activeModule, setActiveModule] = useState<ModuleType>('dashboard');

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return (
          <div className="space-y-6" data-testid="dashboard-module">
            <KPICards />
            
            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevenueChart />
              <CategoryChart />
            </div>
            
            <RecentActivity />
          </div>
        );
      case 'inventory':
        return <InventoryModule />;
      case 'sales':
        return <SalesModule />;
      case 'expenses':
        return <ExpensesModule />;
      case 'employees':
        return <EmployeesModule />;
      case 'audit':
        return <AuditModule />;
      default:
        return null;
    }
  };

  return (
    <MainLayout activeModule={activeModule} onModuleChange={setActiveModule}>
      {renderModule()}
    </MainLayout>
  );
}
