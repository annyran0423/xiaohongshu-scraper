import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

// 调试API - 查看页面实际内容
export async function POST(request: NextRequest) {
  try {
    const { keyword = '美食' } = await request.json();
    
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process'
      ]
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // 尝试访问小红书首页而不是搜索页面
    const url = 'https://www.xiaohongshu.com';
    console.log('正在访问:', url);
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 获取页面基本信息
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        bodyText: document.body.innerText.substring(0, 500),
        htmlSnippet: document.body.innerHTML.substring(0, 1000),
        elementCounts: {
          totalElements: document.querySelectorAll('*').length,
          links: document.querySelectorAll('a').length,
          images: document.querySelectorAll('img').length,
          sections: document.querySelectorAll('section').length,
          divs: document.querySelectorAll('div').length
        }
      };
    });
    
    // 尝试找到任何可能的帖子链接
    const potentialLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="/explore/"], a[href*="/discovery/"], a[href*="/user/"]'));
      return links.slice(0, 10).map(link => ({
        href: link.href,
        text: link.textContent?.trim() || '',
        innerHTML: link.innerHTML.substring(0, 200)
      }));
    });

    await browser.close();
    
    return NextResponse.json({
      success: true,
      message: '页面调试信息',
      data: {
        pageInfo,
        potentialLinks,
        keyword
      }
    });
    
  } catch (error) {
    console.error('调试错误:', error);
    return NextResponse.json({
      success: false,
      message: '调试失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: '调试API - 查看小红书页面内容',
    usage: 'POST /api/debug with optional keyword parameter'
  });
}