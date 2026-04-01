"use client";

import { useState } from "react";
import { Plus, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProductEntry {
  name: string;
  price: string;
  category: string;
}

interface QuickProductsProps {
  tenantId: string;
  onContinue: () => void;
}

const emptyProduct = (): ProductEntry => ({
  name: "",
  price: "",
  category: "",
});

export function QuickProducts({ tenantId, onContinue }: QuickProductsProps) {
  const [products, setProducts] = useState<ProductEntry[]>([emptyProduct()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addProduct() {
    if (products.length < 3) {
      setProducts([...products, emptyProduct()]);
    }
  }

  function removeProduct(index: number) {
    setProducts(products.filter((_, i) => i !== index));
  }

  function updateProduct(index: number, field: keyof ProductEntry, value: string) {
    const updated = [...products];
    updated[index] = { ...updated[index], [field]: value };
    setProducts(updated);
  }

  async function handleSubmit() {
    const validProducts = products.filter((p) => p.name.trim() && p.price.trim());

    if (validProducts.length === 0) {
      onContinue();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      for (const product of validProducts) {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: product.name.trim(),
            price: Math.round(parseFloat(product.price) * 100),
            tenantId,
          }),
        });
        if (!res.ok) {
          throw new Error("Failed to add product");
        }
      }
      onContinue();
    } catch {
      setError("Failed to add products. You can add them later from the dashboard.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-lg mx-auto p-8">
      <div className="text-center mb-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
          <Package className="h-8 w-8 text-indigo-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Add Your First Products
        </h3>
        <p className="text-gray-500">
          Add up to 3 products to get started. You can always add more later.
        </p>
      </div>

      <div className="space-y-4 mb-6">
        {products.map((product, index) => (
          <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Product {index + 1}
              </span>
              {products.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeProduct(index)}
                  className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div>
              <Label htmlFor={`name-${index}`}>Name</Label>
              <Input
                id={`name-${index}`}
                placeholder="e.g., Coffee"
                value={product.name}
                onChange={(e) => updateProduct(index, "name", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor={`price-${index}`}>Price ($)</Label>
                <Input
                  id={`price-${index}`}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="4.99"
                  value={product.price}
                  onChange={(e) => updateProduct(index, "price", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor={`category-${index}`}>Category</Label>
                <Input
                  id={`category-${index}`}
                  placeholder="e.g., Drinks"
                  value={product.category}
                  onChange={(e) => updateProduct(index, "category", e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-600 mb-4">{error}</p>
      )}

      <div className="flex flex-col gap-3">
        {products.length < 3 && (
          <Button variant="outline" onClick={addProduct} className="w-full">
            <Plus className="mr-2 h-4 w-4" /> Add Another Product
          </Button>
        )}

        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {loading ? "Saving..." : "Continue"}
        </Button>

        <Button
          variant="ghost"
          onClick={onContinue}
          disabled={loading}
          className="w-full text-gray-500"
        >
          Skip for now
        </Button>
      </div>
    </Card>
  );
}
