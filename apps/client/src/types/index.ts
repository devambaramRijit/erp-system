export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  totalInventoryItems: number;
  lowStockItems: number;
  totalEmployees: number;
  activeEmployees: number;
  totalExpenses: number;
  pendingExpenses: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    tension?: number;
  }[];
}

export interface FilterOptions {
  search?: string;
  category?: string;
  status?: string;
  role?: string;
  action?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}
