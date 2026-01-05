import yahooFinance from 'yahoo-finance2';

// Suppress yahoo-finance2 validation warnings
yahooFinance.setGlobalConfig({ validation: { logErrors: false } });

// EXACT copy from config.py - QUAD_ALLOCATIONS
const QUAD_ALLOCATIONS = {
  Q1: {
    QQQ: 0.60 * 0.40,
    ARKK: 0.60 * 0.30,
    IWM: 0.60 * 0.15,
    IBIT: 0.60 * 0.10,
    ETHA: 0.60 * 0.05,
    XLC: 0.15 * 0.50,
    XLY: 0.15 * 0.50,
    TLT: 0.10 * 0.50,
    LQD: 0.10 * 0.50,
  },
  Q2: {
    XLE: 0.35 * 0.20,
    DBC: 0.35 * 0.20,
    GCC: 0.35 * 0.20,
    LIT: 0.35 * 0.10,
    AA: 0.35 * 0.10,
    PALL: 0.35 * 0.10,
    VALT: 0.35 * 0.10,
    XLF: 0.30 * 0.333,
    XLI: 0.30 * 0.333,
    XLB: 0.30 * 0.334,
    XOP: 0.15 * 0.333,
    FCG: 0.15 * 0.333,
    USO: 0.15 * 0.334,
    VNQ: 0.10 * 0.50,
    PAVE: 0.10 * 0.50,
    VTV: 0.10 * 0.50,
    IWD: 0.10 * 0.50,
  },
  Q3: {
    FCG: 0.25 * 0.333,
    XLE: 0.25 * 0.333,
    XOP: 0.25 * 0.334,
    GLD: 0.30 * 0.12,
    DBC: 0.30 * 0.12,
    DBA: 0.30 * 0.12,
    REMX: 0.30 * 0.12,
    URA: 0.30 * 0.12,
    LIT: 0.30 * 0.10,
    AA: 0.30 * 0.10,
    PALL: 0.30 * 0.10,
    VALT: 0.30 * 0.10,
    TIP: 0.20 * 0.50,
    VTIP: 0.20 * 0.50,
    VNQ: 0.10 * 0.50,
    PAVE: 0.10 * 0.50,
    XLV: 0.15 * 0.333,
    XLU: 0.15 * 0.333,
  },
  Q4: {
    VGLT: 0.50 * 0.50,
    IEF: 0.50 * 0.50,
    LQD: 0.20 * 0.50,
    MUB: 0.20 * 0.50,
    XLU: 0.15 * 0.25,
    XLP: 0.15 * 0.25,
    XLV: 0.15 * 0.25,
  },
};

// From signal_generator.py - simpler indicators for momentum scoring
const QUAD_INDICATORS = {
  Q1: ['QQQ', 'VUG', 'IWM', 'BTC-USD'],
  Q2: ['XLE', 'DBC'],
  Q3: ['GLD', 'LIT'],
  Q4: ['TLT', 'XLU', 'VIXY'],
};

// Leverage by quadrant (Q1 gets 1.5x, others 1.0x)
const QUAD_LEVERAGE = {
  Q1: 1.5,
  Q2: 1.0,
  Q3: 1.0,
  Q4: 1.0,
};

async function fetchHistoricalData(ticker, days = 150) {
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
      console.log(`  [WARN] No data for ${ticker}`);
      return [];
    }

    return result.map((item) => ({
      date: item.date,
      close: item.close ?? item.adjClose ?? 0,
    })).filter(item => item.close > 0);
  } catch (error) {
    console.log(`  [ERROR] ${ticker}: ${error.message}`);
    return [];
  }
}

