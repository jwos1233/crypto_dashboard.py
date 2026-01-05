'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

interface HistoryEvent {
  id: number;
  date: string;
  type: 'regime' | 'signal';
  title: string;
  description: string;
  icon: 'up' | 'down' | 'neutral';
}

interface HistoryResponse {
  events: HistoryEvent[];
  performance: Array<{
    date: string;
    value: number;
    totalReturn: number;
  }>;
  summary: {
    totalReturn: number;
    annualReturn: number;
    sharpe: number;
    maxDrawdown: number;
    finalValue: number;
  };
  generatedAt: string;
}

async function fetchHistory(): Promise<HistoryResponse> {
  const res = await fetch('/api/history');
  if (!res.ok) throw new Error('Failed to fetch history');
  return res.json();
}

export default function HistoryPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['history'],
    queryFn: fetchHistory,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">History</h1>
          <p className="text-muted-foreground">Loading historical data...</p>
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
          <h1 className="text-2xl font-bold">History</h1>
          <p className="text-muted-foreground">Unable to load history data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">History</h1>
        <p className="text-muted-foreground">
          Signal changes and regime transitions from backtest
        </p>
      </div>

      {/* Performance Summary */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Return</CardDescription>
            <CardTitle className={`text-2xl ${data.summary.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.summary.totalReturn >= 0 ? '+' : ''}{data.summary.totalReturn.toFixed(2)}%
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Annual Return</CardDescription>
            <CardTitle className={`text-2xl ${data.summary.annualReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.summary.annualReturn >= 0 ? '+' : ''}{data.summary.annualReturn.toFixed(2)}%
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sharpe Ratio</CardDescription>
            <CardTitle className="text-2xl">{data.summary.sharpe.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Max Drawdown</CardDescription>
            <CardTitle className="text-2xl text-amber-600">{data.summary.maxDrawdown.toFixed(2)}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Chronological record of portfolio changes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />

            <div className="space-y-6">
              {data.events.slice(0, 50).map((item) => (
                <div key={item.id} className="relative pl-10">
                  {/* Timeline dot */}
                  <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center z-10">
                    {item.icon === 'up' ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : item.icon === 'down' ? (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    ) : (
                      <ArrowRight className="w-4 h-4 text-yellow-500" />
                    )}
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={item.type === 'regime' ? 'secondary' : 'outline'}>
                        {item.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{item.date}</span>
                    </div>
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {data.events.length > 50 && (
            <p className="text-center text-sm text-muted-foreground mt-6">
              Showing 50 of {data.events.length} events
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
