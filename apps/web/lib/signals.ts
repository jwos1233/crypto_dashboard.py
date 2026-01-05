import yahooFinance from 'yahoo-finance2';

// Suppress yahoo-finance2 validation warnings
yahooFinance.setGlobalConfig({ validation: { logErrors: false } });

// EXACT copy from config.py - QUAD_ALLOCATIONS
export const QUAD_ALLOCATIONS: Record<string, Record<string, number>> = {
  Q1: {
    QQQ: 0.60 * 0.40,      // 40% of 60% Growth
    ARKK: 0.60 * 0.30,     // 30% of 60% Growth
    IWM: 0.60 * 0.15,      // 15% of 60% Growth (Small Caps)
    IBIT: 0.60 * 0.10,     // 10% of 60% Growth (Bitcoin ETF)
    ETHA: 0.60 * 0.05,     // 5% of 60% Growth (Ethereum ETF)
    XLC: 0.15 * 0.50,      // 50% of 15% Consumer Disc
    XLY: 0.15 * 0.50,      // 50% of 15% Consumer Disc
    TLT: 0.10 * 0.50,      // 50% of 10% Bonds
    LQD: 0.10 * 0.50,      // 50% of 10% Bonds
  },
  Q2: {
    XLE: 0.35 * 0.20,      // 20% of 35% Commodities
    DBC: 0.35 * 0.20,      // 20% of 35% Commodities
    GCC: 0.35 * 0.20,      // 20% of 35% Commodities
    LIT: 0.35 * 0.10,      // 10% of 35% Commodities (Lithium)
    AA: 0.35 * 0.10,       // 10% of 35% Commodities (Alcoa)
    PALL: 0.35 * 0.10,     // 10% of 35% Commodities (Palladium)
    VALT: 0.35 * 0.10,     // 10% of 35% Commodities (Treasury collateral)
    XLF: 0.30 * 0.333,     // 33% of 30% Cyclicals
    XLI: 0.30 * 0.333,     // 33% of 30% Cyclicals
    XLB: 0.30 * 0.334,     // 34% of 30% Cyclicals
    XOP: 0.15 * 0.333,     // 33% of 15% Energy
    FCG: 0.15 * 0.333,     // 33% of 15% Energy
    USO: 0.15 * 0.334,     // 34% of 15% Energy (Crude Oil)
    VNQ: 0.10 * 0.50,      // 50% of 10% Real Assets
    PAVE: 0.10 * 0.50,     // 50% of 10% Real Assets
    VTV: 0.10 * 0.50,      // 50% of 10% Value
    IWD: 0.10 * 0.50,      // 50% of 10% Value
  },
  Q3: {
    FCG: 0.25 * 0.333,     // 33% of 25% Energy
    XLE: 0.25 * 0.333,     // 33% of 25% Energy
    XOP: 0.25 * 0.334,     // 34% of 25% Energy
    GLD: 0.30 * 0.12,      // 12% of 30% Commodities
    DBC: 0.30 * 0.12,      // 12% of 30% Commodities
    DBA: 0.30 * 0.12,      // 12% of 30% Commodities
    REMX: 0.30 * 0.12,     // 12% of 30% Commodities
    URA: 0.30 * 0.12,      // 12% of 30% Commodities (Uranium)
    LIT: 0.30 * 0.10,      // 10% of 30% Commodities (Lithium)
    AA: 0.30 * 0.10,       // 10% of 30% Commodities (Alcoa)
    PALL: 0.30 * 0.10,     // 10% of 30% Commodities (Palladium)
    VALT: 0.30 * 0.10,     // 10% of 30% Commodities (Treasury collateral)
    TIP: 0.20 * 0.50,      // 50% of 20% TIPS
    VTIP: 0.20 * 0.50,     // 50% of 20% TIPS
    VNQ: 0.10 * 0.50,      // 50% of 10% Real Assets
    PAVE: 0.10 * 0.50,     // 50% of 10% Real Assets
    XLV: 0.15 * 0.333,     // 33% of 15% Equities
    XLU: 0.15 * 0.333,     // 33% of 15% Equities
  },
  Q4: {
    VGLT: 0.50 * 0.50,     // 50% of 50% Long Duration
    IEF: 0.50 * 0.50,      // 50% of 50% Long Duration
    LQD: 0.20 * 0.50,      // 50% of 20% IG Credit
    MUB: 0.20 * 0.50,      // 50% of 20% IG Credit
    XLU: 0.15 * 0.25,      // 25% of 15% Defensive
    XLP: 0.15 * 0.25,      // 25% of 15% Defensive
    XLV: 0.15 * 0.25,      // 25% of 15% Defensive
  },
};

