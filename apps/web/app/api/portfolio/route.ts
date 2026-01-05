import { NextResponse } from 'next/server';
import { generateSignals } from '@/lib/signals';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    // Get portfolio size from query param (optional)
    const { searchParams } = new URL(request.url);
    const portfolioSize = parseFloat(searchParams.get('size') || '10000');

    const { signals, regime, totalLeverage, excludedBelowEma } = await generateSignals();

    // Build portfolio positions (already sorted by weight from generateSignals)
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

    const response = {
      portfolioSize,
      totalLeverage: Math.round(totalLeverage * 100) / 100,
      numPositions: positions.length,
      positions,
      categoryAllocations,
      regime: {
        primaryQuadrant: regime.primaryQuadrant,
        secondaryQuadrant: regime.secondaryQuadrant,
        quadrantScores: regime.quadrantScores,
      },
      excludedBelowEma: Object.entries(excludedBelowEma).map(([ticker, info]) => ({
        ticker,
        price: Math.round(info.price * 100) / 100,
        ema: Math.round(info.ema * 100) / 100,
        pctBelowEma: Math.round(((info.price - info.ema) / info.ema) * 10000) / 100,
      })),
      timestamp: regime.timestamp,
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
