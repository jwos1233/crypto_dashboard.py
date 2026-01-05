import { NextResponse } from 'next/server';
import historyData from '@/data/history.json';

export async function GET() {
  try {
    return NextResponse.json(historyData);
  } catch (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history data' },
      { status: 500 }
    );
  }
}
