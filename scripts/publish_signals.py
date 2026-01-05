"""
Signal Publisher - Bridge to Supabase
======================================

Publishes signals from the existing signal generator to Supabase database
for the SaaS dashboard to consume.

Usage:
    python scripts/publish_signals.py

Run this as a cron job (e.g., daily after market close).
"""

import os
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Optional

# Add parent directory to path to import signal_generator
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from supabase import create_client, Client
from signal_generator import SignalGenerator
from config import QUAD_ALLOCATIONS

# Supabase configuration
SUPABASE_URL = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY') or os.getenv('SUPABASE_ANON_KEY')

# Asset categories for dashboard display
ASSET_CATEGORIES = {
    # Core
    'BTC': 'core', 'IBIT': 'core',
    'ETH': 'core', 'ETHA': 'core',
    # High Beta / Growth
    'QQQ': 'growth', 'ARKK': 'growth', 'IWM': 'growth',
    'SOL': 'high_beta', 'AVAX': 'high_beta',
    # DeFi
    'UNI': 'defi', 'AAVE': 'defi',
    # Commodities
    'XLE': 'commodities', 'DBC': 'commodities', 'GLD': 'commodities',
    'GCC': 'commodities', 'USO': 'commodities',
    # Bonds
    'TLT': 'bonds', 'VGLT': 'bonds', 'IEF': 'bonds', 'LQD': 'bonds',
    # Defensive
    'XLU': 'defensive', 'XLP': 'defensive', 'XLV': 'defensive',
}

# Quadrant descriptions
QUADRANT_INFO = {
    'Q1': {
        'name': 'Goldilocks',
        'growth': 'rising',
        'inflation': 'falling',
        'description': 'Risk-on environment favoring growth assets',
    },
    'Q2': {
        'name': 'Reflation',
        'growth': 'rising',
        'inflation': 'rising',
        'description': 'Commodities and value outperform',
    },
    'Q3': {
        'name': 'Stagflation',
        'growth': 'falling',
        'inflation': 'rising',
        'description': 'Defensive positioning with inflation hedges',
    },
    'Q4': {
        'name': 'Deflation',
        'growth': 'falling',
        'inflation': 'falling',
        'description': 'Flight to quality, bonds outperform',
    },
}


