import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Read dynamically so changes are picked up without rebuild
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
