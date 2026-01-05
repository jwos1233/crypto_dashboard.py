import { getSession } from '@/lib/auth';
import { RegimeCard } from '@/components/dashboard/regime-card';
import { SignalsTable } from '@/components/dashboard/signals-table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, TrendingUp, Shield } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await getSession();
  const tier = session?.user?.tier || 'free';
  const isFreeTier = tier === 'free';

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back{session?.user?.name ? `, ${session.user.name}` : ''}
          </p>
        </div>
        {isFreeTier && (
          <Link href="/dashboard/account">
            <Button>
              <Zap className="w-4 h-4 mr-2" />
              Upgrade for real-time signals
            </Button>
          </Link>
        )}
      </div>

      {/* Free tier notice */}
      {isFreeTier && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                  <Shield className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium">Free Tier - 24h Delayed Signals</p>
                  <p className="text-sm text-muted-foreground">
                    Upgrade to Starter for real-time signals and full portfolio access
                  </p>
                </div>
              </div>
              <Link href="/dashboard/account">
                <Button variant="outline" size="sm">
                  View Plans
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Regime Card - Left column */}
        <div className="lg:col-span-1">
          <RegimeCard />
        </div>

        {/* Quick Stats - Right columns */}
        <div className="lg:col-span-2 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Model Performance</CardDescription>
              <CardTitle className="text-2xl text-green-600">+420%</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">5-year backtest return</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Sharpe Ratio</CardDescription>
              <CardTitle className="text-2xl">1.41</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Risk-adjusted return</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Max Drawdown</CardDescription>
              <CardTitle className="text-2xl text-amber-600">-22.6%</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Worst peak-to-trough</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Signals Table */}
      <SignalsTable />

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <CardDescription>Latest signal changes and regime updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <ActivityItem
              icon={<TrendingUp className="w-4 h-4 text-green-500" />}
              title="Regime confirmed: Q1 Goldilocks"
              description="Growth rising, inflation falling - risk-on positioning"
              time="Today"
            />
            <ActivityItem
              icon={<div className="w-2 h-2 rounded-full bg-yellow-500" />}
              title="SOL signal changed: BULLISH → NEUTRAL"
              description="Momentum declining, reduced allocation to 4%"
              time="Yesterday"
            />
            <ActivityItem
              icon={<div className="w-2 h-2 rounded-full bg-green-500" />}
              title="New position: ARB added to portfolio"
              description="L2 sector allocation initiated at 5%"
              time="3 days ago"
            />
          </div>

          <div className="mt-4 pt-4 border-t">
            <Link
              href="/dashboard/history"
              className="text-sm text-primary hover:underline flex items-center"
            >
              View full history
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ActivityItem({
  icon,
  title,
  description,
  time,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  time: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">{time}</span>
    </div>
  );
}
