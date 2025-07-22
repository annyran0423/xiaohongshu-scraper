import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import { supabase } from '@/lib/supabase';

// 设置API路由超时时间（Vercel Pro: 300s, Hobby: 10s）
export const maxDuration = 300;

// 添加CORS头部
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// 小红书爬虫API接口
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let browser = null;
  
  try {
    const { keyword, limit = 10 } = await request.json();
    
    if (!keyword) {
      return NextResponse.json(
        { error: '关键词不能为空' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 检查是否接近超时限制
    const timeElapsed = Date.now() - startTime;
    if (timeElapsed > 250000) { // 250秒超时保护
      return NextResponse.json(
        { error: '请求处理时间过长，请稍后重试' },
        { status: 408, headers: corsHeaders }
      );
    }

    // 启动浏览器 - 针对无服务器环境优化
    browser = await puppeteer.launch({
      headless: 'new',
      timeout: 30000,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-features=VizDisplayCompositor',
        '--disable-extensions',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-ipc-flooding-protection',
        '--memory-pressure-off',
        '--max_old_space_size=4096'
      ],
      // Vercel特定配置
      ...(process.env.VERCEL ? {
        executablePath: '/usr/bin/chromium-browser'
      } : {})
    });

    const page = await browser.newPage();
    
    // 设置用户代理
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // 访问小红书首页（搜索页面反爬虫更严格）
    const url = 'https://www.xiaohongshu.com';
    console.log('正在访问小红书首页:', url);
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // 等待内容加载
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 提取帖子数据
    const posts = await page.evaluate((maxPosts) => {
      // 尝试多种可能的选择器
      const selectors = [
        'section[class*="note"]',
        'div[class*="note"]',
        'a[href*="/explore/"]',
        '.feeds-page section',
        '[class*="feed"]',
        '.note-item',
        'section'
      ];
      
      let postElements = [];
      for (const selector of selectors) {
        postElements = document.querySelectorAll(selector);
        if (postElements.length > 0) break;
      }
      
      // 如果还是没找到，尝试更通用的选择器
      if (postElements.length === 0) {
        postElements = document.querySelectorAll('a[href*="/explore/"], a[href*="/discovery/"]');
      }
      
      const results = [];
      console.log(`找到 ${postElements.length} 个潜在元素`);
      
      for (let i = 0; i < Math.min(postElements.length, maxPosts * 3); i++) {
        const element = postElements[i];
        
        // 尝试提取标题
        const titleElement = element.querySelector('span, p, div') || element;
        const title = titleElement?.textContent?.trim() || titleElement?.title || titleElement?.alt;
        
        // 尝试提取链接
        let url = '';
        if (element.tagName === 'A') {
          url = element.href;
        } else {
          const linkElement = element.querySelector('a[href*="/explore/"], a[href*="/discovery/"]');
          url = linkElement?.href || '';
        }
        
        // 尝试提取图片
        const imgElement = element.querySelector('img');
        const imageUrl = imgElement?.src;
        
        // 尝试提取作者信息
        const authorElement = element.querySelector('[class*="author"], [class*="user"], [class*="name"]');
        const author = authorElement?.textContent?.trim();
        
        // 数据验证和清理
        if (title && title.length > 3 && title.length < 500 && url && url.includes('xiaohongshu.com')) {
          const cleanTitle = title.replace(/[\n\r\t]/g, ' ').trim();
          const finalUrl = url.startsWith('http') ? url : `https://www.xiaohongshu.com${url}`;
          
          results.push({
            title: cleanTitle.substring(0, 200),
            content: cleanTitle,
            author: author || '未知用户',
            url: finalUrl,
            images: imageUrl && imageUrl.startsWith('http') ? [imageUrl] : [],
            tags: [],
            platform: 'xiaohongshu'
          });
          
          if (results.length >= maxPosts) break;
        }
      }
      
      return results;
    }, limit);

    // 确保浏览器正确关闭
    if (browser) {
      await browser.close();
      browser = null;
    }
    
    if (posts.length === 0) {
      return NextResponse.json({
        success: false,
        message: '未找到相关内容，可能是网页结构发生变化或访问受限',
        data: [],
        executionTime: Date.now() - startTime
      }, { headers: corsHeaders });
    }
    
    // 存储到数据库
    const postsWithCategory = posts.map(post => ({
      ...post,
      category_id: '962b64e7-b7b8-4d08-924c-e90fcc65e77b', // 默认分类：其他
      keyword_used: keyword
    }));
    
    const { data, error } = await supabase
      .from('posts')
      .insert(postsWithCategory)
      .select();
    
    if (error) {
      console.error('数据库插入错误:', error);
      return NextResponse.json({
        success: false,
        message: '数据存储失败',
        error: error.message,
        scraped_data: posts // 返回爬取的数据供调试
      }, { status: 500 });
    }
    
    // 更新关键词统计
    await supabase
      .from('keywords')
      .upsert({
        keyword: keyword,
        search_count: 1,
        last_used: new Date().toISOString()
      }, {
        onConflict: 'keyword'
      });
    
    return NextResponse.json({
      success: true,
      message: `成功抓取到 ${posts.length} 条数据`,
      data: data,
      stats: {
        keyword: keyword,
        total_scraped: posts.length,
        total_saved: data?.length || 0
      },
      executionTime: Date.now() - startTime
    }, { headers: corsHeaders });
    
  } catch (error) {
    console.error('爬虫错误:', error);
    
    // 确保浏览器在错误时也能正确关闭
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('浏览器关闭失败:', closeError);
      }
    }
    
    // 检查是否是超时错误
    const isTimeout = error instanceof Error && 
      (error.message.includes('timeout') || error.message.includes('Navigation timeout'));
    
    return NextResponse.json({
      success: false,
      message: isTimeout ? '请求超时，请稍后重试' : '爬虫执行失败',
      error: error instanceof Error ? error.message : '未知错误',
      executionTime: Date.now() - startTime
    }, { 
      status: isTimeout ? 408 : 500,
      headers: corsHeaders 
    });
  }
}

// GET 方法用于测试
export async function GET() {
  return NextResponse.json({
    message: '小红书爬虫API',
    usage: '使用POST方法发送 { "keyword": "关键词", "limit": 10 }',
    endpoints: {
      scrape: 'POST /api/scrape'
    },
    status: 'active',
    version: '1.0.0',
    serverless: true
  }, { headers: corsHeaders });
}

// OPTIONS 方法用于CORS预检请求
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}