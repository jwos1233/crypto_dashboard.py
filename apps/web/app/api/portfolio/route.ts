import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { canAccessAsset, canAccessFeature, getSignalDelay } from '@/lib/tier-config';

export async function GET(request: Request) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const tier = session.user.tier || 'free';

    // Check if tier has portfolio access
    if (!canAccessFeature(tier, 'modelPortfolio')) {
      return NextResponse.json(
        {
          error: 'Portfolio access requires Starter tier or higher',
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }

    // Get portfolio size from query param (optional)
    const { searchParams } = new URL(request.url);
    const portfolioSize = parseFloat(searchParams.get('size') || '10000');

    // Fetch signals
    const signals = await prisma.currentSignal.findMany({
      orderBy: { targetAllocation: 'desc' },
    });

    // Fetch current regime
    const regime = await prisma.currentRegime.findFirst({
      orderBy: { timestamp: 'desc' },
    });

    // Build portfolio positions
    const positions = signals
      .filter((s) => s.targetAllocation > 0)
      .filter((s) => canAccessAsset(tier, s.asset))
      .map((signal) => {
        const dollarAmount = signal.targetAllocation * portfolioSize;

        return {
          asset: signal.asset,
          allocation: signal.targetAllocation,
          dollarAmount,
          signal: signal.signal,
          conviction: signal.conviction,
          category: signal.category,
          quadrant: signal.quadrant,
        };
      });

    // Calculate allocations by category
    const categoryAllocations: Record<string, number> = {};
    positions.forEach((pos) => {
      const cat = pos.category || 'other';
      categoryAllocations[cat] = (categoryAllocations[cat] || 0) + pos.allocation;
    });

    // Calculate cash position
    const totalAllocated = positions.reduce((sum, p) => sum + p.allocation, 0);
    const cashAllocation = Math.max(0, 1 - totalAllocated);

    if (cashAllocation > 0) {
      positions.push({
        asset: 'USDC',
        allocation: cashAllocation,
        dollarAmount: cashAllocation * portfolioSize,
        signal: 'HOLD',
        conviction: null,
        category: 'stable',
        quadrant: null,
      });
    }

    const response = {
      portfolioSize,
      totalAllocated,
      cashAllocation,
      positions,
      categoryAllocations,
      regime: regime
        ? {
            quadrant: regime.primaryQuadrant,
            secondaryQuadrant: regime.secondaryQuadrant,
            daysInRegime: regime.daysInRegime,
          }
        : null,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio' },
      { status: 500 }
    );
  }
}
