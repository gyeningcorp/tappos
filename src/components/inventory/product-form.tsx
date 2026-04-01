"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const variantSchema = z.object({
  name: z.string().min(1, "Variant name is required"),
  type: z.string().min(1, "Variant type is required"),
  price: z.string().optional(),
  stock: z.coerce.number().int().min(0).default(0),
  sku: z.string().optional(),
});

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  price: z.string().min(1, "Price is required"),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  categoryId: z.string().optional(),
  stock: z.coerce.number().int().min(0).default(0),
  lowStockAt: z.coerce.number().int().min(0).default(5),
  trackStock: z.boolean().default(true),
  isActive: z.boolean().default(true),
  variants: z.array(variantSchema).default([]),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface Category {
  id: string;
  name: string;
  color: string;
}

interface ProductData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  sku: string | null;
  barcode: string | null;
  categoryId: string | null;
  stock: number;
  lowStockAt: number;
  trackStock: boolean;
  isActive: boolean;
  variants: {
    name: string;
    type: string;
    price: number | null;
    stock: number;
    sku: string | null;
  }[];
}

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  product?: ProductData | null;
  onSuccess: () => void;
}

export function ProductForm({
  open,
  onOpenChange,
  categories,
  product,
  onSuccess,
}: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!product;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          name: product.name,
          description: product.description || "",
          price: (product.price / 100).toFixed(2),
          sku: product.sku || "",
          barcode: product.barcode || "",
          categoryId: product.categoryId || "",
          stock: product.stock,
          lowStockAt: product.lowStockAt,
          trackStock: product.trackStock,
          isActive: product.isActive,
          variants: product.variants.map((v) => ({
            name: v.name,
            type: v.type,
            price: v.price != null ? (v.price / 100).toFixed(2) : "",
            stock: v.stock,
            sku: v.sku || "",
          })),
        }
      : {
          name: "",
          description: "",
          price: "",
          sku: "",
          barcode: "",
          categoryId: "",
          stock: 0,
          lowStockAt: 5,
          trackStock: true,
          isActive: true,
          variants: [],
        },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  const trackStock = watch("trackStock");

  async function onSubmit(data: ProductFormValues) {
    setLoading(true);
    try {
      const priceInCents = Math.round(parseFloat(data.price) * 100);

      const payload = {
        name: data.name,
        description: data.description || null,
        price: priceInCents,
        sku: data.sku || null,
        barcode: data.barcode || null,
        categoryId: data.categoryId || null,
        stock: data.stock,
        lowStockAt: data.lowStockAt,
        trackStock: data.trackStock,
        isActive: data.isActive,
        variants: data.variants.map((v) => ({
          name: v.name,
          type: v.type,
          price: v.price ? Math.round(parseFloat(v.price) * 100) : null,
          stock: v.stock,
          sku: v.sku || null,
        })),
      };

      const url = isEditing
        ? `/api/products/${product!.id}`
        : "/api/products";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to save product");
      }

      reset();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Failed to save product:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Product" : "Add Product"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Enter product name"
              />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Optional description"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="price">Price (USD) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="price"
                  {...register("price")}
                  placeholder="0.00"
                  className="pl-7"
                  type="number"
                  step="0.01"
                  min="0"
                />
              </div>
              {errors.price && (
                <p className="text-sm text-destructive mt-1">
                  {errors.price.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="categoryId">Category</Label>
              <Select
                value={watch("categoryId") || ""}
                onValueChange={(val) =>
                  setValue("categoryId", val === "none" ? "" : val)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                {...register("sku")}
                placeholder="e.g., PROD-001"
              />
            </div>

            <div>
              <Label htmlFor="barcode">Barcode</Label>
              <Input
                id="barcode"
                {...register("barcode")}
                placeholder="Scan or enter barcode"
              />
            </div>
          </div>

          {/* Stock Management */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-medium">Stock Management</h3>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("trackStock")}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm">Track stock quantity</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("isActive")}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm">Active</span>
              </label>
            </div>

            {trackStock && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stock">Current Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    {...register("stock", { valueAsNumber: true })}
                  />
                </div>
                <div>
                  <Label htmlFor="lowStockAt">Low Stock Threshold</Label>
                  <Input
                    id="lowStockAt"
                    type="number"
                    min="0"
                    {...register("lowStockAt", { valueAsNumber: true })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Variants */}
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Variants</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({ name: "", type: "", price: "", stock: 0, sku: "" })
                }
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Variant
              </Button>
            </div>

            {fields.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No variants added. Add variants for different sizes, colors,
                etc.
              </p>
            )}

            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-6 gap-2 items-end border-b pb-3"
              >
                <div className="col-span-2">
                  <Label className="text-xs">Name *</Label>
                  <Input
                    {...register(`variants.${index}.name`)}
                    placeholder="e.g., Large"
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Type *</Label>
                  <Input
                    {...register(`variants.${index}.type`)}
                    placeholder="e.g., Size"
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Price ($)</Label>
                  <Input
                    {...register(`variants.${index}.price`)}
                    placeholder="Override"
                    type="number"
                    step="0.01"
                    min="0"
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Stock</Label>
                  <Input
                    {...register(`variants.${index}.stock`, {
                      valueAsNumber: true,
                    })}
                    type="number"
                    min="0"
                    className="h-9"
                  />
                </div>
                <div className="flex items-end gap-1">
                  <div className="flex-1">
                    <Label className="text-xs">SKU</Label>
                    <Input
                      {...register(`variants.${index}.sku`)}
                      placeholder="SKU"
                      className="h-9"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? "Saving..."
                : isEditing
                ? "Update Product"
                : "Create Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
