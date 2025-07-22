/**
 * 分类API路由
 * 提供内容自动分类和批量分类处理功能
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  categorizeContent, 
  batchCategorize, 
  updatePostCategory,
  getCategoryUUID 
} from '@/lib/categorization';
import { createClient } from '@supabase/supabase-js';

// 设置API路由超时时间
export const maxDuration = 300;

// 添加CORS头部
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * POST /api/categorize - 单个内容分类或批量分类
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { type, postId, title, content, tags, keyword, limit, updateDatabase } = body;
    
    // 检查超时
    if (Date.now() - startTime > 250000) {
      return NextResponse.json(
        { error: '请求处理时间过长，请稍后重试' },
        { status: 408, headers: corsHeaders }
      );
    }

    if (type === 'single') {
      // 单个内容分类
      if (!title && !content) {
        return NextResponse.json(
          { error: '标题或内容不能为空' },
          { status: 400, headers: corsHeaders }
        );
      }

      const result = await categorizeContent(title || '', content || '', tags || []);

      // 如果提供了postId且需要更新数据库
      if (postId && updateDatabase) {
        const success = await updatePostCategory(postId, result.categoryName, result.confidence);
        if (!success) {
          return NextResponse.json(
            { 
              error: '分类成功但数据库更新失败',
              classification: result,
              executionTime: Date.now() - startTime
            },
            { status: 207, headers: corsHeaders } // 部分成功
          );
        }
      }

      return NextResponse.json({
        success: true,
        classification: result,
        updated: postId && updateDatabase,
        executionTime: Date.now() - startTime
      }, { headers: corsHeaders });

    } else if (type === 'batch') {
      // 批量分类处理
      let query = supabase
        .from('posts')
        .select('id, title, content, tags, category_id')
        .order('created_at', { ascending: false });

      // 如果指定了关键词，只处理该关键词的帖子
      if (keyword) {
        query = query.eq('keyword_used', keyword);
      }

      // 限制处理数量
      if (limit && limit > 0) {
        query = query.limit(limit);
      }

      const { data: posts, error } = await query;

      if (error) {
        return NextResponse.json(
          { 
            error: `获取帖子数据失败: ${error.message}`,
            executionTime: Date.now() - startTime
          },
          { status: 500, headers: corsHeaders }
        );
      }

      if (!posts || posts.length === 0) {
        return NextResponse.json({
          success: true,
          message: '没有找到需要分类的帖子',
          processed: 0,
          results: [],
          executionTime: Date.now() - startTime
        }, { headers: corsHeaders });
      }

      // 执行批量分类
      const batchResults = await batchCategorize(posts);
      let successCount = 0;
      let failureCount = 0;
      const results = [];

      // 如果需要更新数据库
      if (updateDatabase) {
        for (const result of batchResults) {
          const success = await updatePostCategory(
            result.id, 
            result.category.categoryName, 
            result.category.confidence
          );
          
          if (success) {
            successCount++;
          } else {
            failureCount++;
          }

          results.push({
            postId: result.id,
            classification: result.category,
            updated: success
          });
        }
      } else {
        // 只返回分类结果，不更新数据库
        results.push(...batchResults.map(result => ({
          postId: result.id,
          classification: result.category,
          updated: false
        })));
        successCount = batchResults.length;
      }

      return NextResponse.json({
        success: true,
        processed: posts.length,
        successCount,
        failureCount,
        results: results.slice(0, 10), // 只返回前10个结果用于展示
        summary: {
          totalProcessed: posts.length,
          databaseUpdated: updateDatabase,
          keyword: keyword || 'all'
        },
        executionTime: Date.now() - startTime
      }, { headers: corsHeaders });

    } else if (type === 'reprocess') {
      // 重新处理未分类或分类置信度低的帖子
      const { data: posts, error } = await supabase
        .from('posts')
        .select('id, title, content, tags, category_id')
        .or('category_id.is.null,confidence.lt.0.5')
        .limit(limit || 50);

      if (error) {
        return NextResponse.json(
          { 
            error: `获取待重新分类帖子失败: ${error.message}`,
            executionTime: Date.now() - startTime
          },
          { status: 500, headers: corsHeaders }
        );
      }

      if (!posts || posts.length === 0) {
        return NextResponse.json({
          success: true,
          message: '没有需要重新分类的帖子',
          processed: 0,
          executionTime: Date.now() - startTime
        }, { headers: corsHeaders });
      }

      const batchResults = await batchCategorize(posts);
      let successCount = 0;

      for (const result of batchResults) {
        const success = await updatePostCategory(
          result.id, 
          result.category.categoryName, 
          result.category.confidence
        );
        
        if (success) successCount++;
      }

      return NextResponse.json({
        success: true,
        processed: posts.length,
        updated: successCount,
        message: `重新分类完成：${successCount}/${posts.length} 成功更新`,
        executionTime: Date.now() - startTime
      }, { headers: corsHeaders });

    } else {
      return NextResponse.json(
        { error: '无效的分类类型，支持: single, batch, reprocess' },
        { status: 400, headers: corsHeaders }
      );
    }

  } catch (error) {
    console.error('分类API错误:', error);
    return NextResponse.json(
      { 
        error: '分类处理失败: ' + (error as Error).message,
        executionTime: Date.now() - startTime
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * GET /api/categorize - 获取分类统计信息
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'stats';
    
    // 检查超时
    if (Date.now() - startTime > 250000) {
      return NextResponse.json(
        { error: '请求处理时间过长，请稍后重试' },
        { status: 408, headers: corsHeaders }
      );
    }

    if (type === 'stats') {
      // 获取分类统计
      const { data: categoryStats, error: categoryError } = await supabase
        .from('posts')
        .select(`
          categories (
            id,
            name
          )
        `)
        .not('category_id', 'is', null);

      if (categoryError) {
        return NextResponse.json(
          { 
            error: `获取分类统计失败: ${categoryError.message}`,
            executionTime: Date.now() - startTime
          },
          { status: 500, headers: corsHeaders }
        );
      }

      // 统计每个分类的帖子数量
      const stats = new Map<string, { name: string; count: number }>();
      
      categoryStats?.forEach(post => {
        const categoryName = post.categories?.name || '未分类';
        if (!stats.has(categoryName)) {
          stats.set(categoryName, { name: categoryName, count: 0 });
        }
        stats.get(categoryName)!.count++;
      });

      // 获取未分类帖子数量
      const { count: unclassifiedCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .is('category_id', null);

      const result = {
        totalPosts: categoryStats?.length || 0,
        unclassifiedPosts: unclassifiedCount || 0,
        categories: Array.from(stats.values()).sort((a, b) => b.count - a.count),
        classificationRate: categoryStats?.length && unclassifiedCount 
          ? Math.round((categoryStats.length / (categoryStats.length + unclassifiedCount)) * 100)
          : 0
      };

      return NextResponse.json({
        success: true,
        stats: result,
        executionTime: Date.now() - startTime
      }, { headers: corsHeaders });

    } else if (type === 'categories') {
      // 获取所有可用分类
      const { data: categories, error } = await supabase
        .from('categories')
        .select('id, name, description')
        .order('name');

      if (error) {
        return NextResponse.json(
          { 
            error: `获取分类列表失败: ${error.message}`,
            executionTime: Date.now() - startTime
          },
          { status: 500, headers: corsHeaders }
        );
      }

      return NextResponse.json({
        success: true,
        categories: categories || [],
        executionTime: Date.now() - startTime
      }, { headers: corsHeaders });

    } else {
      return NextResponse.json(
        { error: '无效的查询类型，支持: stats, categories' },
        { status: 400, headers: corsHeaders }
      );
    }

  } catch (error) {
    console.error('获取分类信息错误:', error);
    return NextResponse.json(
      { 
        error: '获取分类信息失败: ' + (error as Error).message,
        executionTime: Date.now() - startTime
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

// OPTIONS 方法用于CORS预检请求
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}
