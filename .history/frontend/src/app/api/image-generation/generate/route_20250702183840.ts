import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8003';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // 转发请求到后端
    const response = await fetch(`${BACKEND_URL}/api/image-generation/generate`, {
      method: 'POST',
      body: formData,
    });

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