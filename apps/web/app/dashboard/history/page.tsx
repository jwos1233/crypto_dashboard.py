import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

// Static history data for demo
const historyItems = [
  {
    id: 1,
    date: '2025-01-05',
    type: 'regime',
    title: 'Regime confirmed: Q1 Goldilocks',
    description: 'Growth rising, inflation falling - risk-on positioning confirmed',
    icon: 'up',
  },
  {
    id: 2,
    date: '2025-01-04',
    type: 'signal',
    title: 'SOL signal changed: BULLISH → NEUTRAL',
    description: 'Momentum declining, reduced allocation to 4%',
    icon: 'neutral',
  },
  {
    id: 3,
    date: '2025-01-02',
    type: 'signal',
    title: 'New position: ARB added to portfolio',
    description: 'L2 sector allocation initiated at 5%',
    icon: 'up',
  },
  {
    id: 4,
    date: '2024-12-28',
    type: 'regime',
    title: 'Regime transition: Q4 → Q1',
    description: 'Growth turning positive while inflation continues to moderate',
    icon: 'up',
  },
  {
    id: 5,
    date: '2024-12-20',
    type: 'signal',
    title: 'BTC signal changed: NEUTRAL → BULLISH',
    description: 'Momentum improving as regime shifts to risk-on',
    icon: 'up',
  },
  {
    id: 6,
    date: '2024-12-15',
    type: 'signal',
    title: 'TLT allocation increased',
    description: 'Bond allocation raised to 5% as deflation concerns persist',
    icon: 'neutral',
  },
];

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">History</h1>
        <p className="text-muted-foreground">
          Signal changes and regime transitions
        </p>
      </div>

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
              {historyItems.map((item) => (
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
        </CardContent>
      </Card>
    </div>
  );
}
