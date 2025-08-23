import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Filter, Edit, Trash2 } from "lucide-react";
import { RootState } from "@/store/store";
import { setItems, setLoading, setError, setFilters } from "@/store/inventorySlice";
import { InventoryItem } from "D:/2025/react/react dev/ErpSoul/shared/schema.js";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AddInventoryModal from "@/components/modals/add-inventory-modal";

export default function InventoryModule() {
  const dispatch = useDispatch();
  const { items = [], loading, filters } = useSelector((state: RootState) => state.inventory); // Default to empty array
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const { toast } = useToast();

  const { data: inventoryData, isLoading } = useQuery< {items: InventoryItem[], total: number} >({
    queryKey: ['/api/inventory'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/inventory');
      return res.data as { items: InventoryItem[], total: number };
    },
    // Optional: Add initialData or retry options if API is unreliable
    // initialData: [], // Uncomment if you have a fallback
  });

  const addMutation = useMutation({
  mutationFn: async (newItem: Omit<InventoryItem, "id">) => {
    const res = await apiRequest("POST", "/api/inventory", newItem);
    return res.data.item; // since we wrapped in { item }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
    toast({ title: "Success", description: "Item added successfully" });
  }
  });


  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/inventory/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      toast({
        title: "Success",
        description: "Inventory item deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
  if (inventoryData) {
    console.log("📡 API response from /api/inventory:", inventoryData);
    console.log("📡 inventoryData in React:", inventoryData);
    dispatch(setItems(inventoryData.items));
    }
    dispatch(setLoading(isLoading));
  }, [inventoryData, isLoading, dispatch]);

  // Safely filter items, ensuring items is an array

const filteredItems = Array.isArray(items)
  ? items.filter(item => {
      // Search filter
      const matchesSearch =
        !filters.search ||
        item.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.sku.toLowerCase().includes(filters.search.toLowerCase());

      // Category filter (all = no filtering)
      const matchesCategory =
        !filters.category ||
        filters.category === "all" ||
        item.category === filters.category;

      // Status filter (all = no filtering)
      const matchesStatus =
        !filters.status ||
        filters.status === "all" ||
        (filters.status === "in-stock" && item.stock > item.minStock) ||
        (filters.status === "low-stock" &&
          item.stock <= item.minStock &&
          item.stock > 0) ||
        (filters.status === "out-of-stock" && item.stock === 0);

      return matchesSearch && matchesCategory && matchesStatus;
    })
  : [];

  const getStockStatus = (item: InventoryItem) => {
    if (item.stock === 0) return { label: 'Out of Stock', variant: 'destructive' };
    if (item.stock <= item.minStock) return { label: 'Low Stock', variant: 'secondary' };
    return { label: 'In Stock', variant: 'default' };
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setIsAddModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      deleteMutation.mutate(id);
    }
  };

const categories = Array.from(new Set((Array.isArray(items) ? items : []).map(item => item.category)));

  return (
    <div className="space-y-6" data-testid="inventory-module">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-card-foreground">Inventory Management</h2>
        <Button onClick={() => setIsAddModalOpen(true)} data-testid="button-add-item">
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Search by name or SKU..."
                value={filters.search}
                onChange={(e) => dispatch(setFilters({ search: e.target.value }))}
                data-testid="input-search"
              />
            </div>
            <div>
              <Select
                value={filters.category}
                onValueChange={(value) => dispatch(setFilters({ category: value }))}
              >
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select
                value={filters.status}
                onValueChange={(value) => dispatch(setFilters({ status: value }))}
              >
                <SelectTrigger data-testid="select-status">
                  <SelectValue placeholder="All Items" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="in-stock">In Stock</SelectItem>
                  <SelectItem value="low-stock">Low Stock</SelectItem>
                  <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => dispatch(setFilters({ search: '', category: 'all', status: 'all' }))}
                data-testid="button-clear-filters"
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No inventory items found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => {
                    const status = getStockStatus(item);
                    return (
                      <TableRow key={item.id} data-testid={`inventory-row-${item.id}`}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-muted-foreground">{item.description}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">{item.sku}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>{item.stock}</TableCell>
                        <TableCell>${Number(item.price).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(item)}
                              data-testid={`button-edit-${item.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
                              disabled={deleteMutation.isPending}
                              data-testid={`button-delete-${item.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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

      <AddInventoryModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingItem(null);
        }}
        editingItem={editingItem}
      />
    </div>
  );
}