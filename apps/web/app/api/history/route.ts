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
    const scriptPath = path.join(repoRoot, 'run_production_backtest.py');
    const dataPath = path.join(process.cwd(), 'data', 'history.json');

    // Run Python script if it exists
    if (fs.existsSync(scriptPath)) {
      try {
        execSync(`python3 "${scriptPath}"`, {
          cwd: repoRoot,
          timeout: 120000,
          stdio: 'pipe',
          env: { ...process.env, MPLBACKEND: 'Agg' }, // Headless matplotlib
        });
      } catch (e) {
        console.error('Python execution failed:', e);
      }
    }

    // Return the JSON data
    const fileContent = fs.readFileSync(dataPath, 'utf-8');
    return NextResponse.json(JSON.parse(fileContent));
  } catch (error) {
    console.error('History API error:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
