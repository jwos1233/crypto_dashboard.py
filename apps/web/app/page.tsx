import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  Shield,
  Zap,
  BarChart3,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-white">Crypto Macro</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost" className="text-slate-300 hover:text-white">
                Sign in
              </Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Badge className="mb-4" variant="secondary">
          Systematic Crypto Allocation
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 max-w-4xl mx-auto">
          Portfolio Allocation Based on{' '}
          <span className="text-primary">Macro Regimes</span>
        </h1>
        <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
          Stop guessing. Get systematic, backtested signals that adapt to Growth and Inflation cycles.
          420% backtested returns over 5 years.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/signup">
            <Button size="lg" className="text-lg px-8">
              Start Free <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Link href="/performance">
            <Button size="lg" variant="outline" className="text-lg px-8">
              View Performance
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 max-w-4xl mx-auto">
          <StatCard value="+420%" label="5yr Return" />
          <StatCard value="1.41" label="Sharpe Ratio" />
          <StatCard value="-22.6%" label="Max Drawdown" />
          <StatCard value="54%" label="Win Rate" />
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          How It Works
        </h2>
        <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
          <FeatureCard
            icon={<BarChart3 className="w-8 h-8" />}
            title="Detect Regime"
            description="We analyze Growth and Inflation trends to identify the current macro quadrant"
          />
          <FeatureCard
            icon={<TrendingUp className="w-8 h-8" />}
            title="Generate Signals"
            description="Optimal asset allocations are calculated based on historical quadrant performance"
          />
          <FeatureCard
            icon={<Zap className="w-8 h-8" />}
            title="Get Alerts"
            description="Receive notifications when the regime changes or allocations need adjustment"
          />
          <FeatureCard
            icon={<Shield className="w-8 h-8" />}
            title="Manage Risk"
            description="Dynamic stop losses and EMA filters protect against large drawdowns"
          />
        </div>
      </section>

      {/* Quadrant Explainer */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-4">
          The Four Macro Quadrants
        </h2>
        <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
          Every market environment falls into one of four quadrants based on Growth and Inflation direction
        </p>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <QuadrantCard
            quadrant="Q1"
            name="Goldilocks"
            growth="Rising"
            inflation="Falling"
            color="green"
            assets="Tech, Growth, Long Bonds"
          />
          <QuadrantCard
            quadrant="Q2"
            name="Reflation"
            growth="Rising"
            inflation="Rising"
            color="orange"
            assets="Commodities, Energy, Value"
          />
          <QuadrantCard
            quadrant="Q3"
            name="Stagflation"
            growth="Falling"
            inflation="Rising"
            color="red"
            assets="Gold, Energy, Defensives"
          />
          <QuadrantCard
            quadrant="Q4"
            name="Deflation"
            growth="Falling"
            inflation="Falling"
            color="blue"
            assets="Bonds, Cash, Utilities"
          />
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-8 md:p-12 text-center max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Systematize Your Crypto Allocation?
          </h2>
          <p className="text-slate-400 mb-8">
            Start with our free tier - see the current regime and delayed signals.
            Upgrade anytime for real-time access.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8 w-full sm:w-auto">
                Create Free Account
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-center gap-6 mt-6 text-sm text-slate-400">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500" /> No credit card required
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500" /> Cancel anytime
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-slate-800">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="text-slate-400">Crypto Macro Overlay</span>
          </div>
          <p className="text-sm text-slate-500">
            Past performance does not guarantee future results. This is not financial advice.
          </p>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-3xl md:text-4xl font-bold text-white">{value}</p>
      <p className="text-slate-400">{label}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-4 text-primary">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm">{description}</p>
    </div>
  );
}

function QuadrantCard({
  quadrant,
  name,
  growth,
  inflation,
  color,
  assets,
}: {
  quadrant: string;
  name: string;
  growth: string;
  inflation: string;
  color: string;
  assets: string;
}) {
  const colors: Record<string, string> = {
    green: 'border-green-500/30 bg-green-500/10',
    orange: 'border-orange-500/30 bg-orange-500/10',
    red: 'border-red-500/30 bg-red-500/10',
    blue: 'border-blue-500/30 bg-blue-500/10',
  };

  const textColors: Record<string, string> = {
    green: 'text-green-400',
    orange: 'text-orange-400',
    red: 'text-red-400',
    blue: 'text-blue-400',
  };

  return (
    <div className={`p-6 rounded-xl border ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <Badge variant={quadrant.toLowerCase() as any}>{quadrant}</Badge>
        <span className={`font-semibold ${textColors[color]}`}>{name}</span>
      </div>
      <div className="text-sm text-slate-400 mb-3">
        Growth: {growth} | Inflation: {inflation}
      </div>
      <p className="text-sm text-slate-300">Best assets: {assets}</p>
    </div>
  );
}
