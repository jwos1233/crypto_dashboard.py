import yahooFinance from 'yahoo-finance2';

// Quadrant allocations - maps quadrant to assets and their base weights
export const QUAD_ALLOCATIONS: Record<string, Record<string, number>> = {
  Q1: {
    QQQ: 0.24,
    ARKK: 0.18,
    IWM: 0.09,
    IBIT: 0.06,
    XLC: 0.075,
    XLY: 0.075,
    TLT: 0.05,
    LQD: 0.05,
  },
  Q2: {
    XLE: 0.07,
    DBC: 0.07,
    GCC: 0.07,
    XLF: 0.10,
    XLI: 0.10,
    XLB: 0.10,
    XOP: 0.05,
    VNQ: 0.05,
    VTV: 0.05,
  },
  Q3: {
    FCG: 0.083,
    XLE: 0.083,
    XOP: 0.084,
    GLD: 0.036,
    DBC: 0.036,
    DBA: 0.036,
    TIP: 0.10,
    VNQ: 0.05,
    XLV: 0.05,
    XLU: 0.05,
  },
  Q4: {
    VGLT: 0.25,
    IEF: 0.25,
    LQD: 0.10,
    MUB: 0.10,
    XLU: 0.0375,
    XLP: 0.0375,
    XLV: 0.0375,
  },
};

// Quadrant indicators for momentum scoring
export const QUAD_INDICATORS: Record<string, string[]> = {
  Q1: ['QQQ', 'VUG', 'IWM'],
  Q2: ['XLE', 'DBC', 'GCC'],
  Q3: ['GLD', 'DBC', 'DBA'],
  Q4: ['TLT', 'XLU'],
};

// Quadrant info
export const QUADRANT_INFO: Record<string, { name: string; growthDirection: string; inflationDirection: string }> = {
  Q1: { name: 'Goldilocks', growthDirection: 'rising', inflationDirection: 'falling' },
  Q2: { name: 'Reflation', growthDirection: 'rising', inflationDirection: 'rising' },
  Q3: { name: 'Stagflation', growthDirection: 'falling', inflationDirection: 'rising' },
  Q4: { name: 'Deflation', growthDirection: 'falling', inflationDirection: 'falling' },
};

interface HistoricalData {
  date: Date;
  close: number;
}

interface QuadrantScores {
  [quad: string]: number;
}

interface Signal {
  asset: string;
  signal: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
  targetAllocation: number;
  conviction: 'high' | 'medium' | 'low';
  category: string;
  quadrant: string;
}

interface RegimeData {
  primaryQuadrant: string;
  secondaryQuadrant: string;
  growthDirection: string;
  inflationDirection: string;
  confidence: number;
  timestamp: string;
  quadrantScores: QuadrantScores;
}

// Cache for market data (5 minute TTL)
let dataCache: {
  data: Map<string, HistoricalData[]>;
  timestamp: number;
} | null = null;

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchHistoricalData(ticker: string, days: number = 100): Promise<HistoricalData[]> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await yahooFinance.historical(ticker, {
      period1: startDate,
      period2: endDate,
      interval: '1d',
    });

    return result.map((item) => ({
      date: item.date,
      close: item.close,
    }));
  } catch (error) {
    console.error(`Error fetching ${ticker}:`, error);
    return [];
  }
}

async function fetchAllData(): Promise<Map<string, HistoricalData[]>> {
  // Check cache
  if (dataCache && Date.now() - dataCache.timestamp < CACHE_TTL) {
    return dataCache.data;
  }

  // Get all unique tickers
  const allTickers = new Set<string>();
  Object.values(QUAD_ALLOCATIONS).forEach((assets) => {
    Object.keys(assets).forEach((ticker) => allTickers.add(ticker));
  });
  Object.values(QUAD_INDICATORS).forEach((indicators) => {
    indicators.forEach((ticker) => allTickers.add(ticker));
  });

  // Add VUG for Q1 indicator
  allTickers.add('VUG');

  const data = new Map<string, HistoricalData[]>();

  // Fetch all tickers in parallel
  const fetchPromises = Array.from(allTickers).map(async (ticker) => {
    const historicalData = await fetchHistoricalData(ticker, 100);
    if (historicalData.length > 0) {
      data.set(ticker, historicalData);
    }
  });

  await Promise.all(fetchPromises);

  // Update cache
  dataCache = { data, timestamp: Date.now() };

  return data;
}

function calculateMomentum(data: HistoricalData[], days: number = 20): number {
  if (data.length < days + 1) return 0;

  const currentPrice = data[data.length - 1].close;
  const pastPrice = data[data.length - 1 - days].close;

  return ((currentPrice - pastPrice) / pastPrice) * 100;
}

function calculateEMA(data: HistoricalData[], period: number = 50): number {
  if (data.length < period) return 0;

  const multiplier = 2 / (period + 1);
  let ema = data[0].close;

  for (let i = 1; i < data.length; i++) {
    ema = (data[i].close - ema) * multiplier + ema;
  }

  return ema;
}

function calculateVolatility(data: HistoricalData[], days: number = 30): number {
  if (data.length < days + 1) return 0;

  const returns: number[] = [];
  const recentData = data.slice(-days - 1);

  for (let i = 1; i < recentData.length; i++) {
    const ret = (recentData[i].close - recentData[i - 1].close) / recentData[i - 1].close;
    returns.push(ret);
  }

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);

  return stdDev * Math.sqrt(252); // Annualized
}

