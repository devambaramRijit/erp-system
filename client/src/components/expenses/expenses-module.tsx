import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowDown, Calendar, TrendingUp, Clock } from "lucide-react";
import { Expense } from "@shared/schema";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AddExpenseModal from "@/components/modals/add-expense-modal";

const expenseCategoryData = [
  { category: 'Marketing', amount: 4500 },
  { category: 'IT', amount: 3200 },
  { category: 'Office Supplies', amount: 1800 },
  { category: 'Travel', amount: 2100 },
  { category: 'Utilities', amount: 1200 },
  { category: 'Other', amount: 800 },
];

export default function ExpensesModule() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const { data: expenses, isLoading } = useQuery<Expense[]>({
    queryKey: ['/api/expenses'],
  });

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const thisMonthExpenses = expenses?.filter(expense => {
    const expenseDate = new Date(expense.expenseDate);
    return expenseDate.getMonth() === currentMonth && 
           expenseDate.getFullYear() === currentYear &&
           expense.status === 'approved';
  }).reduce((sum, expense) => sum + parseFloat(expense.amount), 0) || 0;

  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  
  const lastMonthExpenses = expenses?.filter(expense => {
    const expenseDate = new Date(expense.expenseDate);
    return expenseDate.getMonth() === lastMonth && 
           expenseDate.getFullYear() === lastMonthYear &&
           expense.status === 'approved';
  }).reduce((sum, expense) => sum + parseFloat(expense.amount), 0) || 0;

  const ytdExpenses = expenses?.filter(expense => {
    const expenseDate = new Date(expense.expenseDate);
    return expenseDate.getFullYear() === currentYear && expense.status === 'approved';
  }).reduce((sum, expense) => sum + parseFloat(expense.amount), 0) || 0;

  const pendingExpenses = expenses?.filter(expense => expense.status === 'pending')
    .reduce((sum, expense) => sum + parseFloat(expense.amount), 0) || 0;

  const recentExpenses = expenses?.slice(0, 5) || [];

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'marketing':
        return '📊';
      case 'it':
        return '💻';
      case 'office':
      case 'office supplies':
        return '📎';
      case 'travel':
        return '✈️';
      case 'utilities':
        return '⚡';
      default:
        return '📄';
    }
  };

  return (
    <div className="space-y-6" data-testid="expenses-module">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-card-foreground">Expense Management</h2>
        <Button onClick={() => setIsAddModalOpen(true)} data-testid="button-add-expense">
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Expense Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-card-foreground">
                  ${thisMonthExpenses.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-red-50 rounded-full">
                <ArrowDown className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Month</p>
                <p className="text-2xl font-bold text-card-foreground">
                  ${lastMonthExpenses.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-gray-100 rounded-full">
                <Calendar className="h-6 w-6 text-gray-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">YTD Total</p>
                <p className="text-2xl font-bold text-card-foreground">
                  ${ytdExpenses.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-full">
                <TrendingUp className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-card-foreground">
                  ${pendingExpenses.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-orange-50 rounded-full">
                <Clock className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expense Categories Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Expenses by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expenseCategoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis 
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Amount']}
                />
                <Bar 
                  dataKey="amount" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Expenses */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4" data-testid="recent-expenses">
            {recentExpenses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No expenses found
              </div>
            ) : (
              recentExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-4 hover:bg-muted/50 rounded-lg transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-gray-100 rounded-full text-xl">
                      {getCategoryIcon(expense.category)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{expense.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {expense.category} • {new Date(expense.expenseDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-card-foreground">
                      ${Number(expense.amount).toFixed(2)}
                    </p>
                    <Badge variant={getStatusVariant(expense.status)} className="text-xs">
                      {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <AddExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}
