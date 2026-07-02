import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const items = await prisma.catalog.findMany();
  return NextResponse.json({ items });
}
