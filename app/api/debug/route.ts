import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'status';

    // 简化版本 - 返回系统状态信息
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      nextVersion: '14.2.0',
      nodeVersion: process.version,
      platform: process.platform,
      status: 'healthy',
      services: {
        supabase: {
          configured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
          status: 'ready'
        },
        scraping: {
          mode: 'mock',
          status: 'available',
          note: '当前使用模拟数据模式'
        }
      },
      routes: {
        '/api/scrape': 'available (mock mode)',
        '/api/categorize': 'available',
        '/api/summary': 'available',
        '/api/debug': 'available'
      }
    };

    switch (action) {
      case 'health':
        return NextResponse.json({
          status: 'ok',
          message: '系统运行正常',
          timestamp: new Date().toISOString()
        });
      
      case 'env':
        return NextResponse.json({
          hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          nodeEnv: process.env.NODE_ENV,
          platform: process.platform
        });
      
      default:
        return NextResponse.json(debugInfo);
    }

  } catch (error) {
    console.error('Debug API Error:', error);
    return NextResponse.json(
      { 
        error: '调试信息获取失败',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { test } = await request.json();
    
    return NextResponse.json({
      message: '调试测试完成',
      receivedData: { test },
      timestamp: new Date().toISOString(),
      status: 'success'
    });
    
  } catch (error) {
    console.error('Debug POST Error:', error);
    return NextResponse.json(
      { error: '调试测试失败' },
      { status: 500 }
    );
  }
}
