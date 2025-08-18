import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const recentActivities = [
  {
    id: 1,
    type: "order",
    title: "New order #ORD-2024-001 created",
    user: "Sarah Johnson",
    time: "2 minutes ago",
    amount: "$1,250.00",
    status: "success",
  },
  {
    id: 2,
    type: "inventory",
    title: "Inventory alert: Low stock for Product ABC",
    user: "System Alert",
    time: "15 minutes ago",
    amount: "12 units",
    status: "warning",
  },
  {
    id: 3,
    type: "employee",
    title: "New employee Mike Davis added to HR system",
    user: "Admin",
    time: "1 hour ago",
    amount: "Manager",
    status: "info",
  },
  {
    id: 4,
    type: "expense",
    title: "Expense report submitted for approval",
    user: "Michael Chen",
    time: "2 hours ago",
    amount: "$450.00",
    status: "pending",
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'success':
      return 'bg-green-500';
    case 'warning':
      return 'bg-yellow-500';
    case 'info':
      return 'bg-blue-500';
    case 'pending':
      return 'bg-orange-500';
    default:
      return 'bg-gray-500';
  }
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'success':
      return 'default';
    case 'warning':
      return 'secondary';
    case 'info':
      return 'outline';
    case 'pending':
      return 'destructive';
    default:
      return 'secondary';
  }
};

export default function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4" data-testid="recent-activities">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-4 p-4 hover:bg-muted/50 rounded-lg transition-colors">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(activity.status)} flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-card-foreground truncate">
                  {activity.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  by {activity.user} • {activity.time}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-medium text-card-foreground">{activity.amount}</p>
                <Badge variant={getStatusVariant(activity.status)} className="text-xs">
                  {activity.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
