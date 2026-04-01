import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { POSTerminal } from "@/components/pos/pos-terminal";

export default async function POSPage() {
  const user = await requireAuth();

  const [categories, products] = await Promise.all([
    db.category.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { sortOrder: "asc" },
    }),
    db.product.findMany({
      where: {
        tenantId: user.tenantId,
        isActive: true,
      },
      include: {
        category: true,
        variants: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <POSTerminal
      categories={categories}
      products={products}
      tenantId={user.tenantId}
    />
  );
}
