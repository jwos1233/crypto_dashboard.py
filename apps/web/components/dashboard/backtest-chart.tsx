'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface HistoryResponse {
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

export function BacktestChart() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['history'],
    queryFn: fetchHistory,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Backtest Performance</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Backtest Performance</CardTitle>
          <CardDescription>Unable to load data</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Format data for chart
  const chartData = data.performance.map(p => ({
    date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    value: p.value,
    return: p.totalReturn,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Backtest Performance</CardTitle>
        <CardDescription>5-year historical simulation</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Chart */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white dark:bg-slate-800 border rounded-lg shadow-lg p-3">
                        <p className="text-sm font-medium">{payload[0].payload.date}</p>
                        <p className="text-sm text-green-600">
                          ${payload[0].value?.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          +{payload[0].payload.return}% total return
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              +{data.summary.totalReturn.toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground">Total Return</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              +{data.summary.annualReturn.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">Annual Return</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">
              {data.summary.sharpe.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">Sharpe Ratio</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">
              {data.summary.maxDrawdown.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">Max Drawdown</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
