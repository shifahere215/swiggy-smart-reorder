import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let userId = searchParams.get('userId');
  
  if (!userId) {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ nudges: [] });
    userId = user.id;
  }
  
  // Check if nudges are paused due to an anomaly session
  const activeAnomaly = await prisma.anomalySession.findFirst({
    where: {
      user_id: userId,
      nudges_paused_until: { gt: new Date() }
    },
    orderBy: { created_at: 'desc' }
  });

  if (activeAnomaly) {
    return NextResponse.json({ nudges: [], activeAnomaly: activeAnomaly.label });
  }

  // Find nudge-eligible items
  const profiles = await prisma.userItemProfile.findMany({
    where: {
      user_id: userId,
      purchase_count: { gte: 3 },
      next_nudge_at: { lte: new Date() }
    },
    include: { catalog: true },
    orderBy: { next_nudge_at: 'asc' },
    take: 3
  });

  // Calculate urgency score
  const now = new Date().getTime();
  const nudgesWithScore = profiles.map(p => {
    const daysSince = (now - new Date(p.last_purchased_at).getTime()) / (1000 * 60 * 60 * 24);
    const score = daysSince / (p.avg_days_between * p.cycle_multiplier);
    return { ...p, daysSince: Math.floor(daysSince), score };
  }).sort((a, b) => b.score - a.score);

  return NextResponse.json({ nudges: nudgesWithScore });
}
