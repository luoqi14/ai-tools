import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8003';

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/tools/categories`);
    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('API代理错误:', error);
    return NextResponse.json(
      { success: false, message: '内部服务器错误' },
      { status: 500 }
    );
  }
} 