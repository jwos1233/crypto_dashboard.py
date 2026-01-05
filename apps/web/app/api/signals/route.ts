import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Find the repo root (go up from apps/web)
    const repoRoot = path.resolve(process.cwd(), '..', '..');
    const scriptPath = path.join(repoRoot, 'scripts', 'update_signals.py');
    const dataPath = path.join(process.cwd(), 'data', 'signals.json');

    // Run Python script if it exists
    if (fs.existsSync(scriptPath)) {
      try {
        execSync(`python3 "${scriptPath}"`, {
          cwd: repoRoot,
          timeout: 60000,
          stdio: 'pipe',
        });
      } catch (e) {
        console.error('Python execution failed:', e);
      }
    }

    // Read and return the JSON data
    const fileContent = fs.readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(fileContent);

    return NextResponse.json({
      signals: data.signals,
      meta: {
        tier: 'free',
        totalSignals: data.signals.length,
        totalLeverage: data.signals.reduce((sum: number, s: { targetAllocation: number }) => sum + s.targetAllocation, 0),
        timestamp: data.generatedAt,
        primaryQuadrant: data.regime.primaryQuadrant,
        secondaryQuadrant: data.regime.secondaryQuadrant,
      },
      regime: data.regime,
    });
  } catch (error) {
    console.error('Signals API error:', error);
    return NextResponse.json({ error: 'Failed to fetch signals' }, { status: 500 });
  }
}
