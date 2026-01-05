'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn, formatPercentage } from '@/lib/utils';
import { ArrowUp, ArrowDown, Minus, Lock, AlertCircle } from 'lucide-react';

interface Signal {
  asset: string;
  signal: string;
  targetAllocation: number;
  conviction: string | null;
  category: string | null;
  quadrant: string | null;
  previousSignal?: string;
  signalChangedAt?: string;
  isDelayed?: boolean;
}

interface SignalsResponse {
  signals: Signal[];
  meta: {
    tier: string;
    totalSignals: number;
    totalAllocation: number;
    cashAllocation: number;
    isDelayed: boolean;
    delayHours: number;
  };
}

async function fetchSignals(): Promise<SignalsResponse> {
  const res = await fetch('/api/signals');
  if (!res.ok) throw new Error('Failed to fetch signals');
  return res.json();
}

function SignalBadge({ signal }: { signal: string }) {
  const variants: Record<string, { variant: 'bullish' | 'neutral' | 'bearish'; icon: React.ReactNode }> = {
    BULLISH: { variant: 'bullish', icon: <ArrowUp className="w-3 h-3" /> },
    NEUTRAL: { variant: 'neutral', icon: <Minus className="w-3 h-3" /> },
    BEARISH: { variant: 'bearish', icon: <ArrowDown className="w-3 h-3" /> },
  };

  const config = variants[signal.toUpperCase()] || variants.NEUTRAL;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      {config.icon}
      {signal}
    </Badge>
  );
}

function ConvictionIndicator({ conviction }: { conviction: string | null }) {
  if (!conviction) return <span className="text-muted-foreground">-</span>;

  const colors: Record<string, string> = {
    high: 'bg-green-500',
    medium: 'bg-yellow-500',
    low: 'bg-slate-400',
  };

  const bars = conviction === 'high' ? 3 : conviction === 'medium' ? 2 : 1;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn(
            'w-1.5 rounded-full',
            i <= bars ? colors[conviction] : 'bg-slate-200 dark:bg-slate-700',
            i === 1 ? 'h-2' : i === 2 ? 'h-3' : 'h-4'
          )}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-1 capitalize">{conviction}</span>
    </div>
  );
}

export function SignalsTable() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['signals'],
    queryFn: fetchSignals,
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Signals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-slate-200 dark:bg-slate-700 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Signals</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Unable to load signals</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Current Signals</CardTitle>
            <CardDescription>
              {data.meta.totalSignals} positions | {formatPercentage(data.meta.totalAllocation)} allocated
            </CardDescription>
          </div>
          {data.meta.isDelayed && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Lock className="w-3 h-3" />
              {data.meta.delayHours}h delayed
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {data.signals.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No signals available</p>
            <p className="text-sm text-muted-foreground mt-1">
              Signals will appear here once published
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Signal</TableHead>
                <TableHead>Allocation</TableHead>
                <TableHead>Conviction</TableHead>
                <TableHead>Category</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.signals.map((signal) => (
                <TableRow key={signal.asset}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {signal.asset}
                      {signal.previousSignal && signal.previousSignal !== signal.signal && (
                        <Badge variant="outline" className="text-xs">
                          was {signal.previousSignal}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <SignalBadge signal={signal.signal} />
                  </TableCell>
                  <TableCell>{formatPercentage(signal.targetAllocation)}</TableCell>
                  <TableCell>
                    <ConvictionIndicator conviction={signal.conviction} />
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground capitalize">
                      {signal.category || '-'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}

              {/* Cash row */}
              {data.meta.cashAllocation > 0 && (
                <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                  <TableCell className="font-medium">USDC</TableCell>
                  <TableCell>
                    <Badge variant="outline">HOLD</Badge>
                  </TableCell>
                  <TableCell>{formatPercentage(data.meta.cashAllocation)}</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">Stable</span>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
