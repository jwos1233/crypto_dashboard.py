import { NextResponse } from 'next/server';
import { generateSignals } from '@/lib/signals';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const { signals, regime, totalLeverage, excludedBelowEma } = await generateSignals();

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
        totalLeverage: Math.round(totalLeverage * 100) / 100,
        timestamp: regime.timestamp,
        primaryQuadrant: regime.primaryQuadrant,
        secondaryQuadrant: regime.secondaryQuadrant,
      },
      excludedBelowEma: Object.entries(excludedBelowEma).map(([ticker, info]) => ({
        ticker,
        price: info.price,
        ema: info.ema,
        pctBelowEma: ((info.price - info.ema) / info.ema) * 100,
      })),
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
