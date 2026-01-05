import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Run the Python backtest script to generate fresh data
    const rootDir = path.join(process.cwd(), '..', '..');
    const scriptPath = path.join(rootDir, 'run_production_backtest.py');

    try {
      execSync(`python ${scriptPath}`, {
        cwd: rootDir,
        timeout: 120000, // 2 minute timeout
        stdio: 'pipe',
      });
    } catch (execError) {
      console.error('Python script error (using cached data):', execError);
      // Fall through to read cached data
    }

    // Read the generated JSON
    const dataPath = path.join(process.cwd(), 'data', 'history.json');
    const fileContent = fs.readFileSync(dataPath, 'utf-8');
    const historyData = JSON.parse(fileContent);

    return NextResponse.json(historyData);
  } catch (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history data' },
      { status: 500 }
    );
  }
}
