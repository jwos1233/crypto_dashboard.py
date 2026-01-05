#!/usr/bin/env python3
"""
Generate History JSON from Backtest
====================================

Runs the backtest and extracts regime transitions and signal changes
for the dashboard history page.
"""

import sys
import json
from datetime import datetime, timedelta
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from quad_portfolio_backtest import QuadrantPortfolioBacktest
from config import QUAD_ALLOCATIONS


def get_quadrant_name(quad: str) -> str:
    """Get human-readable quadrant name"""
    names = {
        'Q1': 'Goldilocks',
        'Q2': 'Reflation',
        'Q3': 'Stagflation',
        'Q4': 'Deflation',
    }
    return names.get(quad, quad)


def generate_history():
    """Run backtest and extract history events"""
    print("=" * 60)
    print("GENERATING HISTORY FROM BACKTEST")
    print("=" * 60)

    # Run backtest for last 5 years
    end_date = datetime.now()
    start_date = end_date - timedelta(days=5 * 365)  # 5 years

    backtest = QuadrantPortfolioBacktest(
        start_date=start_date,
        end_date=end_date,
        initial_capital=50000,
        momentum_days=20,
        max_positions=10,
        atr_stop_loss=2.0,
        atr_period=14
    )

    results = backtest.run_backtest()

    # Extract regime transitions
    quad_history = backtest.quad_history
    target_weights = backtest.target_weights

    history_events = []

    prev_regime = None
    prev_weights = {}

    for i, date in enumerate(quad_history.index):
        current_regime = (quad_history.loc[date, 'Top1'], quad_history.loc[date, 'Top2'])

        # Check for regime change
        if prev_regime is not None and current_regime != prev_regime:
            old_primary = prev_regime[0]
            new_primary = current_regime[0]
            new_secondary = current_regime[1]

            history_events.append({
                'id': len(history_events) + 1,
                'date': date.strftime('%Y-%m-%d'),
                'type': 'regime',
                'title': f'Regime transition: {old_primary} → {new_primary}',
                'description': f'Primary quadrant changed to {get_quadrant_name(new_primary)}, secondary is {get_quadrant_name(new_secondary)}',
                'icon': 'up' if new_primary == 'Q1' else ('down' if new_primary in ['Q3', 'Q4'] else 'neutral'),
            })

        # Check for significant position changes (only check every few days to avoid noise)
        if date in target_weights.index and i % 5 == 0:  # Check every 5 days
            current_weights = target_weights.loc[date]

            for ticker in current_weights.index:
                current_weight = current_weights[ticker]
                prev_weight = prev_weights.get(ticker, 0)

                # Detect new positions
                if current_weight > 0.05 and prev_weight < 0.01:
                    history_events.append({
                        'id': len(history_events) + 1,
                        'date': date.strftime('%Y-%m-%d'),
                        'type': 'signal',
                        'title': f'New position: {ticker} added',
                        'description': f'Allocation: {current_weight*100:.1f}%',
                        'icon': 'up',
                    })

                # Detect exited positions
                elif current_weight < 0.01 and prev_weight > 0.05:
                    history_events.append({
                        'id': len(history_events) + 1,
                        'date': date.strftime('%Y-%m-%d'),
                        'type': 'signal',
                        'title': f'Position exited: {ticker}',
                        'description': f'Removed from portfolio (was {prev_weight*100:.1f}%)',
                        'icon': 'down',
                    })

                # Detect significant weight changes
                elif abs(current_weight - prev_weight) > 0.10:  # >10% change
                    direction = 'increased' if current_weight > prev_weight else 'decreased'
                    history_events.append({
                        'id': len(history_events) + 1,
                        'date': date.strftime('%Y-%m-%d'),
                        'type': 'signal',
                        'title': f'{ticker} allocation {direction}',
                        'description': f'{prev_weight*100:.1f}% → {current_weight*100:.1f}%',
                        'icon': 'up' if direction == 'increased' else 'down',
                    })

            prev_weights = {t: current_weights[t] for t in current_weights.index if current_weights[t] > 0}

        prev_regime = current_regime

    # Sort by date descending (most recent first)
    history_events.sort(key=lambda x: x['date'], reverse=True)

    # Limit to most recent 100 events
    history_events = history_events[:100]

    # Re-assign IDs after sorting
    for i, event in enumerate(history_events):
        event['id'] = i + 1

    # Build performance history (monthly snapshots)
    portfolio_value = backtest.portfolio_value
    performance_history = []

    # Sample monthly
    monthly_dates = portfolio_value.resample('M').last().index
    for date in monthly_dates:
        if date in portfolio_value.index:
            value = portfolio_value.loc[date]
            returns = (value / backtest.initial_capital - 1) * 100
            performance_history.append({
                'date': date.strftime('%Y-%m-%d'),
                'value': round(value, 2),
                'totalReturn': round(returns, 2),
            })

    return {
        'events': history_events,
        'performance': performance_history,
        'summary': {
            'totalReturn': round(results['total_return'], 2),
            'annualReturn': round(results['annual_return'], 2),
            'sharpe': round(results['sharpe'], 2),
            'maxDrawdown': round(results['max_drawdown'], 2),
            'finalValue': round(results['final_value'], 2),
        },
        'generatedAt': datetime.now().strftime('%Y-%m-%dT%H:%M:%SZ'),
    }


def main():
    """Main entry point"""
    try:
        # Generate history data
        data = generate_history()

        # Output path
        output_path = Path(__file__).parent.parent / 'apps' / 'web' / 'data' / 'history.json'
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Write JSON
        with open(output_path, 'w') as f:
            json.dump(data, f, indent=2)

        print(f"\n✅ Successfully generated {output_path}")
        print(f"   Events: {len(data['events'])}")
        print(f"   Performance snapshots: {len(data['performance'])}")
        print(f"   Total Return: {data['summary']['totalReturn']:.2f}%")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
