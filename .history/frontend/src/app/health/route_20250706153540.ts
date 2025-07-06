import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'AI工具集前端服务运行正常',
    timestamp: new Date().toISOString()
  });
} 