class SignalPublisher:
    """Publishes signals to Supabase for the SaaS dashboard"""

    def __init__(self):
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise ValueError(
                "Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables."
            )

        self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        self.signal_gen = SignalGenerator(
            momentum_days=20,
            ema_period=50,
            vol_lookback=30,
            max_positions=10,
            atr_stop_loss=2.0,
            atr_period=14
        )

    def get_asset_quadrant(self, asset: str) -> Optional[str]:
        """Determine which quadrant an asset belongs to"""
        for quad, assets in QUAD_ALLOCATIONS.items():
            if asset in assets:
                return quad
        return None

    def get_signal_conviction(self, weight: float, total_weight: float) -> str:
        """Determine conviction level based on weight"""
        relative_weight = weight / total_weight if total_weight > 0 else 0
        if relative_weight > 0.15:
            return 'high'
        elif relative_weight > 0.08:
            return 'medium'
        return 'low'

    def weight_to_signal(self, weight: float) -> str:
        """Convert weight to signal string"""
        if weight >= 0.05:  # 5%+ allocation = bullish
            return 'BULLISH'
        elif weight > 0:  # Small allocation = neutral
            return 'NEUTRAL'
        return 'BEARISH'

    def publish_regime(self, signals: Dict) -> None:
        """Publish current regime to Supabase"""
        top1, top2 = signals['top_quadrants']
        quad_info = QUADRANT_INFO.get(top1, {})

        # Get existing regime to calculate days_in_regime
        existing = self.supabase.table('current_regime').select('*').limit(1).execute()

        days_in_regime = 1
        last_change = datetime.now()

        if existing.data:
            prev_regime = existing.data[0]
            if prev_regime['primary_quadrant'] == top1:
                # Same regime, increment days
                days_in_regime = prev_regime.get('days_in_regime', 0) + 1
                last_change = prev_regime.get('last_change', datetime.now().isoformat())
            else:
                # Regime changed, log it
                self._log_signal_change(
                    event_type='quadrant_change',
                    previous_value=prev_regime['primary_quadrant'],
                    new_value=top1,
                    reason=f"Macro regime shifted to {quad_info.get('name', top1)}"
                )

        regime_data = {
            'quadrant': top1,
            'primary_quadrant': top1,
            'secondary_quadrant': top2,
            'growth_direction': quad_info.get('growth', 'unknown'),
            'inflation_direction': quad_info.get('inflation', 'unknown'),
            'days_in_regime': days_in_regime,
            'last_change': last_change if isinstance(last_change, str) else last_change.isoformat(),
            'confidence': 0.85,
            'timestamp': datetime.now().isoformat(),
        }

        # Upsert regime (delete old, insert new)
        self.supabase.table('current_regime').delete().neq('id', '').execute()
        self.supabase.table('current_regime').insert(regime_data).execute()

        print(f"+ Published regime: {top1} ({quad_info.get('name', '')})")

    def publish_signals(self, signals: Dict) -> None:
        """Publish current signals to Supabase"""
        target_weights = signals['target_weights']
        total_weight = sum(target_weights.values())

        # Get existing signals for change detection
        existing = self.supabase.table('current_signals').select('*').execute()
        existing_map = {s['asset']: s for s in existing.data} if existing.data else {}

        # Prepare new signals
        new_signals = []
        for asset, weight in target_weights.items():
            signal = self.weight_to_signal(weight)
            quadrant = self.get_asset_quadrant(asset)
            category = ASSET_CATEGORIES.get(asset, 'other')
            conviction = self.get_signal_conviction(weight, total_weight)

            signal_data = {
                'asset': asset,
                'signal': signal,
                'target_allocation': round(weight, 4),
                'conviction': conviction,
                'category': category,
                'quadrant': quadrant,
                'timestamp': datetime.now().isoformat(),
            }

            # Check for signal change
            if asset in existing_map:
                prev = existing_map[asset]
                if prev['signal'] != signal:
                    signal_data['previous_signal'] = prev['signal']
                    signal_data['signal_changed_at'] = datetime.now().isoformat()

                    self._log_signal_change(
                        event_type='signal_change',
                        asset=asset,
                        previous_value=prev['signal'],
                        new_value=signal,
                        reason=f"Weight changed from {prev['target_allocation']:.2%} to {weight:.2%}"
                    )

            new_signals.append(signal_data)

        # Clear old signals and insert new
        self.supabase.table('current_signals').delete().neq('id', '').execute()

        if new_signals:
            self.supabase.table('current_signals').insert(new_signals).execute()

        print(f"+ Published {len(new_signals)} signals")

    def _log_signal_change(
        self,
        event_type: str,
        previous_value: str,
        new_value: str,
        asset: Optional[str] = None,
        reason: Optional[str] = None
    ) -> None:
        """Log signal change to history table"""
        history_entry = {
            'event_type': event_type,
            'asset': asset,
            'previous_value': previous_value,
            'new_value': new_value,
            'reason': reason,
            'timestamp': datetime.now().isoformat(),
        }

        self.supabase.table('signal_history').insert(history_entry).execute()
        print(f"  Logged: {event_type} - {asset or 'regime'}: {previous_value} -> {new_value}")

    def publish(self) -> Dict:
        """Main entry point - generate and publish signals"""
        print("=" * 70)
        print("SIGNAL PUBLISHER - Supabase Bridge")
        print("=" * 70)
        print(f"Timestamp: {datetime.now().isoformat()}")
        print()

        # Generate signals using existing engine
        print("Generating signals...")
        signals = self.signal_gen.generate_signals()

        # Publish to Supabase
        print("\nPublishing to Supabase...")
        self.publish_regime(signals)
        self.publish_signals(signals)

        print("\n" + "=" * 70)
        print("PUBLISH COMPLETE")
        print("=" * 70)

        return signals


def main():
    """Run the signal publisher"""
    try:
        publisher = SignalPublisher()
        signals = publisher.publish()

        # Print summary
        print("\nSummary:")
        print(f"  Regime: {signals['top_quadrants'][0]} + {signals['top_quadrants'][1]}")
        print(f"  Positions: {len(signals['target_weights'])}")
        print(f"  Total Leverage: {signals['total_leverage']:.2f}x")

    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
