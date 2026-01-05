import { SignalsTable } from '@/components/dashboard/signals-table';

export default function SignalsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Signals</h1>
        <p className="text-muted-foreground">
          Current portfolio allocation signals based on macro regime
        </p>
      </div>

      <SignalsTable />
    </div>
  );
}
