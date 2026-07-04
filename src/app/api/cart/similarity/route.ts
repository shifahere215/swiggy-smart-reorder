import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { createSwiggyMCPClient } from '@/lib/mcpClient';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { userId, cartSkus } = body;

    if (!userId) {
      const user = await prisma.user.findFirst();
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
      userId = user.id;
    }

    // Try Swiggy MCP first if authenticated
    const cookieStore = await cookies();
    const token = cookieStore.get('swiggy_access_token')?.value;
    if (token) {
      try {
        const client = await createSwiggyMCPClient(token, 'instamart');
        // We could call a tool like `check_anomaly_similarity` or similar
        // const result = await client.callTool({ name: 'get_order_history', arguments: {} });
        console.log('Successfully connected to Swiggy MCP for Cart Similarity check.');
      } catch (e) {
        console.error('Swiggy MCP Error in Cart Similarity:', e);
      }
    }

    if (!cartSkus || !Array.isArray(cartSkus) || cartSkus.length === 0) {
      return NextResponse.json({ suggestion: null });
    }

    // Fetch past anomalies
    const anomalies = await prisma.anomalySession.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' }
    });

    for (const anomaly of anomalies) {
      const pastSkus: string[] = JSON.parse(anomaly.skus_purchased);
      
      // Calculate intersection
      const intersection = pastSkus.filter(sku => cartSkus.includes(sku));
      
      // If at least 2 items match, consider it a similar session
      if (intersection.length >= 2) {
        const remainingSkus = pastSkus.filter(sku => !cartSkus.includes(sku));
        
        if (remainingSkus.length > 0) {
          // Fetch catalog info for remaining items
          const remainingItems = await prisma.catalog.findMany({
            where: { id: { in: remainingSkus } }
          });

          const displayName = anomaly.name || (anomaly.label ? `${anomaly.label.charAt(0).toUpperCase() + anomaly.label.slice(1)} Pack` : 'Previous Bulk Order');

          return NextResponse.json({
            suggestion: {
              anomalyId: anomaly.id,
              name: displayName,
              message: `Repeating your ${displayName}? Add the rest of the items!`,
              items: remainingItems
            }
          });
        }
      }
    }

    return NextResponse.json({ suggestion: null });
  } catch (error) {
    console.error('Cart similarity error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
