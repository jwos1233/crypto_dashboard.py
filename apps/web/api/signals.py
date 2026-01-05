from http.server import BaseHTTPRequestHandler
import json
import sys
import os

# Add current directory to path for local imports
sys.path.insert(0, os.path.dirname(__file__))

from signal_generator import SignalGenerator
from config import QUAD_ALLOCATIONS, QUAD_INDICATORS

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:

            # Generate signals
            generator = SignalGenerator(QUAD_ALLOCATIONS, QUAD_INDICATORS)
            result = generator.generate_signals()

            response_data = {
                'signals': result['signals'],
                'meta': {
                    'tier': 'free',
                    'totalSignals': len(result['signals']),
                    'totalLeverage': sum(s['targetAllocation'] for s in result['signals']),
                    'timestamp': result['generatedAt'],
                    'primaryQuadrant': result['regime']['primaryQuadrant'],
                    'secondaryQuadrant': result['regime']['secondaryQuadrant'],
                },
                'regime': result['regime'],
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
