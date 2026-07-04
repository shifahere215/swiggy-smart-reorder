import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error('No user found');
    return;
  }

  // Add Tea Leaves to catalog
  const tea = await prisma.catalog.create({
    data: { name: 'Tea Leaves', price: 120.0, category: 'Beverages', is_perishable: false, typical_shelf_days: 60 },
  });

  // Add user item profile for mother's tea leaves (needs a nudge today)
  await prisma.userItemProfile.create({
    data: {
      user_id: user.id,
      sku_id: tea.id,
      avg_days_between: 30,
      purchase_count: 5,
      last_purchased_at: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000), // 32 days ago
      next_nudge_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Yesterday
      cycle_multiplier: 1.0,
      dismiss_streak: 0,
      sub_profile: 'mother', // Add sub_profile!
    }
  });

  // Get catalog items for anomaly session
  const items = await prisma.catalog.findMany();
  const bread = items.find((i) => i.name.includes('Bread'));
  const eggs = items.find((i) => i.name.includes('Eggs'));
  const apples = items.find((i) => i.name.includes('Apples'));

  if (!bread || !eggs || !apples) return;

  // Create a SessionEvent to link to AnomalySession
  const sessionEvent = await prisma.sessionEvent.create({
    data: {
      user_id: user.id,
      started_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      anomaly_flagged: true,
      order_value: 500,
      item_count: 10,
    }
  });

  // Add AnomalySession for "House Party"
  await prisma.anomalySession.create({
    data: {
      user_id: user.id,
      session_event_id: sessionEvent.id,
      label: 'party',
      name: 'House Party',
      skus_purchased: JSON.stringify([bread.id, eggs.id, apples.id]),
    }
  });

  console.log('Seeded demo data successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
