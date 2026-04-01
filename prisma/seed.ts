import { PrismaClient, Role, Plan, PaymentMethod, OrderStatus } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding TapPOS database...\n");

  // Clean existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.inventoryAlert.deleteMany();
  await prisma.variant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  // Create demo tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: "Demo Coffee Shop",
      slug: "demo-coffee-shop",
      plan: Plan.PRO,
      onboardingStep: 4,
      isActive: true,
    },
  });
  console.log(`✅ Tenant: ${tenant.name}`);

  // Create users
  const passwordHash = await hash("password123", 12);

  const owner = await prisma.user.create({
    data: {
      email: "owner@demo.com",
      name: "Sarah Chen",
      passwordHash,
      role: Role.OWNER,
      tenantId: tenant.id,
      emailVerified: new Date(),
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: "manager@demo.com",
      name: "Mike Johnson",
      passwordHash,
      role: Role.MANAGER,
      tenantId: tenant.id,
      emailVerified: new Date(),
    },
  });

  const cashier = await prisma.user.create({
    data: {
      email: "cashier@demo.com",
      name: "Alex Rivera",
      passwordHash,
      role: Role.CASHIER,
      tenantId: tenant.id,
      emailVerified: new Date(),
    },
  });
  console.log(`✅ Users: owner@demo.com, manager@demo.com, cashier@demo.com (password: password123)`);

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: { name: "Hot Drinks", color: "#ef4444", sortOrder: 0, tenantId: tenant.id },
    }),
    prisma.category.create({
      data: { name: "Cold Drinks", color: "#3b82f6", sortOrder: 1, tenantId: tenant.id },
    }),
    prisma.category.create({
      data: { name: "Pastries", color: "#f59e0b", sortOrder: 2, tenantId: tenant.id },
    }),
    prisma.category.create({
      data: { name: "Sandwiches", color: "#10b981", sortOrder: 3, tenantId: tenant.id },
    }),
    prisma.category.create({
      data: { name: "Snacks", color: "#8b5cf6", sortOrder: 4, tenantId: tenant.id },
    }),
  ]);
  console.log(`✅ Categories: ${categories.length} created`);

  // Create products with variants
  const products = await Promise.all([
    // Hot Drinks
    prisma.product.create({
      data: {
        name: "Espresso",
        description: "Rich, bold single shot espresso",
        price: 350,
        stock: 999,
        trackStock: false,
        sku: "HD-001",
        tenantId: tenant.id,
        categoryId: categories[0].id,
        variants: {
          create: [
            { name: "Single", type: "Size", price: 350, stock: 999 },
            { name: "Double", type: "Size", price: 450, stock: 999 },
          ],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: "Cappuccino",
        description: "Espresso with steamed milk foam",
        price: 495,
        stock: 999,
        trackStock: false,
        sku: "HD-002",
        tenantId: tenant.id,
        categoryId: categories[0].id,
        variants: {
          create: [
            { name: "Small", type: "Size", price: 395, stock: 999 },
            { name: "Medium", type: "Size", price: 495, stock: 999 },
            { name: "Large", type: "Size", price: 595, stock: 999 },
          ],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: "Latte",
        description: "Espresso with steamed milk",
        price: 525,
        stock: 999,
        trackStock: false,
        sku: "HD-003",
        tenantId: tenant.id,
        categoryId: categories[0].id,
        variants: {
          create: [
            { name: "Small", type: "Size", price: 425, stock: 999 },
            { name: "Medium", type: "Size", price: 525, stock: 999 },
            { name: "Large", type: "Size", price: 625, stock: 999 },
          ],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: "Americano",
        description: "Espresso diluted with hot water",
        price: 395,
        stock: 999,
        trackStock: false,
        sku: "HD-004",
        tenantId: tenant.id,
        categoryId: categories[0].id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Hot Chocolate",
        description: "Rich chocolate with steamed milk",
        price: 475,
        stock: 999,
        trackStock: false,
        sku: "HD-005",
        tenantId: tenant.id,
        categoryId: categories[0].id,
      },
    }),
    // Cold Drinks
    prisma.product.create({
      data: {
        name: "Iced Latte",
        description: "Espresso with cold milk over ice",
        price: 575,
        stock: 999,
        trackStock: false,
        sku: "CD-001",
        tenantId: tenant.id,
        categoryId: categories[1].id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Cold Brew",
        description: "Slow-steeped for 20 hours",
        price: 525,
        stock: 999,
        trackStock: false,
        sku: "CD-002",
        tenantId: tenant.id,
        categoryId: categories[1].id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Iced Mocha",
        description: "Espresso, chocolate, milk over ice",
        price: 625,
        stock: 999,
        trackStock: false,
        sku: "CD-003",
        tenantId: tenant.id,
        categoryId: categories[1].id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Lemonade",
        description: "Fresh-squeezed lemonade",
        price: 425,
        stock: 50,
        sku: "CD-004",
        tenantId: tenant.id,
        categoryId: categories[1].id,
      },
    }),
    // Pastries
    prisma.product.create({
      data: {
        name: "Croissant",
        description: "Buttery, flaky French pastry",
        price: 375,
        stock: 24,
        lowStockAt: 5,
        sku: "PA-001",
        tenantId: tenant.id,
        categoryId: categories[2].id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Blueberry Muffin",
        description: "Packed with fresh blueberries",
        price: 395,
        stock: 18,
        lowStockAt: 5,
        sku: "PA-002",
        tenantId: tenant.id,
        categoryId: categories[2].id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Chocolate Chip Cookie",
        description: "Warm, gooey chocolate chip cookie",
        price: 295,
        stock: 30,
        lowStockAt: 8,
        sku: "PA-003",
        tenantId: tenant.id,
        categoryId: categories[2].id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Cinnamon Roll",
        description: "Warm cinnamon roll with cream cheese frosting",
        price: 450,
        stock: 12,
        lowStockAt: 4,
        sku: "PA-004",
        tenantId: tenant.id,
        categoryId: categories[2].id,
      },
    }),
    // Sandwiches
    prisma.product.create({
      data: {
        name: "Turkey Club",
        description: "Turkey, bacon, lettuce, tomato on sourdough",
        price: 995,
        stock: 15,
        lowStockAt: 3,
        sku: "SW-001",
        tenantId: tenant.id,
        categoryId: categories[3].id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Grilled Cheese",
        description: "Melted cheddar and gruyere on sourdough",
        price: 795,
        stock: 15,
        lowStockAt: 3,
        sku: "SW-002",
        tenantId: tenant.id,
        categoryId: categories[3].id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Veggie Wrap",
        description: "Hummus, roasted veggies, spinach in a wrap",
        price: 895,
        stock: 12,
        lowStockAt: 3,
        sku: "SW-003",
        tenantId: tenant.id,
        categoryId: categories[3].id,
      },
    }),
    // Snacks
    prisma.product.create({
      data: {
        name: "Granola Bar",
        description: "Oats, honey, and mixed nuts",
        price: 295,
        stock: 40,
        lowStockAt: 10,
        sku: "SN-001",
        tenantId: tenant.id,
        categoryId: categories[4].id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Mixed Nuts",
        description: "Premium roasted mixed nuts",
        price: 395,
        stock: 25,
        lowStockAt: 8,
        sku: "SN-002",
        tenantId: tenant.id,
        categoryId: categories[4].id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Fruit Cup",
        description: "Fresh seasonal fruit",
        price: 450,
        stock: 3,
        lowStockAt: 5,
        sku: "SN-003",
        tenantId: tenant.id,
        categoryId: categories[4].id,
      },
    }),
  ]);
  console.log(`✅ Products: ${products.length} created`);

  // Create coupons
  await Promise.all([
    prisma.coupon.create({
      data: {
        code: "WELCOME10",
        type: "PERCENTAGE",
        value: 10,
        maxUses: 100,
        tenantId: tenant.id,
      },
    }),
    prisma.coupon.create({
      data: {
        code: "SAVE5",
        type: "FIXED",
        value: 500,
        minOrder: 2000,
        maxUses: 50,
        tenantId: tenant.id,
      },
    }),
  ]);
  console.log("✅ Coupons: WELCOME10 (10% off), SAVE5 ($5 off orders over $20)");

  // Create sample orders for the past 30 days
  const now = new Date();
  const orders = [];

  for (let daysAgo = 30; daysAgo >= 0; daysAgo--) {
    const ordersPerDay = Math.floor(Math.random() * 15) + 5;

    for (let i = 0; i < ordersPerDay; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - daysAgo);
      date.setHours(Math.floor(Math.random() * 12) + 7);
      date.setMinutes(Math.floor(Math.random() * 60));

      const numItems = Math.floor(Math.random() * 4) + 1;
      const selectedProducts = [];
      for (let j = 0; j < numItems; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        selectedProducts.push({
          quantity: Math.floor(Math.random() * 3) + 1,
          price: product.price,
          name: product.name,
          productId: product.id,
        });
      }

      const subtotal = selectedProducts.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const tax = Math.round(subtotal * 0.08875);
      const total = subtotal + tax;

      const paymentMethod: PaymentMethod =
        Math.random() > 0.3
          ? Math.random() > 0.5
            ? "CARD"
            : "TAP"
          : "CASH";

      const cashReceived =
        paymentMethod === "CASH"
          ? Math.ceil(total / 100) * 100 + (Math.floor(Math.random() * 5) * 100)
          : null;

      orders.push(
        prisma.order.create({
          data: {
            orderNumber: `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${daysAgo}-${i}`,
            status: OrderStatus.COMPLETED,
            subtotal,
            tax,
            total,
            paymentMethod,
            cashReceived,
            changeGiven: cashReceived ? cashReceived - total : null,
            tenantId: tenant.id,
            userId: [owner.id, manager.id, cashier.id][Math.floor(Math.random() * 3)],
            createdAt: date,
            items: {
              create: selectedProducts,
            },
          },
        })
      );
    }
  }

  // Process in batches to avoid overwhelming the database
  const batchSize = 50;
  for (let i = 0; i < orders.length; i += batchSize) {
    await Promise.all(orders.slice(i, i + batchSize));
  }
  console.log(`✅ Orders: ${orders.length} sample orders created (last 30 days)`);

  // Create low stock alerts
  const lowStockProducts = products.filter(
    (p) => p.stock <= (p.lowStockAt || 5) && p.trackStock
  );
  for (const product of lowStockProducts) {
    await prisma.inventoryAlert.create({
      data: {
        productName: product.name,
        productId: product.id,
        currentStock: product.stock,
        threshold: product.lowStockAt,
        tenantId: tenant.id,
      },
    });
  }
  console.log(`✅ Alerts: ${lowStockProducts.length} low-stock alerts created`);

  console.log("\n🎉 Seed complete! Login with owner@demo.com / password123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
