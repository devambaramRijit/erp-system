import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { ModuleType } from "@/pages/dashboard";
import { 
  Building, 
  ChartPie, 
  Package, 
  ShoppingCart, 
  Receipt, 
  Users, 
  ClipboardList,
  LogOut 
} from "lucide-react";

interface SidebarProps {
  activeModule: ModuleType;
  onModuleChange: (module: ModuleType) => void;
}

const navigationItems = [
  { id: 'dashboard' as ModuleType, label: 'Dashboard', icon: ChartPie },
  { id: 'inventory' as ModuleType, label: 'Inventory', icon: Package },
  { id: 'sales' as ModuleType, label: 'Sales & Orders', icon: ShoppingCart },
  { id: 'expenses' as ModuleType, label: 'Expenses', icon: Receipt },
  { id: 'employees' as ModuleType, label: 'Employees', icon: Users },
  { id: 'audit' as ModuleType, label: 'Audit Logs', icon: ClipboardList },
];

export default function Sidebar({ activeModule, onModuleChange }: SidebarProps) {
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="w-64 bg-card shadow-sm flex flex-col border-r" data-testid="sidebar">
      {/* Logo Section */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center">
          <Building className="h-8 w-8 text-primary mr-3" />
          <div>
            <h1 className="text-xl font-semibold text-card-foreground">ERP System</h1>
            <p className="text-sm text-muted-foreground">Acme Corporation</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2" data-testid="navigation">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          
          // Check role-based access
          if (item.id === 'audit' && user?.role !== 'admin') {
            return null;
          }
          
          if (item.id === 'employees' && !['admin', 'manager'].includes(user?.role || '')) {
            return null;
          }

          return (
            <button
              key={item.id}
              onClick={() => onModuleChange(item.id)}
              className={cn(
                "w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              data-testid={`nav-${item.id}`}
            >
              <Icon className="mr-3 h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user ? getUserInitials(user.firstName, user.lastName) : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-card-foreground truncate">
              {user ? `${user.firstName} ${user.lastName}` : 'User'}
            </p>
            <div className="flex items-center space-x-2">
              <span className={cn(
                "inline-flex px-2 py-1 text-xs font-semibold rounded-full",
                getRoleColor(user?.role || 'employee')
              )}>
                {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