async function fetchAllData() {
  const allTickers = new Set();
  Object.values(QUAD_ALLOCATIONS).forEach((assets) => {
    Object.keys(assets).forEach((ticker) => allTickers.add(ticker));
  });
  Object.values(QUAD_INDICATORS).forEach((indicators) => {
    indicators.forEach((ticker) => allTickers.add(ticker));
  });

  const data = new Map();
  const tickers = Array.from(allTickers);

  console.log(`Fetching ${tickers.length} tickers...`);

  for (let i = 0; i < tickers.length; i += 5) {
    const batch = tickers.slice(i, i + 5);
    const promises = batch.map(async (ticker) => {
      const historicalData = await fetchHistoricalData(ticker, 150);
      if (historicalData.length > 0) {
        data.set(ticker, historicalData);
      }
    });
    await Promise.all(promises);
    if (i + 5 < tickers.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  console.log(`Got data for ${data.size} tickers\n`);
  return data;
}

function calculateMomentum(data, days = 20) {
  if (data.length < days + 1) return 0;
  const currentPrice = data[data.length - 1].close;
  const pastPrice = data[data.length - 1 - days].close;
  if (pastPrice === 0) return 0;
  return ((currentPrice - pastPrice) / pastPrice) * 100;
}

function calculateVolatility(data, days = 30) {
  // Return 0 if insufficient data (like Python - will be filtered out)
  if (data.length < days + 1) return 0;
  const returns = [];
  const recentData = data.slice(-days - 1);
  for (let i = 1; i < recentData.length; i++) {
    if (recentData[i - 1].close > 0) {
      const ret = (recentData[i].close - recentData[i - 1].close) / recentData[i - 1].close;
      returns.push(ret);
    }
  }
  if (returns.length === 0) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
  return Math.sqrt(variance) * Math.sqrt(252);
}

function calculateEMA(data, period = 50) {
  if (data.length < period) return 0;
  const multiplier = 2 / (period + 1);
  let ema = data[0].close;
  for (let i = 1; i < data.length; i++) {
    ema = (data[i].close - ema) * multiplier + ema;
  }
  return ema;
}

async function main() {
  console.log('=== Testing Signal Generation ===\n');

  const data = await fetchAllData();

  // Calculate quadrant scores
  const scores = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
  for (const [quad, indicators] of Object.entries(QUAD_INDICATORS)) {
    const momentums = [];
    for (const ticker of indicators) {
      const tickerData = data.get(ticker);
      if (tickerData && tickerData.length > 20) {
        const momentum = calculateMomentum(tickerData, 20);
        momentums.push(momentum);
        console.log(`${quad} indicator ${ticker}: ${momentum.toFixed(2)}% momentum`);
      }
    }
    scores[quad] = momentums.length > 0
      ? momentums.reduce((a, b) => a + b, 0) / momentums.length
      : 0;
  }

  console.log('\n=== QUADRANT SCORES ===');
  Object.entries(scores).forEach(([q, s]) => console.log(`${q}: ${s.toFixed(2)}`));

  const sortedQuads = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const top1 = sortedQuads[0][0];
  const top2 = sortedQuads[1][0];

  console.log(`\nTop quadrants: ${top1}, ${top2}`);

  // Generate signals
  const weights = {};

  console.log('\n=== EMA FILTER CHECK ===');
  for (const quad of [top1, top2]) {
    const quadAssets = QUAD_ALLOCATIONS[quad];
    if (!quadAssets) continue;

    // Get leverage for this specific quadrant (Q1=1.5x, others=1.0x)
    const quadLeverage = QUAD_LEVERAGE[quad] || 1.0;
    console.log(`\nProcessing ${quad} with leverage ${quadLeverage}x`);

    // Get tickers with valid data only (like Python)
    // CRITICAL: Need >= 50 days for EMA calculation (not 30!)
    const quadTickers = Object.keys(quadAssets).filter(ticker => {
      const tickerData = data.get(ticker);
      return tickerData && tickerData.length >= 50;
    });

    if (quadTickers.length === 0) continue;

    // Calculate volatilities for assets with valid data only
    const quadVols = {};
    for (const ticker of quadTickers) {
      const tickerData = data.get(ticker);
      const vol = calculateVolatility(tickerData, 30);
      if (vol > 0) {
        quadVols[ticker] = vol;
      }
    }

    if (Object.keys(quadVols).length === 0) continue;

    // Volatility chasing weights
    const totalVol = Object.values(quadVols).reduce((a, b) => a + b, 0);
    const volWeights = {};
    for (const [ticker, vol] of Object.entries(quadVols)) {
      volWeights[ticker] = (vol / totalVol) * quadLeverage;
    }

    // Apply EMA filter - STRICT like Python
    for (const [ticker, volWeight] of Object.entries(volWeights)) {
      const tickerData = data.get(ticker);
      const currentPrice = tickerData[tickerData.length - 1].close;
      const ema = calculateEMA(tickerData, 50);

      // Only apply filter if we have valid EMA
      if (ema > 0 && currentPrice > 0) {
        const aboveEMA = currentPrice > ema;
        console.log(`${ticker}: price=${currentPrice.toFixed(2)}, EMA=${ema.toFixed(2)}, aboveEMA=${aboveEMA}`);

        if (aboveEMA) {
          // Pass EMA filter - add to weights
          weights[ticker] = (weights[ticker] || 0) + volWeight;
        }
        // If below EMA, don't add to weights (excluded)
      }
      // If EMA is 0 (insufficient data), skip entirely
    }
  }

  // Filter to top N positions if max_positions is set (like Python)
  const MAX_POSITIONS = 10;
  let finalWeights = { ...weights };

  if (Object.keys(finalWeights).length > MAX_POSITIONS) {
    // Sort by weight and keep top N
    const sortedW = Object.entries(finalWeights)
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_POSITIONS);
    const topNWeights = Object.fromEntries(sortedW);

    // Re-normalize to maintain total leverage
    const originalTotal = Object.values(finalWeights).reduce((a, b) => a + b, 0);
    const newTotal = Object.values(topNWeights).reduce((a, b) => a + b, 0);
    const scaleFactor = newTotal > 0 ? originalTotal / newTotal : 1;

    finalWeights = {};
    for (const [ticker, weight] of Object.entries(topNWeights)) {
      finalWeights[ticker] = weight * scaleFactor;
    }
  }

  // Calculate total leverage
  const totalLeverage = Object.values(finalWeights).reduce((a, b) => a + b, 0);

  // Sort by weight for display
  const sortedWeights = Object.entries(finalWeights).sort((a, b) => b[1] - a[1]);

  console.log('\n=== FINAL SIGNALS ===');
  console.log(`Total positions: ${sortedWeights.length}`);
  console.log(`Total leverage: ${(totalLeverage * 100).toFixed(2)}%`);
  console.log('\nPositions (sorted by weight):');
  sortedWeights.forEach(([ticker, weight]) => {
    console.log(`  ${ticker}: ${(weight * 100).toFixed(2)}%`);
  });
}

main().catch(console.error);
