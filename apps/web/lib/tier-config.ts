// Subscription tier configuration

export const TIER_CONFIG = {
  free: {
    name: 'Free',
    priceMonthly: 0,
    features: {
      currentQuadrant: true,
      signalDelayHours: 24,
      assetsVisible: ['BTC', 'ETH'] as string[],
      historicalSignalsDays: 7,
      alerts: false,
      apiAccess: false,
      modelPortfolio: false,
    },
  },
  starter: {
    name: 'Starter',
    priceMonthly: 49,
    priceAnnual: 399,
    features: {
      currentQuadrant: true,
      signalDelayHours: 0,
      assetsVisible: 'top_10' as const,
      historicalSignalsDays: 90,
      alerts: ['email'] as string[],
      apiAccess: false,
      modelPortfolio: true,
      weeklyReport: true,
    },
  },
  pro: {
    name: 'Pro',
    priceMonthly: 99,
    priceAnnual: 799,
    features: {
      currentQuadrant: true,
      signalDelayHours: 0,
      assetsVisible: 'all' as const,
      historicalSignalsDays: 365,
      alerts: ['email', 'telegram', 'discord'] as string[],
      apiAccess: true,
      modelPortfolio: true,
      weeklyReport: true,
      dailyBriefing: true,
    },
  },
  institutional: {
    name: 'Institutional',
    priceMonthly: 499,
    priceAnnual: 4999,
    features: {
      everythingInPro: true,
      apiRateLimit: 'unlimited' as const,
      customAssetCoverage: true,
      whiteLabel: true,
      dedicatedSupport: true,
    },
  },
} as const;

export type SubscriptionTier = keyof typeof TIER_CONFIG;

// Top 10 assets for starter tier
export const TOP_10_ASSETS = [
  'BTC', 'ETH', 'SOL', 'AVAX', 'ARB',
  'OP', 'UNI', 'AAVE', 'LINK', 'MATIC',
];

export function canAccessAsset(tier: string, asset: string): boolean {
  const config = TIER_CONFIG[tier as SubscriptionTier];
  if (!config) return false;

  const visible = config.features.assetsVisible;

  if (visible === 'all') return true;
  if (visible === 'top_10') return TOP_10_ASSETS.includes(asset);
  if (Array.isArray(visible)) return visible.includes(asset);

  return false;
}

export function getSignalDelay(tier: string): number {
  const config = TIER_CONFIG[tier as SubscriptionTier];
  return config?.features.signalDelayHours ?? 24;
}

export function canAccessFeature(tier: string, feature: string): boolean {
  const config = TIER_CONFIG[tier as SubscriptionTier];
  if (!config) return false;

  const features = config.features as Record<string, unknown>;
  return Boolean(features[feature]);
}
