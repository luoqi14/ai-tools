import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8003';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timestamp = searchParams.get('t');
    
    const response = await fetch(`${BACKEND_URL}/api/bing-image?t=${timestamp}`);
    
    if (response.ok) {
      const imageBuffer = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      
      return new NextResponse(imageBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    } else {
      return NextResponse.json(
        { success: false, message: '获取图片失败' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API代理错误:', error);
    return NextResponse.json(
      { success: false, message: '内部服务器错误' },
      { status: 500 }
    );
  }
} 