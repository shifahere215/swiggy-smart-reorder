import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  const { sessionEventId, label, skusPurchased } = await request.json(); // label is string | null, skusPurchased is string[]

  if (!sessionEventId) {
    return NextResponse.json({ error: 'Missing sessionEventId' }, { status: 400 });
  }

  const sessionEvent = await prisma.sessionEvent.findUnique({
    where: { id: sessionEventId }
  });

  if (!sessionEvent) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

  if (sessionEvent.is_incognito) {
    // Fulfill normally, no model updates
    return NextResponse.json({ success: true, message: 'Order fulfilled incognito' });
  }

  if (label) {
    // Record anomaly session
    const nudgesPausedUntil = new Date();
    nudgesPausedUntil.setHours(nudgesPausedUntil.getHours() + 48);

    const anomaly = await prisma.anomalySession.create({
      data: {
        user_id: sessionEvent.user_id,
        session_event_id: sessionEvent.id,
        label,
        skus_purchased: JSON.stringify(skusPurchased || []),
        nudges_paused_until: nudgesPausedUntil
      }
    });

    await prisma.sessionEvent.update({
      where: { id: sessionEvent.id },
      data: { anomaly_session_id: anomaly.id }
    });
  }

  // Update user_item_profiles for purchased SKUs (unless incognito)
  if (skusPurchased && skusPurchased.length > 0) {
    const profiles = await prisma.userItemProfile.findMany({
      where: { user_id: sessionEvent.user_id, sku_id: { in: skusPurchased } }
    });

    for (const skuId of skusPurchased) {
      const profile = profiles.find(p => p.sku_id === skuId);
      const now = new Date();
      if (profile) {
        // Update existing
        const daysSinceLast = (now.getTime() - new Date(profile.last_purchased_at).getTime()) / (1000 * 60 * 60 * 24);
        
        // Simple rolling average: 70% old, 30% new
        const newAvg = (profile.avg_days_between * 0.7) + (daysSinceLast * 0.3);
        const nextNudgeAt = new Date(now);
        nextNudgeAt.setDate(nextNudgeAt.getDate() + newAvg);

        await prisma.userItemProfile.update({
          where: { id: profile.id },
          data: {
            avg_days_between: newAvg,
            last_purchased_at: now,
            purchase_count: profile.purchase_count + 1,
            next_nudge_at: nextNudgeAt,
            dismiss_streak: 0,
            cycle_multiplier: 1.0
          }
        });
      } else {
        // Create new
        const nextNudgeAt = new Date(now);
        nextNudgeAt.setDate(nextNudgeAt.getDate() + 7); // Default 7 days
        await prisma.userItemProfile.create({
          data: {
            user_id: sessionEvent.user_id,
            sku_id: skuId,
            avg_days_between: 7,
            last_purchased_at: now,
            purchase_count: 1,
            next_nudge_at: nextNudgeAt
          }
        });
      }
    }
  }

  return NextResponse.json({ success: true });
}
