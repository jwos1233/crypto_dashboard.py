import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();

    // Public endpoint - but tier affects data freshness
    const regime = await prisma.currentRegime.findFirst({
      orderBy: { timestamp: 'desc' },
    });

    if (!regime) {
      return NextResponse.json(
        { error: 'No regime data available' },
        { status: 404 }
      );
    }

    // Map to API response format
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
      // Add quadrant metadata
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
