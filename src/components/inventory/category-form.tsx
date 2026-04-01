"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const PRESET_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#6b7280", // gray
  "#1e293b", // slate
];

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  color: z.string().min(1, "Color is required"),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryData {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
}

interface CategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: CategoryData | null;
  onSuccess: () => void;
}

export function CategoryForm({
  open,
  onOpenChange,
  category,
  onSuccess,
}: CategoryFormProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!category;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: category
      ? {
          name: category.name,
          color: category.color,
          sortOrder: category.sortOrder,
        }
      : {
          name: "",
          color: "#6366f1",
          sortOrder: 0,
        },
  });

  const selectedColor = watch("color");

  async function onSubmit(data: CategoryFormValues) {
    setLoading(true);
    try {
      const url = isEditing
        ? `/api/categories/${category!.id}`
        : "/api/categories";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Failed to save category");
      }

      reset();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Failed to save category:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Category" : "Add Category"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="cat-name">Category Name *</Label>
            <Input
              id="cat-name"
              {...register("name")}
              placeholder="e.g., Beverages"
            />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <Label>Color</Label>
            <div className="grid grid-cols-6 gap-2 mt-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`h-8 w-full rounded-md border-2 transition-all ${
                    selectedColor === color
                      ? "border-foreground scale-110"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setValue("color", color)}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Label htmlFor="custom-color" className="text-xs shrink-0">
                Custom:
              </Label>
              <Input
                id="custom-color"
                type="color"
                value={selectedColor}
                onChange={(e) => setValue("color", e.target.value)}
                className="h-8 w-14 p-1 cursor-pointer"
              />
              <Input
                value={selectedColor}
                onChange={(e) => setValue("color", e.target.value)}
                className="h-8 font-mono text-xs"
                placeholder="#000000"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="sortOrder">Sort Order</Label>
            <Input
              id="sortOrder"
              type="number"
              min="0"
              {...register("sortOrder", { valueAsNumber: true })}
            />
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
                ? "Update Category"
                : "Create Category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
