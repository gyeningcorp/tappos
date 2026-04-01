'use client'
"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatCurrency } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  color: string;
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
  category: Category | null;
  variants: {
    id: string;
    name: string;
    type: string;
    price: number | null;
    stock: number;
    sku: string | null;
  }[];
}

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: () => void;
}

export function ProductTable({ products, onEdit, onDelete }: ProductTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setDeleteTarget(null);
      onDelete();
    } catch (error) {
      console.error("Failed to delete product:", error);
    } finally {
      setDeleting(false);
    }
  }

  function getStockBadge(product: Product) {
    if (!product.trackStock) {
      return <Badge variant="secondary">Untracked</Badge>;
    }
    if (product.stock <= 0) {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          Out of stock
        </Badge>
      );
    }
    if (product.stock <= product.lowStockAt) {
      return (
        <Badge className="bg-amber-100 text-amber-800 border-amber-200">
          Low: {product.stock}
        </Badge>
      );
    }
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200">
        {product.stock}
      </Badge>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No products found</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Add your first product to get started.
        </p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>Name</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow
              key={product.id}
              className={`cursor-pointer ${
                product.trackStock && product.stock <= product.lowStockAt
                  ? product.stock <= 0
                    ? "bg-red-50/50"
                    : "bg-amber-50/50"
                  : ""
              }`}
              onClick={() => onEdit(product)}
            >
              <TableCell>
                <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-10 w-10 rounded-md object-cover"
                    />
                  ) : (
                    <Package className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </TableCell>
              <TableCell className="font-medium">
                <div>
                  {product.name}
                  {product.variants.length > 0 && (
                    <span className="text-xs text-muted-foreground ml-2">
                      ({product.variants.length} variants)
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {product.sku || "-"}
              </TableCell>
              <TableCell>
                {product.category ? (
                  <Badge
                    variant="outline"
                    style={{
                      borderColor: product.category.color,
                      color: product.category.color,
                    }}
                  >
                    {product.category.name}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>{formatCurrency(product.price)}</TableCell>
              <TableCell>{getStockBadge(product)}</TableCell>
              <TableCell>
                {product.isActive ? (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </TableCell>
              <TableCell>
                <div
                  className="flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEdit(product)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => setDeleteTarget(product)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;?
              This action cannot be undone. All variants will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
