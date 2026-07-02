const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.create({
    data: {
      name: 'Test User',
    },
  });

  const catalogItems = await prisma.catalog.createMany({
    data: [
      { name: 'Milk 1L', price: 50.0, category: 'Dairy', is_perishable: true, typical_shelf_days: 3 },
      { name: 'Bread', price: 40.0, category: 'Bakery', is_perishable: true, typical_shelf_days: 5 },
      { name: 'Eggs 6 pcs', price: 45.0, category: 'Dairy', is_perishable: true, typical_shelf_days: 14 },
      { name: 'Apples 1kg', price: 150.0, category: 'Produce', is_perishable: true, typical_shelf_days: 7 },
      { name: 'Laundry Detergent', price: 300.0, category: 'Cleaning', is_perishable: false },
      { name: 'Toilet Paper', price: 200.0, category: 'Household', is_perishable: false },
    ],
  });

  const items = await prisma.catalog.findMany();

  // Create some user_item_profiles
  const milk = items.find((i) => i.name.includes('Milk'));
  const bread = items.find((i) => i.name.includes('Bread'));
  const detergent = items.find((i) => i.name.includes('Detergent'));

  // Milk needs a nudge today
  await prisma.userItemProfile.create({
    data: {
      user_id: user.id,
      sku_id: milk.id,
      avg_days_between: 3,
      purchase_count: 5,
      last_purchased_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      next_nudge_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Should've nudged yesterday
      cycle_multiplier: 1.0,
      dismiss_streak: 0,
    }
  });

  // Bread needs a nudge today
  await prisma.userItemProfile.create({
    data: {
      user_id: user.id,
      sku_id: bread.id,
      avg_days_between: 5,
      purchase_count: 3,
      last_purchased_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
      next_nudge_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Should've nudged yesterday
      cycle_multiplier: 1.0,
      dismiss_streak: 0,
    }
  });

  // Detergent doesn't need a nudge (bought 2 days ago, usually every 30 days)
  await prisma.userItemProfile.create({
    data: {
      user_id: user.id,
      sku_id: detergent.id,
      avg_days_between: 30,
      purchase_count: 4,
      last_purchased_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      next_nudge_at: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // Nudge in 28 days
      cycle_multiplier: 1.0,
      dismiss_streak: 0,
    }
  });

  console.log('Seeded successfully with user:', user.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
