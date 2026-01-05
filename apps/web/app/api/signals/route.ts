import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { canAccessAsset, getSignalDelay } from '@/lib/tier-config';

export async function GET() {
  try {
    const session = await getSession();
    const tier = session?.user?.tier || 'free';
    const delayHours = getSignalDelay(tier);

    // Fetch all signals
    const signals = await prisma.currentSignal.findMany({
      orderBy: { targetAllocation: 'desc' },
    });

    // Filter by tier access
    const filteredSignals = signals
      .filter((signal) => canAccessAsset(tier, signal.asset))
      .map((signal) => {
        // Apply delay for free tier
        if (delayHours > 0) {
          const signalTime = new Date(signal.timestamp);
          const now = new Date();
          const hoursSinceSignal = (now.getTime() - signalTime.getTime()) / (1000 * 60 * 60);

          if (hoursSinceSignal < delayHours) {
            // Show previous signal if within delay window
            return {
              ...signal,
              signal: signal.previousSignal || 'NEUTRAL',
              isDelayed: true,
              availableAt: new Date(signalTime.getTime() + delayHours * 60 * 60 * 1000),
            };
          }
        }

        return {
          asset: signal.asset,
          signal: signal.signal,
          targetAllocation: signal.targetAllocation,
          conviction: signal.conviction,
          category: signal.category,
          quadrant: signal.quadrant,
          previousSignal: signal.previousSignal,
          signalChangedAt: signal.signalChangedAt,
          timestamp: signal.timestamp,
        };
      });

    // Calculate totals
    const totalAllocation = filteredSignals.reduce(
      (sum, s) => sum + (s.targetAllocation || 0),
      0
    );

    const response = {
      signals: filteredSignals,
      meta: {
        tier,
        totalSignals: filteredSignals.length,
        totalAllocation,
        cashAllocation: Math.max(0, 1 - totalAllocation),
        timestamp: new Date().toISOString(),
        isDelayed: delayHours > 0,
        delayHours,
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