// EXACT copy from config.py - QUAD_INDICATORS
export const QUAD_INDICATORS: Record<string, string[]> = {
  Q1: ['QQQ', 'VUG', 'IWM', 'BTC-USD'],
  Q2: ['XLE', 'DBC', 'GCC', 'LIT'],
  Q3: ['GLD', 'DBC', 'DBA', 'REMX', 'URA', 'LIT'],
  Q4: ['TLT', 'XLU', 'VIXY'],
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

    if (!result || result.length === 0) {
      return [];
    }

    return result.map((item) => ({
      date: item.date,
      close: item.close ?? item.adjClose ?? 0,
    })).filter(item => item.close > 0);
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

  const data = new Map<string, HistoricalData[]>();

  // Fetch tickers in parallel batches to speed up
  const tickers = Array.from(allTickers);
  const batchSize = 5;

  for (let i = 0; i < tickers.length; i += batchSize) {
    const batch = tickers.slice(i, i + batchSize);
    const promises = batch.map(async (ticker) => {
      const historicalData = await fetchHistoricalData(ticker, 100);
      if (historicalData.length > 0) {
        data.set(ticker, historicalData);
      }
    });
    await Promise.all(promises);
    // Small delay between batches
    if (i + batchSize < tickers.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  // Update cache if we got data
  if (data.size > 0) {
    dataCache = { data, timestamp: Date.now() };
  }

  return data;
}

function calculateMomentum(data: HistoricalData[], days: number = 20): number {
  if (data.length < days + 1) return 0;

  const currentPrice = data[data.length - 1].close;
  const pastPrice = data[data.length - 1 - days].close;

  if (pastPrice === 0) return 0;
  return ((currentPrice - pastPrice) / pastPrice) * 100;
}

function calculateVolatility(data: HistoricalData[], days: number = 30): number {
  if (data.length < days + 1) return 0.2;

  const returns: number[] = [];
  const recentData = data.slice(-days - 1);

  for (let i = 1; i < recentData.length; i++) {
    if (recentData[i - 1].close > 0) {
      const ret = (recentData[i].close - recentData[i - 1].close) / recentData[i - 1].close;
      returns.push(ret);
    }
  }

  if (returns.length === 0) return 0.2;

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);

  return stdDev * Math.sqrt(252); // Annualized
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

export async function calculateQuadrantScores(): Promise<QuadrantScores> {
  const data = await fetchAllData();
  const scores: QuadrantScores = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };

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

export async function generateSignals(): Promise<{ regime: RegimeData; signals: Signal[] }> {
  const data = await fetchAllData();
  const scores = await calculateQuadrantScores();

  // Sort to get top quadrants
  const sortedQuads = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const top1 = sortedQuads[0][0];
  const top2 = sortedQuads[1][0];

  const info = QUADRANT_INFO[top1];

  // Calculate confidence based on score spread
  const scoreDiff = Math.abs(sortedQuads[0][1] - sortedQuads[1][1]);
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
  // Using volatility chasing like the Python code
  const weights: Record<string, number> = {};
  const BASE_LEVERAGE = 1.5; // Same as Python

  for (const quad of [top1, top2]) {
    const quadAssets = QUAD_ALLOCATIONS[quad];
    if (!quadAssets) continue;

    const quadVols: Record<string, number> = {};

    // Calculate volatilities for assets in this quad
    for (const ticker of Object.keys(quadAssets)) {
      const tickerData = data.get(ticker);
      if (tickerData && tickerData.length > 30) {
        const vol = calculateVolatility(tickerData, 30);
        if (vol > 0) {
          quadVols[ticker] = vol;
        }
      } else {
        // Use default volatility if no data
        quadVols[ticker] = 0.2;
      }
    }

    // Apply volatility weighting (volatility chasing - higher vol = higher weight)
    const totalVol = Object.values(quadVols).reduce((a, b) => a + b, 0);
    if (totalVol > 0) {
      for (const [ticker, vol] of Object.entries(quadVols)) {
        const volWeight = (vol / totalVol) * BASE_LEVERAGE;

        // Apply EMA filter - only allocate if price > EMA
        const tickerData = data.get(ticker);
        if (tickerData && tickerData.length > 50) {
          const currentPrice = tickerData[tickerData.length - 1].close;
          const ema = calculateEMA(tickerData, 50);

          if (currentPrice > ema) {
            weights[ticker] = (weights[ticker] || 0) + volWeight;
          }
        } else {
          // If no data for EMA, still include with weight
          weights[ticker] = (weights[ticker] || 0) + volWeight;
        }
      }
    }
  }

  // Limit to top 10 positions (max_positions=10 in Python)
  const sortedWeights = Object.entries(weights)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Re-normalize to maintain total leverage
  const originalTotal = Object.values(weights).reduce((a, b) => a + b, 0);
  const newTotal = sortedWeights.reduce((sum, [, w]) => sum + w, 0);
  const scaleFactor = newTotal > 0 ? originalTotal / newTotal : 1;

  const signals: Signal[] = sortedWeights.map(([ticker, weight]) => {
    const scaledWeight = weight * scaleFactor;
    const totalLeverage = sortedWeights.reduce((sum, [, w]) => sum + w * scaleFactor, 0);
    const normalizedWeight = totalLeverage > 0 ? scaledWeight / totalLeverage : 0;

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
      signal: scaledWeight >= 0.05 ? 'BULLISH' as const : 'NEUTRAL' as const,
      targetAllocation: Math.round(scaledWeight * 10000) / 10000,
      conviction: normalizedWeight >= 0.15 ? 'high' as const : normalizedWeight >= 0.08 ? 'medium' as const : 'low' as const,
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
    GLD: 'commodities', DBA: 'commodities', LIT: 'commodities',
    AA: 'commodities', PALL: 'commodities', VALT: 'commodities',
    REMX: 'commodities', URA: 'commodities',
    XOP: 'energy', FCG: 'energy', USO: 'energy',
    XLF: 'cyclicals', XLI: 'cyclicals', XLB: 'cyclicals',
    XLU: 'defensive', XLP: 'defensive', XLV: 'defensive',
    VNQ: 'real_assets', PAVE: 'real_assets',
    VTV: 'value', IWD: 'value',
  };
  return categories[ticker] || 'other';
}
