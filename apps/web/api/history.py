from http.server import BaseHTTPRequestHandler
import json
import sys
import os

# Add current directory to path for local imports
sys.path.insert(0, os.path.dirname(__file__))

from quad_portfolio_backtest import QuadrantPortfolioBacktest
from config import QUAD_ALLOCATIONS

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:

            # Run the backtest
            backtest = QuadrantPortfolioBacktest(
                allocations=QUAD_ALLOCATIONS,
                initial_capital=50000,
                momentum_lookback=20,
                max_positions=10,
                stop_loss_atr_multiplier=2.0
            )

            results = backtest.run_backtest()

            # Build performance history
            portfolio_value = results['portfolio_value']
            performance_history = []

            for date, value in portfolio_value.items():
                total_return = ((value / 50000) - 1) * 100
                performance_history.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'value': round(value, 2),
                    'totalReturn': round(total_return, 2)
                })

            # Calculate summary stats
            final_value = portfolio_value.iloc[-1]
            total_return = ((final_value / 50000) - 1) * 100

            returns = portfolio_value.pct_change().dropna()
            sharpe = (returns.mean() / returns.std()) * (252 ** 0.5) if returns.std() > 0 else 0

            rolling_max = portfolio_value.expanding().max()
            drawdown = (portfolio_value - rolling_max) / rolling_max
            max_drawdown = drawdown.min() * 100

            years = len(portfolio_value) / 252
            annual_return = ((final_value / 50000) ** (1 / years) - 1) * 100 if years > 0 else 0

            response_data = {
                'performance': performance_history,
                'summary': {
                    'totalReturn': round(total_return, 1),
                    'annualReturn': round(annual_return, 1),
                    'sharpe': round(sharpe, 2),
                    'maxDrawdown': round(max_drawdown, 1),
                    'finalValue': round(final_value, 2)
                },
                'generatedAt': portfolio_value.index[-1].strftime('%Y-%m-%dT%H:%M:%SZ')
            }

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode())

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())