export async function calculateQuadrantScores(): Promise<QuadrantScores> {
  const data = await fetchAllData();
  const scores: QuadrantScores = {};

  for (const [quad, indicators] of Object.entries(QUAD_INDICATORS)) {
    const momentums: number[] = [];

    for (const ticker of indicators) {
      const tickerData = data.get(ticker);
      if (tickerData && tickerData.length > 20) {
        const momentum = calculateMomentum(tickerData, 20);
        momentums.push(momentum);
      }
    }

    scores[quad] = momentums.length > 0
      ? momentums.reduce((a, b) => a + b, 0) / momentums.length
      : 0;
  }

  return scores;
}

export async function getTopQuadrants(): Promise<[string, string]> {
  const scores = await calculateQuadrantScores();
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return [sorted[0][0], sorted[1][0]];
}

export async function generateSignals(): Promise<{ regime: RegimeData; signals: Signal[] }> {
  const data = await fetchAllData();
  const scores = await calculateQuadrantScores();
  const [top1, top2] = await getTopQuadrants();

  const info = QUADRANT_INFO[top1];

  // Calculate confidence based on score spread
  const sortedScores = Object.values(scores).sort((a, b) => b - a);
  const scoreDiff = Math.abs(sortedScores[0] - sortedScores[1]);
  const confidence = Math.min(0.95, 0.5 + scoreDiff / 20);

  const regime: RegimeData = {
    primaryQuadrant: top1,
    secondaryQuadrant: top2,
    growthDirection: info.growthDirection,
    inflationDirection: info.inflationDirection,
    confidence: Math.round(confidence * 100) / 100,
    timestamp: new Date().toISOString(),
    quadrantScores: scores,
  };

  // Calculate target weights for top 2 quadrants
  const weights: Record<string, number> = {};
  const BASE_LEVERAGE = 1.5;

  for (const quad of [top1, top2]) {
    const quadAssets = QUAD_ALLOCATIONS[quad];
    const quadVols: Record<string, number> = {};

    // Calculate volatilities for assets in this quad
    for (const ticker of Object.keys(quadAssets)) {
      const tickerData = data.get(ticker);
      if (tickerData && tickerData.length > 30) {
        const vol = calculateVolatility(tickerData, 30);
        if (vol > 0) {
          quadVols[ticker] = vol;
        }
      }
    }

    // Apply volatility weighting
    const totalVol = Object.values(quadVols).reduce((a, b) => a + b, 0);
    if (totalVol > 0) {
      for (const [ticker, vol] of Object.entries(quadVols)) {
        const volWeight = (vol / totalVol) * BASE_LEVERAGE;

        // Apply EMA filter
        const tickerData = data.get(ticker);
        if (tickerData && tickerData.length > 50) {
          const currentPrice = tickerData[tickerData.length - 1].close;
          const ema = calculateEMA(tickerData, 50);

          if (currentPrice > ema) {
            weights[ticker] = (weights[ticker] || 0) + volWeight;
          }
        }
      }
    }
  }

  // Limit to top 10 positions
  const sortedWeights = Object.entries(weights)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Normalize weights
  const totalWeight = sortedWeights.reduce((sum, [, w]) => sum + w, 0);

  const signals: Signal[] = sortedWeights.map(([ticker, weight]) => {
    const normalizedWeight = totalWeight > 0 ? weight / totalWeight : 0;

    // Determine which quadrant this asset belongs to
    let assetQuad = 'unknown';
    for (const [quad, assets] of Object.entries(QUAD_ALLOCATIONS)) {
      if (ticker in assets) {
        assetQuad = quad;
        break;
      }
    }

    return {
      asset: ticker,
      signal: normalizedWeight >= 0.05 ? 'BULLISH' : 'NEUTRAL',
      targetAllocation: Math.round(normalizedWeight * 10000) / 10000,
      conviction: normalizedWeight >= 0.15 ? 'high' : normalizedWeight >= 0.08 ? 'medium' : 'low',
      category: getAssetCategory(ticker),
      quadrant: assetQuad,
    };
  });

  return { regime, signals };
}

function getAssetCategory(ticker: string): string {
  const categories: Record<string, string> = {
    QQQ: 'growth', ARKK: 'growth', IWM: 'growth', VUG: 'growth',
    XLC: 'growth', XLY: 'growth',
    IBIT: 'crypto', ETHA: 'crypto',
    TLT: 'bonds', LQD: 'bonds', IEF: 'bonds', VGLT: 'bonds',
    MUB: 'bonds', TIP: 'bonds', VTIP: 'bonds',
    XLE: 'commodities', DBC: 'commodities', GCC: 'commodities',
    GLD: 'commodities', DBA: 'commodities',
    XOP: 'energy', FCG: 'energy',
    XLF: 'cyclicals', XLI: 'cyclicals', XLB: 'cyclicals',
    XLU: 'defensive', XLP: 'defensive', XLV: 'defensive',
    VNQ: 'real_assets', VTV: 'value',
  };
  return categories[ticker] || 'other';
}
