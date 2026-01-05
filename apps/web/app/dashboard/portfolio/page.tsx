'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatPercentage, getQuadrantName } from '@/lib/utils';

interface Position {
  asset: string;
  allocation: number;
  dollarAmount: number;
  signal: string;
  conviction: string | null;
  category: string | null;
  quadrant: string | null;
}

interface PortfolioResponse {
  portfolioSize: number;
  totalAllocated: number;
  cashAllocation: number;
  positions: Position[];
  categoryAllocations: Record<string, number>;
  regime: {
    quadrant: string;
    secondaryQuadrant: string;
    daysInRegime: number;
  };
  timestamp: string;
}

async function fetchPortfolio(): Promise<PortfolioResponse> {
  const res = await fetch('/api/portfolio?size=10000');
  if (!res.ok) throw new Error('Failed to fetch portfolio');
  return res.json();
}

export default function PortfolioPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['portfolio'],
    queryFn: fetchPortfolio,
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Portfolio</h1>
          <p className="text-muted-foreground">Loading portfolio data...</p>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Portfolio</h1>
          <p className="text-muted-foreground">Unable to load portfolio data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Portfolio</h1>
        <p className="text-muted-foreground">
          Model portfolio based on current {getQuadrantName(data.regime.quadrant)} regime
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Portfolio Size</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(data.portfolioSize)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Allocated</CardDescription>
            <CardTitle className="text-2xl">{formatPercentage(data.totalAllocated)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Cash Reserve</CardDescription>
            <CardTitle className="text-2xl">{formatPercentage(data.cashAllocation)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Allocations by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
          <CardDescription>Allocation by asset category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(data.categoryAllocations).map(([category, allocation]) => (
              <div key={category} className="flex items-center justify-between">
                <span className="capitalize font-medium">{category}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${allocation * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {formatPercentage(allocation)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Positions */}
      <Card>
        <CardHeader>
          <CardTitle>Positions</CardTitle>
          <CardDescription>Individual asset allocations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.positions.map((position) => (
              <div
                key={position.asset}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{position.asset}</span>
                  <Badge variant="outline" className="text-xs">
                    {position.signal}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(position.dollarAmount)}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatPercentage(position.allocation)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
