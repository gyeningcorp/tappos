"use client";

import { useState, useMemo } from "react";
import { Search, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import type {
  ProductData,
  CategoryData,
  VariantData,
} from "@/components/pos/pos-terminal";

interface ProductGridProps {
  products: ProductData[];
  categories: CategoryData[];
  onAddToCart: (product: ProductData, variant?: VariantData) => void;
}

export function ProductGrid({
  products,
  categories,
  onAddToCart,
}: ProductGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let result = products;

    if (selectedCategory) {
      result = result.filter((p) => p.categoryId === selectedCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.barcode?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [products, selectedCategory, search]);

  return (
    <div className="flex h-full flex-col">
      {/* Search bar */}
      <div className="border-b bg-white px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search products by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12 pl-10 text-base"
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto border-b bg-white px-4 py-3">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="lg"
          className={cn(
            "min-h-[48px] shrink-0 rounded-full px-6 text-sm font-medium",
            selectedCategory === null &&
              "bg-indigo-600 text-white hover:bg-indigo-700"
          )}
          onClick={() => setSelectedCategory(null)}
        >
          All
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.id ? "default" : "outline"}
            size="lg"
            className={cn(
              "min-h-[48px] shrink-0 rounded-full px-6 text-sm font-medium",
              selectedCategory === cat.id
                ? "text-white"
                : "border-gray-200 hover:border-gray-300"
            )}
            style={
              selectedCategory === cat.id
                ? { backgroundColor: cat.color }
                : undefined
            }
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.name}
          </Button>
        ))}
      </div>

      {/* Product grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filtered.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-gray-400">
            <Package className="mb-3 h-12 w-12" />
            <p className="text-lg font-medium">No products found</p>
            <p className="text-sm">
              {search
                ? "Try a different search term"
                : "No products in this category"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAdd={onAddToCart}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProductCard({
  product,
  onAdd,
}: {
  product: ProductData;
  onAdd: (product: ProductData, variant?: VariantData) => void;
}) {
  const outOfStock = product.trackStock && product.stock <= 0;
  const lowStock =
    product.trackStock &&
    product.stock > 0 &&
    product.stock <= product.lowStockAt;
  const categoryColor = product.category?.color ?? "#6366f1";

  return (
    <button
      onClick={() => {
        if (!outOfStock) {
          onAdd(product);
        }
      }}
      disabled={outOfStock}
      className={cn(
        "group relative flex min-h-[140px] flex-col overflow-hidden rounded-xl border bg-white text-left shadow-sm transition-all",
        outOfStock
          ? "cursor-not-allowed opacity-60"
          : "hover:shadow-md hover:ring-2 hover:ring-indigo-200 active:scale-[0.98]"
      )}
    >
      {/* Category color accent */}
      <div
        className="h-1.5 w-full shrink-0"
        style={{ backgroundColor: categoryColor }}
      />

      {/* Product image or icon */}
      {product.image ? (
        <div className="flex h-20 items-center justify-center overflow-hidden bg-gray-50 p-2">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-contain"
          />
        </div>
      ) : (
        <div className="flex h-20 items-center justify-center bg-gray-50">
          <Package
            className="h-8 w-8 text-gray-300"
            style={{ color: categoryColor }}
          />
        </div>
      )}

      {/* Product info */}
      <div className="flex flex-1 flex-col justify-between p-3">
        <p className="line-clamp-2 text-sm font-semibold leading-tight text-gray-900">
          {product.name}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-base font-bold text-indigo-600">
            {formatCurrency(product.price)}
          </span>
          {product.trackStock && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                outOfStock
                  ? "bg-red-100 text-red-700"
                  : lowStock
                    ? "bg-amber-100 text-amber-700"
                    : "bg-emerald-100 text-emerald-700"
              )}
            >
              {outOfStock ? "Out" : product.stock}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
