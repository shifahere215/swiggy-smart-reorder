import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  const { userId, itemCount, orderValue, isIncognito } = await request.json();
  
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  // Create session event
  const sessionEvent = await prisma.sessionEvent.create({
    data: {
      user_id: userId,
      item_count: itemCount,
      order_value: orderValue,
      is_incognito: isIncognito,
      anomaly_flagged: false
    }
  });

  if (isIncognito) {
    return NextResponse.json({ sessionEventId: sessionEvent.id, isAnomaly: false });
  }

  // Anomaly check: item_count >= 2x 90-day avg
  const pastSessions = await prisma.sessionEvent.findMany({
    where: {
      user_id: userId,
      is_incognito: false,
      started_at: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
    }
  });

  if (pastSessions.length > 0) {
    const validPastSessions = pastSessions.filter(s => s.item_count !== null);
    if (validPastSessions.length > 0) {
      const avgItems = validPastSessions.reduce((sum, s) => sum + (s.item_count || 0), 0) / validPastSessions.length;
      
      if (itemCount >= avgItems * 2) {
        // Flag anomaly
        await prisma.sessionEvent.update({
          where: { id: sessionEvent.id },
          data: { anomaly_flagged: true }
        });
        return NextResponse.json({ sessionEventId: sessionEvent.id, isAnomaly: true });
      }
    }
  }

  return NextResponse.json({ sessionEventId: sessionEvent.id, isAnomaly: false });
}
