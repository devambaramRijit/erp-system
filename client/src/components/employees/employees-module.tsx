import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Users, Bus, UserCheck, UserPlus, Eye, Edit, Mail, Phone, Calendar } from "lucide-react";
import { RootState } from "@/store/store";
import { setEmployees, setLoading, setError, setFilters } from "@/store/employeesSlice";
import { User } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import AddEmployeeModal from "@/components/modals/add-employee-modal";

export default function EmployeesModule() {
  const dispatch = useDispatch();
  const { employees, loading, filters } = useSelector((state: RootState) => state.employees);
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Omit<User, 'password'> | null>(null);

  const { data: employeesData, isLoading } = useQuery<Omit<User, 'password'>[]>({
    queryKey: ['/api/employees'],
    enabled: user?.role === 'admin' || user?.role === 'manager',
  });

  useEffect(() => {
    if (employeesData) {
      dispatch(setEmployees(employeesData));
    }
    dispatch(setLoading(isLoading));
  }, [employeesData, isLoading, dispatch]);

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = !filters.search || 
      employee.firstName.toLowerCase().includes(filters.search.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(filters.search.toLowerCase()) ||
      employee.email.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesRole = !filters.role || filters.role === 'all' || employee.role === filters.role;
    
    const matchesStatus = !filters.status || filters.status === 'all' ||
      (filters.status === 'active' && employee.isActive) ||
      (filters.status === 'inactive' && !employee.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return Bus;
      case 'manager':
        return UserCheck;
      default:
        return Users;
    }
  };

  const handleEdit = (employee: Omit<User, 'password'>) => {
    setEditingEmployee(employee);
    setIsAddModalOpen(true);
  };

  const totalEmployees = employees.length;
  const managers = employees.filter(emp => emp.role === 'manager').length;
  const activeToday = employees.filter(emp => emp.isActive).length;
  const newThisMonth = employees.filter(emp => {
    const createdDate = new Date(emp.createdAt);
    const now = new Date();
    return createdDate.getMonth() === now.getMonth() && 
           createdDate.getFullYear() === now.getFullYear();
  }).length;

  if (user?.role !== 'admin' && user?.role !== 'manager') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-muted-foreground">Access Denied</h3>
          <p className="text-sm text-muted-foreground mt-2">
            You don't have permission to view employee information.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="employees-module">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-card-foreground">Employee Management</h2>
        {user?.role === 'admin' && (
          <Button onClick={() => setIsAddModalOpen(true)} data-testid="button-add-employee">
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        )}
      </div>

      {/* Employee Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold text-card-foreground">{totalEmployees}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Bus className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Managers</p>
                <p className="text-2xl font-bold text-card-foreground">{managers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <UserCheck className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Today</p>
                <p className="text-2xl font-bold text-card-foreground">{activeToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <UserPlus className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">New This Month</p>
                <p className="text-2xl font-bold text-card-foreground">{newThisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  value={filters.search}
                  onChange={(e) => dispatch(setFilters({ search: e.target.value }))}
                  className="pl-10"
                  data-testid="input-search-employees"
                />
              </div>
            </div>
            <Select
              value={filters.role}
              onValueChange={(value) => dispatch(setFilters({ role: value }))}
            >
              <SelectTrigger className="w-full md:w-48" data-testid="select-employee-role">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.status}
              onValueChange={(value) => dispatch(setFilters({ status: value }))}
            >
              <SelectTrigger className="w-full md:w-48" data-testid="select-employee-status">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Employee Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="border">
                  <CardContent className="p-4">
                    <Skeleton className="h-32 w-full" />
                  </CardContent>
                </Card>
              ))
            ) : filteredEmployees.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No employees found
              </div>
            ) : (
              filteredEmployees.map((employee) => {
                const RoleIcon = getRoleIcon(employee.role);
                return (
                  <Card key={employee.id} className="border hover:shadow-md transition-shadow" data-testid={`employee-card-${employee.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center mb-4">
                        <Avatar className="h-12 w-12 mr-4">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {getUserInitials(employee.firstName, employee.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-card-foreground">
                            {employee.firstName} {employee.lastName}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {employee.role.charAt(0).toUpperCase() + employee.role.slice(1)}
                          </p>
                        </div>
                        <Badge className={getRoleColor(employee.role)}>
                          <RoleIcon className="h-3 w-3 mr-1" />
                          {employee.role.charAt(0).toUpperCase() + employee.role.slice(1)}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{employee.email}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span>Joined: {new Date(employee.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-2 ${employee.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span>{employee.isActive ? 'Active' : 'Inactive'}</span>
                        </div>
                      </div>

                      <div className="mt-4 flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEdit(employee)}
                          data-testid={`button-view-employee-${employee.id}`}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {user?.role === 'admin' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleEdit(employee)}
                            data-testid={`button-edit-employee-${employee.id}`}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingEmployee(null);
        }}
        editingEmployee={editingEmployee}
      />
    </div>
  );
}
