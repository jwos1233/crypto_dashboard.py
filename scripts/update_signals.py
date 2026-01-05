#!/usr/bin/env python3
"""
Update Signals JSON for Dashboard
==================================

Runs the signal generator and outputs to the format expected by the web dashboard.
"""

import sys
import os
import json
from datetime import datetime
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from signal_generator import SignalGenerator
from config import QUAD_ALLOCATIONS, QUADRANT_DESCRIPTIONS


def get_quadrant_info(quadrant: str) -> dict:
    """Get quadrant metadata"""
    info = {
        'Q1': {'name': 'Goldilocks', 'growthDirection': 'rising', 'inflationDirection': 'falling'},
        'Q2': {'name': 'Reflation', 'growthDirection': 'rising', 'inflationDirection': 'rising'},
        'Q3': {'name': 'Stagflation', 'growthDirection': 'falling', 'inflationDirection': 'rising'},
        'Q4': {'name': 'Deflation', 'growthDirection': 'falling', 'inflationDirection': 'falling'},
    }
    return info.get(quadrant, {'name': quadrant, 'growthDirection': 'unknown', 'inflationDirection': 'unknown'})


def get_asset_category(ticker: str) -> str:
    """Determine asset category based on ticker"""
    categories = {
        # Growth
        'QQQ': 'growth', 'ARKK': 'growth', 'IWM': 'growth', 'VUG': 'growth',
        'XLC': 'growth', 'XLY': 'growth',
        # Crypto
        'IBIT': 'crypto', 'ETHA': 'crypto', 'BTC-USD': 'crypto',
        # Bonds
        'TLT': 'bonds', 'LQD': 'bonds', 'IEF': 'bonds', 'VGLT': 'bonds',
        'MUB': 'bonds', 'TIP': 'bonds', 'VTIP': 'bonds',
        # Commodities
        'XLE': 'commodities', 'DBC': 'commodities', 'GCC': 'commodities',
        'GLD': 'commodities', 'DBA': 'commodities', 'USO': 'commodities',
        'LIT': 'commodities', 'AA': 'commodities', 'PALL': 'commodities',
        'REMX': 'commodities', 'URA': 'commodities',
        # Energy
        'XOP': 'energy', 'FCG': 'energy',
        # Cyclicals
        'XLF': 'cyclicals', 'XLI': 'cyclicals', 'XLB': 'cyclicals',
        # Defensive
        'XLU': 'defensive', 'XLP': 'defensive', 'XLV': 'defensive',
        # Real Assets
        'VNQ': 'real_assets', 'PAVE': 'real_assets',
        # Value
        'VTV': 'value', 'IWD': 'value',
    }
    return categories.get(ticker, 'other')


def get_asset_quadrant(ticker: str) -> str:
    """Determine which quadrant an asset belongs to"""
    for quad, assets in QUAD_ALLOCATIONS.items():
        if ticker in assets:
            return quad
    return 'unknown'


def get_conviction_level(weight: float, total_weights: float) -> str:
    """Determine conviction level based on weight"""
    if total_weights == 0:
        return 'low'
    relative_weight = weight / total_weights
    if relative_weight >= 0.15:
        return 'high'
    elif relative_weight >= 0.08:
        return 'medium'
    return 'low'


def get_signal_type(weight: float) -> str:
    """Determine signal type based on weight"""
    if weight >= 0.05:
        return 'BULLISH'
    elif weight > 0:
        return 'NEUTRAL'
    return 'BEARISH'


def generate_dashboard_json():
    """Generate JSON for dashboard from signal generator output"""
    print("=" * 60)
    print("UPDATING DASHBOARD SIGNALS")
    print("=" * 60)

    # Initialize and run signal generator
    sg = SignalGenerator(
        momentum_days=20,
        ema_period=50,
        vol_lookback=30,
        max_positions=10,
        atr_stop_loss=2.0,
        atr_period=14
    )

    signals = sg.generate_signals()

    # Extract data
    top1, top2 = signals['top_quadrants']
    target_weights = signals['target_weights']
    quad_scores = signals['quadrant_scores']
    timestamp = signals['timestamp']
    total_leverage = signals['total_leverage']

    # Get quadrant info
    q1_info = get_quadrant_info(top1)

    # Calculate confidence based on score difference
    if len(quad_scores) >= 2:
        score_diff = abs(quad_scores.iloc[0] - quad_scores.iloc[1])
        confidence = min(0.95, 0.5 + score_diff / 20)  # Scale confidence
    else:
        confidence = 0.5

    # Build regime object
    regime = {
        'primaryQuadrant': top1,
        'secondaryQuadrant': top2,
        'growthDirection': q1_info['growthDirection'],
        'inflationDirection': q1_info['inflationDirection'],
        'daysInRegime': 1,  # Would need historical tracking for accurate count
        'lastChange': timestamp.strftime('%Y-%m-%dT00:00:00Z'),
        'confidence': round(confidence, 2),
        'timestamp': timestamp.strftime('%Y-%m-%dT%H:%M:%SZ'),
    }

    # Build signals array
    total_weight = sum(target_weights.values())
    signals_list = []

    for ticker, weight in sorted(target_weights.items(), key=lambda x: x[1], reverse=True):
        signals_list.append({
            'asset': ticker,
            'signal': get_signal_type(weight),
            'targetAllocation': round(weight, 4),
            'conviction': get_conviction_level(weight, total_weight),
            'category': get_asset_category(ticker),
            'quadrant': get_asset_quadrant(ticker),
        })

    # Build final JSON
    dashboard_data = {
        'regime': regime,
        'signals': signals_list,
        'generatedAt': timestamp.strftime('%Y-%m-%dT%H:%M:%SZ'),
    }

    return dashboard_data


def main():
    """Main entry point"""
    try:
        # Generate data
        data = generate_dashboard_json()

        # Output path
        output_path = Path(__file__).parent.parent / 'apps' / 'web' / 'data' / 'signals.json'
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Write JSON
        with open(output_path, 'w') as f:
            json.dump(data, f, indent=2)

        print(f"\n✅ Successfully updated {output_path}")
        print(f"   Regime: {data['regime']['primaryQuadrant']} + {data['regime']['secondaryQuadrant']}")
        print(f"   Signals: {len(data['signals'])} positions")
        print(f"   Generated: {data['generatedAt']}")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
