import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Plus, Edit, Trash, Eye, Calendar } from "lucide-react";
import { AuditLog } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

export default function AuditModule() {
  const { user } = useAuth();
  const [dateFilter, setDateFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const { data: auditLogs, isLoading } = useQuery<AuditLog[]>({
    queryKey: ['/api/audit-logs'],
    enabled: user?.role === 'admin',
  });

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-muted-foreground">Access Denied</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Only administrators can view audit logs.
          </p>
        </div>
      </div>
    );
  }

  const filteredLogs = auditLogs?.filter(log => {
    const matchesDate = !dateFilter || 
      new Date(log.timestamp).toDateString() === new Date(dateFilter).toDateString();
    
    const matchesAction = !actionFilter || actionFilter === 'all' || log.action === actionFilter;

    return matchesDate && matchesAction;
  }) || [];

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE':
        return Plus;
      case 'UPDATE':
        return Edit;
      case 'DELETE':
        return Trash;
      case 'VIEW':
        return Eye;
      default:
        return Calendar;
    }
  };

  const getActionVariant = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'default';
      case 'UPDATE':
        return 'secondary';
      case 'DELETE':
        return 'destructive';
      case 'VIEW':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  // Calculate stats
  const createdActions = auditLogs?.filter(log => log.action === 'CREATE').length || 0;
  const updatedActions = auditLogs?.filter(log => log.action === 'UPDATE').length || 0;
  const deletedActions = auditLogs?.filter(log => log.action === 'DELETE').length || 0;
  const viewedActions = auditLogs?.filter(log => log.action === 'VIEW').length || 0;

  return (
    <div className="space-y-6" data-testid="audit-module">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-card-foreground">Audit Logs</h2>
        <div className="flex space-x-2">
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-48"
            data-testid="input-date-filter"
          />
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-48" data-testid="select-action-filter">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="CREATE">Create</SelectItem>
              <SelectItem value="UPDATE">Update</SelectItem>
              <SelectItem value="DELETE">Delete</SelectItem>
              <SelectItem value="VIEW">View</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Audit Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Plus className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p className="text-2xl font-bold text-card-foreground">{createdActions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Edit className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Updated</p>
                <p className="text-2xl font-bold text-card-foreground">{updatedActions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-red-100 rounded-full">
                <Trash className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Deleted</p>
                <p className="text-2xl font-bold text-card-foreground">{deletedActions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Viewed</p>
                <p className="text-2xl font-bold text-card-foreground">{viewedActions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Log Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity Log</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => {
                    const ActionIcon = getActionIcon(log.action);
                    return (
                      <TableRow key={log.id} data-testid={`audit-log-${log.id}`}>
                        <TableCell className="font-mono text-sm">
                          {new Date(log.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm">{log.userId}</TableCell>
                        <TableCell>
                          <Badge variant={getActionVariant(log.action)} className="text-xs">
                            <ActionIcon className="h-3 w-3 mr-1" />
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{log.resource}</TableCell>
                        <TableCell className="text-sm max-w-xs truncate" title={log.details || ''}>
                          {log.details || '-'}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {log.ipAddress}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
