'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, formatDate, getQuadrantColor, getQuadrantName } from '@/lib/utils';
import { TrendingUp, TrendingDown, Calendar, Clock } from 'lucide-react';

interface RegimeData {
  quadrant: string;
  primaryQuadrant: string;
  secondaryQuadrant: string;
  growthDirection: string;
  inflationDirection: string;
  daysInRegime: number;
  lastChange: string;
  confidence: number;
  quadrantInfo: {
    name: string;
    description: string;
    color: string;
  };
}

async function fetchRegime(): Promise<RegimeData> {
  const res = await fetch('/api/regime');
  if (!res.ok) throw new Error('Failed to fetch regime');
  return res.json();
}

export function RegimeCard() {
  const { data: regime, isLoading, error } = useQuery({
    queryKey: ['regime'],
    queryFn: fetchRegime,
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Macro Regime</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !regime) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Macro Regime</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Unable to load regime data</p>
        </CardContent>
      </Card>
    );
  }

  const quadrantBadgeVariant = regime.primaryQuadrant.toLowerCase() as 'q1' | 'q2' | 'q3' | 'q4';

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Current Macro Regime</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Quadrant Display */}
        <div
          className="p-4 rounded-lg"
          style={{ backgroundColor: `${regime.quadrantInfo.color}15` }}
        >
          <div className="flex items-center justify-between">
            <div>
              <Badge variant={quadrantBadgeVariant} className="text-sm mb-2">
                {regime.primaryQuadrant}
              </Badge>
              <h3
                className="text-2xl font-bold"
                style={{ color: regime.quadrantInfo.color }}
              >
                {regime.quadrantInfo.name}
              </h3>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="mb-2">
                + {regime.secondaryQuadrant}
              </Badge>
              <p className="text-sm text-muted-foreground">Secondary</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mt-2">
            {regime.quadrantInfo.description}
          </p>
        </div>

        {/* Indicators */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            {regime.growthDirection === 'rising' ? (
              <TrendingUp className="w-5 h-5 text-green-500" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-500" />
            )}
            <div>
              <p className="text-xs text-muted-foreground">Growth</p>
              <p className={cn(
                'font-medium capitalize',
                regime.growthDirection === 'rising' ? 'text-green-600' : 'text-red-600'
              )}>
                {regime.growthDirection}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {regime.inflationDirection === 'falling' ? (
              <TrendingDown className="w-5 h-5 text-green-500" />
            ) : (
              <TrendingUp className="w-5 h-5 text-orange-500" />
            )}
            <div>
              <p className="text-xs text-muted-foreground">Inflation</p>
              <p className={cn(
                'font-medium capitalize',
                regime.inflationDirection === 'falling' ? 'text-green-600' : 'text-orange-600'
              )}>
                {regime.inflationDirection}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm border-t pt-4">
          <div className="flex items-center space-x-1 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{regime.daysInRegime} days in regime</span>
          </div>
          <div className="flex items-center space-x-1 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Changed {formatDate(regime.lastChange)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
