import { NextResponse } from 'next/server';
import signalsData from '@/data/signals.json';

export async function GET(request: Request) {
  try {
    // Get portfolio size from query param (optional)
    const { searchParams } = new URL(request.url);
    const portfolioSize = parseFloat(searchParams.get('size') || '10000');

    const signals = signalsData.signals;
    const regime = signalsData.regime;

    // Build portfolio positions
    const positions = signals
      .filter((s) => s.targetAllocation > 0)
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
        conviction: '-',
        category: 'stable',
        quadrant: '-',
      });
    }

    const response = {
      portfolioSize,
      totalAllocated,
      cashAllocation,
      positions,
      categoryAllocations,
      regime: {
        quadrant: regime.primaryQuadrant,
        secondaryQuadrant: regime.secondaryQuadrant,
        daysInRegime: regime.daysInRegime,
      },
      timestamp: signalsData.generatedAt,
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
