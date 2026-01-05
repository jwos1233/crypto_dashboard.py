from http.server import BaseHTTPRequestHandler
import json
import sys
import os

# Add current directory to path for local imports
sys.path.insert(0, os.path.dirname(__file__))

from signal_generator import SignalGenerator
from config import QUAD_ALLOCATIONS, QUAD_INDICATORS

QUADRANT_INFO = {
    'Q1': {
        'name': 'Goldilocks',
        'description': 'Growth rising, inflation falling. Risk-on environment favoring growth assets.',
        'color': '#22c55e',
    },
    'Q2': {
        'name': 'Reflation',
        'description': 'Growth rising, inflation rising. Commodities and value stocks outperform.',
        'color': '#f97316',
    },
    'Q3': {
        'name': 'Stagflation',
        'description': 'Growth falling, inflation rising. Defensive positioning with inflation hedges.',
        'color': '#ef4444',
    },
    'Q4': {
        'name': 'Deflation',
        'description': 'Growth falling, inflation falling. Flight to quality, bonds outperform.',
        'color': '#3b82f6',
    },
}

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # Generate signals to get regime data
            generator = SignalGenerator(QUAD_ALLOCATIONS, QUAD_INDICATORS)
            data = generator.generate_signals()
            regime = data['regime']

            quadrant_info = QUADRANT_INFO.get(regime['primaryQuadrant'], {
                'name': regime['primaryQuadrant'],
                'description': '',
                'color': '#6b7280',
            })

            response_data = {
                'quadrant': regime['primaryQuadrant'],
                'primaryQuadrant': regime['primaryQuadrant'],
                'secondaryQuadrant': regime['secondaryQuadrant'],
                'growthDirection': regime['growthDirection'],
                'inflationDirection': regime['inflationDirection'],
                'confidence': regime['confidence'],
                'daysInRegime': regime['daysInRegime'],
                'lastChange': regime['lastChange'],
                'timestamp': data['generatedAt'],
                'quadrantInfo': quadrant_info,
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
