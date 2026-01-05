import { NextResponse } from 'next/server';
import { generateSignals } from '@/lib/signals';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const { signals, regime } = await generateSignals();

    // Calculate totals
    const totalAllocation = signals.reduce(
      (sum, s) => sum + (s.targetAllocation || 0),
      0
    );

    const response = {
      signals: signals.map((signal) => ({
        asset: signal.asset,
        signal: signal.signal,
        targetAllocation: signal.targetAllocation,
        conviction: signal.conviction,
        category: signal.category,
        quadrant: signal.quadrant,
      })),
      meta: {
        tier: 'free',
        totalSignals: signals.length,
        totalAllocation,
        cashAllocation: Math.max(0, 1 - totalAllocation),
        timestamp: regime.timestamp,
        isDelayed: false,
        delayHours: 0,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching signals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch signals' },
      { status: 500 }
    );
  }
}
