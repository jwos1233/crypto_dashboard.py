from http.server import BaseHTTPRequestHandler
import json
import sys
import os
from urllib.parse import urlparse, parse_qs

# Add current directory to path for local imports
sys.path.insert(0, os.path.dirname(__file__))

from signal_generator import SignalGenerator
from config import QUAD_ALLOCATIONS, QUAD_INDICATORS

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # Parse query params
            query = parse_qs(urlparse(self.path).query)
            portfolio_size = float(query.get('size', ['10000'])[0])

            # Generate signals
            generator = SignalGenerator(QUAD_ALLOCATIONS, QUAD_INDICATORS)
            data = generator.generate_signals()

            # Build portfolio positions
            positions = []
            for signal in data['signals']:
                if signal['targetAllocation'] > 0:
                    positions.append({
                        'asset': signal['asset'],
                        'allocation': signal['targetAllocation'],
                        'dollarAmount': signal['targetAllocation'] * portfolio_size,
                        'signal': signal['signal'],
                        'conviction': signal['conviction'],
                        'category': signal['category'],
                        'quadrant': signal['quadrant'],
                    })

            # Calculate category allocations
            category_allocations = {}
            for pos in positions:
                cat = pos.get('category', 'other')
                category_allocations[cat] = category_allocations.get(cat, 0) + pos['allocation']

            total_leverage = sum(p['allocation'] for p in positions)

            response_data = {
                'portfolioSize': portfolio_size,
                'totalLeverage': round(total_leverage, 2),
                'numPositions': len(positions),
                'positions': positions,
                'categoryAllocations': category_allocations,
                'regime': {
                    'primaryQuadrant': data['regime']['primaryQuadrant'],
                    'secondaryQuadrant': data['regime']['secondaryQuadrant'],
                },
                'timestamp': data['generatedAt'],
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
