import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, ShoppingCart, Package, Users, TrendingUp, TrendingDown } from "lucide-react";
import { DashboardStats } from "@/types";

export default function KPICards() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const kpiData = [
    {
      title: "Total Revenue",
      value: `$${stats?.totalRevenue?.toLocaleString() || '0'}`,
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      title: "Orders",
      value: stats?.totalOrders?.toLocaleString() || '0',
      change: "+8.2%",
      trend: "up",
      icon: ShoppingCart,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
    },
    {
      title: "Inventory Items",
      value: stats?.totalInventoryItems?.toLocaleString() || '0',
      change: "-3.1%",
      trend: "down",
      icon: Package,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "Active Employees",
      value: stats?.activeEmployees?.toLocaleString() || '0',
      change: "+2.4%",
      trend: "up",
      icon: Users,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="kpi-cards">
      {kpiData.map((kpi, index) => {
        const Icon = kpi.icon;
        const TrendIcon = kpi.trend === 'up' ? TrendingUp : TrendingDown;
        
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                  <p className="text-3xl font-bold text-card-foreground" data-testid={`kpi-value-${index}`}>
                    {kpi.value}
                  </p>
                  <p className={`text-sm flex items-center ${
                    kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendIcon className="h-4 w-4 mr-1" />
                    {kpi.change} vs last month
                  </p>
                </div>
                <div className={`p-3 rounded-full ${kpi.iconBg}`}>
                  <Icon className={`h-6 w-6 ${kpi.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
