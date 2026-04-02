"use client";

import { useState, useMemo } from "react";
import { Search, Package, Store, User } from "lucide-react";
import { Input } from "@/components/ui/input";
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
  merchantName: string;
  cashierName: string;
}

export function ProductGrid({
  products,
  categories,
  onAddToCart,
  merchantName,
  cashierName,
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
      {/* Desktop header with merchant/cashier info */}
      <div className="hidden items-center justify-between border-b bg-white px-6 py-3 md:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100">
            <Store className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">{merchantName}</h1>
            <p className="text-xs text-gray-500">Point of Sale</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5">
          <User className="h-3.5 w-3.5 text-gray-500" />
          <span className="text-sm text-gray-600">{cashierName}</span>
        </div>
      </div>

      {/* Search bar */}
      <div className="border-b bg-white px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search products by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 rounded-xl border-gray-200 bg-gray-50 pl-10 text-sm focus:bg-white"
          />
        </div>
      </div>

      {/* Category pills - horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto border-b bg-white px-4 py-2.5 scrollbar-hide">
        <button
          className={cn(
            "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all",
            selectedCategory === null
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
          onClick={() => setSelectedCategory(null)}
        >
          All Items
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all",
              selectedCategory === cat.id
                ? "text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
            style={
              selectedCategory === cat.id
                ? { backgroundColor: cat.color }
                : undefined
            }
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product grid */}
      <div className="flex-1 overflow-y-auto p-3 pb-24 md:p-4 md:pb-4">
        {filtered.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-gray-400">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Package className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-base font-medium text-gray-500">No products found</p>
            <p className="mt-1 text-sm text-gray-400">
              {search
                ? "Try a different search term"
                : "No products in this category"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4">
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
        "group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white text-left shadow-sm transition-all",
        outOfStock
          ? "cursor-not-allowed opacity-50"
          : "hover:shadow-lg hover:ring-2 hover:ring-indigo-100 active:scale-[0.97]"
      )}
    >
      {/* Product image or placeholder */}
      {product.image ? (
        <div className="relative aspect-square w-full overflow-hidden bg-gray-50">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
          {/* Stock badge overlay */}
          {product.trackStock && (
            <span
              className={cn(
                "absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-semibold",
                outOfStock
                  ? "bg-red-500 text-white"
                  : lowStock
                    ? "bg-amber-400 text-amber-900"
                    : "bg-white/90 text-gray-700 backdrop-blur-sm"
              )}
            >
              {outOfStock ? "Sold Out" : lowStock ? `${product.stock} left` : product.stock}
            </span>
          )}
        </div>
      ) : (
        <div className="relative flex aspect-square w-full items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
          <Package
            className="h-10 w-10 opacity-40"
            style={{ color: categoryColor }}
          />
          {/* Category accent dot */}
          <div
            className="absolute left-2.5 top-2.5 h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: categoryColor }}
          />
          {/* Stock badge overlay */}
          {product.trackStock && (
            <span
              className={cn(
                "absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-semibold",
                outOfStock
                  ? "bg-red-500 text-white"
                  : lowStock
                    ? "bg-amber-400 text-amber-900"
                    : "bg-white/90 text-gray-700"
              )}
            >
              {outOfStock ? "Sold Out" : lowStock ? `${product.stock} left` : product.stock}
            </span>
          )}
        </div>
      )}

      {/* Product info */}
      <div className="flex flex-1 flex-col justify-between p-3">
        <p className="line-clamp-2 text-sm font-bold leading-snug text-gray-900">
          {product.name}
        </p>
        <p className="mt-1.5 text-base font-bold text-indigo-600">
          {formatCurrency(product.price)}
        </p>
      </div>
    </button>
  );
}
