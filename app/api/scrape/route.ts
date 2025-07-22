import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { keyword } = await request.json();
    
    if (!keyword) {
      return NextResponse.json(
        { error: '请提供搜索关键词' },
        { status: 400 }
      );
    }

    // 简化版本 - 返回示例数据避免puppeteer依赖
    const mockResults = [
      {
        id: 1,
        title: `关于 "${keyword}" 的精彩内容分享`,
        content: `这是一个关于${keyword}的精彩小红书笔记内容，包含了详细的介绍和实用的建议。内容丰富，值得收藏和学习。`,
        author: '小红书用户',
        likes: Math.floor(Math.random() * 1000) + 100,
        comments: Math.floor(Math.random() * 100) + 10,
        tags: [keyword, '推荐', '干货'],
        url: 'https://xiaohongshu.com/example',
        imageUrl: 'https://via.placeholder.com/300x200',
        createdAt: new Date().toISOString(),
        platform: 'xiaohongshu'
      },
      {
        id: 2,
        title: `${keyword}使用指南和技巧`,
        content: `分享一些关于${keyword}的实用技巧和使用心得，希望对大家有帮助。这些都是经过实践验证的方法。`,
        author: '经验分享者',
        likes: Math.floor(Math.random() * 1000) + 50,
        comments: Math.floor(Math.random() * 100) + 5,
        tags: [keyword, '教程', '技巧'],
        url: 'https://xiaohongshu.com/example2',
        imageUrl: 'https://via.placeholder.com/300x200',
        createdAt: new Date().toISOString(),
        platform: 'xiaohongshu'
      }
    ];

    return NextResponse.json({
      success: true,
      data: mockResults,
      total: mockResults.length,
      keyword: keyword,
      message: '抓取完成（当前为演示模式）'
    });

  } catch (error) {
    console.error('Scrape API Error:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: '小红书抓取API',
    method: 'POST',
    description: '发送POST请求与关键词参数进行内容抓取'
  });
}
