import { NextResponse } from 'next/server';
import signalsData from '@/data/signals.json';

export async function GET() {
  try {
    const regime = signalsData.regime;

    const response = {
      quadrant: regime.primaryQuadrant,
      primaryQuadrant: regime.primaryQuadrant,
      secondaryQuadrant: regime.secondaryQuadrant,
      growthDirection: regime.growthDirection,
      inflationDirection: regime.inflationDirection,
      daysInRegime: regime.daysInRegime,
      lastChange: regime.lastChange,
      confidence: regime.confidence,
      timestamp: regime.timestamp,
      quadrantInfo: getQuadrantInfo(regime.primaryQuadrant),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching regime:', error);
    return NextResponse.json(
      { error: 'Failed to fetch regime data' },
      { status: 500 }
    );
  }
}

function getQuadrantInfo(quadrant: string) {
  const info: Record<string, { name: string; description: string; color: string }> = {
    Q1: {
      name: 'Goldilocks',
      description: 'Growth rising, inflation falling. Risk-on environment favoring growth assets.',
      color: '#22c55e',
    },
    Q2: {
      name: 'Reflation',
      description: 'Growth rising, inflation rising. Commodities and value stocks outperform.',
      color: '#f97316',
    },
    Q3: {
      name: 'Stagflation',
      description: 'Growth falling, inflation rising. Defensive positioning with inflation hedges.',
      color: '#ef4444',
    },
    Q4: {
      name: 'Deflation',
      description: 'Growth falling, inflation falling. Flight to quality, bonds outperform.',
      color: '#3b82f6',
    },
  };

  return info[quadrant] || { name: quadrant, description: '', color: '#6b7280' };
}
