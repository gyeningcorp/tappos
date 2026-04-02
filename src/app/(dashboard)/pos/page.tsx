import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { POSTerminal } from "@/components/pos/pos-terminal";

export default async function POSPage() {
  const user = await requireAuth();

  const [categories, products, tenant] = await Promise.all([
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
    user.tenantId
      ? db.tenant.findUnique({
          where: { id: user.tenantId },
          select: { name: true },
        })
      : null,
  ]);

  return (
    <POSTerminal
      categories={categories}
      products={products}
      tenantId={user.tenantId}
      merchantName={tenant?.name ?? "Store"}
      cashierName={user.name ?? "Cashier"}
    />
  );
}
