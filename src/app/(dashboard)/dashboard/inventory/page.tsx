"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ProductTable } from "@/components/inventory/product-table";
import { ProductForm } from "@/components/inventory/product-form";
import { CategoryList } from "@/components/inventory/category-list";
import { CategoryForm } from "@/components/inventory/category-form";
import { AlertsList } from "@/components/inventory/alerts-list";

interface Category {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
  _count: { products: number };
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  sku: string | null;
  barcode: string | null;
  stock: number;
  lowStockAt: number;
  trackStock: boolean;
  isActive: boolean;
  categoryId: string | null;
  category: { id: string; name: string; color: string } | null;
  variants: {
    id: string;
    name: string;
    type: string;
    price: number | null;
    stock: number;
    sku: string | null;
  }[];
}

interface Alert {
  id: string;
  productName: string;
  productId: string;
  currentStock: number;
  threshold: number;
  isRead: boolean;
  createdAt: string;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (categoryFilter) params.set("categoryId", categoryFilter);
      const res = await fetch(`/api/products?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  }, [search, categoryFilter]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/alerts");
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
    }
  }, []);

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      await Promise.all([fetchProducts(), fetchCategories(), fetchAlerts()]);
      setLoading(false);
    }
    loadAll();
  }, [fetchProducts, fetchCategories, fetchAlerts]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, categoryFilter, fetchProducts]);

  function handleEditProduct(product: Product) {
    setEditingProduct(product);
    setProductFormOpen(true);
  }

  function handleEditCategory(category: Category) {
    setEditingCategory(category);
    setCategoryFormOpen(true);
  }

  function handleProductFormClose(open: boolean) {
    setProductFormOpen(open);
    if (!open) setEditingProduct(null);
  }

  function handleCategoryFormClose(open: boolean) {
    setCategoryFormOpen(open);
    if (!open) setEditingCategory(null);
  }

  const unreadAlertCount = alerts.filter((a) => !a.isRead).length;

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">
            Manage your products, categories, and stock levels.
          </p>
        </div>
      </div>

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="alerts" className="relative">
            Alerts
            {unreadAlertCount > 0 && (
              <Badge className="ml-2 h-5 min-w-[20px] px-1.5 bg-red-500 text-white text-xs">
                {unreadAlertCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative flex-1 w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={categoryFilter}
              onValueChange={(val) =>
                setCategoryFilter(val === "all" ? "" : val)
              }
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setProductFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading products...</div>
            </div>
          ) : (
            <ProductTable
              products={products}
              onEdit={handleEditProduct}
              onDelete={() => {
                fetchProducts();
                fetchAlerts();
              }}
            />
          )}
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Categories</h2>
            <Button onClick={() => setCategoryFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">
                Loading categories...
              </div>
            </div>
          ) : (
            <CategoryList
              categories={categories}
              onEdit={handleEditCategory}
              onDelete={() => {
                fetchCategories();
                fetchProducts();
              }}
            />
          )}
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading alerts...</div>
            </div>
          ) : (
            <AlertsList alerts={alerts} onUpdate={fetchAlerts} />
          )}
        </TabsContent>
      </Tabs>

      {/* Product Form Dialog */}
      <ProductForm
        open={productFormOpen}
        onOpenChange={handleProductFormClose}
        categories={categories}
        product={editingProduct}
        onSuccess={() => {
          fetchProducts();
          fetchCategories();
          fetchAlerts();
        }}
      />

      {/* Category Form Dialog */}
      <CategoryForm
        open={categoryFormOpen}
        onOpenChange={handleCategoryFormClose}
        category={editingCategory}
        onSuccess={() => {
          fetchCategories();
          fetchProducts();
        }}
      />
    </div>
  );
}
