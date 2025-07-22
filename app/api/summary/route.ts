/**
 * 总结分析API路由
 * 提供内容摘要生成和统计分析功能
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  generateKeywordSummary, 
  generateOverallStats 
} from '@/lib/summarization';
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
 * GET /api/summary - 获取各种类型的总结分析
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overall';
    const keyword = searchParams.get('keyword');
    const limit = parseInt(searchParams.get('limit') || '100');
    
    // 检查超时
    if (Date.now() - startTime > 250000) {
      return NextResponse.json(
        { error: '请求处理时间过长，请稍后重试' },
        { status: 408, headers: corsHeaders }
      );
    }

    switch (type) {
      case 'keyword':
        // 关键词摘要分析
        if (!keyword) {
          return NextResponse.json(
            { error: '请提供关键词参数' },
            { status: 400, headers: corsHeaders }
          );
        }

        const keywordSummary = await generateKeywordSummary(keyword, limit);
        
        return NextResponse.json({
          success: true,
          type: 'keyword',
          keyword,
          limit,
          data: keywordSummary,
          generatedAt: new Date().toISOString(),
          executionTime: Date.now() - startTime
        }, { headers: corsHeaders });

      case 'overall':
        // 整体统计摘要
        const overallStats = await generateOverallStats();
        
        return NextResponse.json({
          success: true,
          type: 'overall',
          data: overallStats,
          generatedAt: new Date().toISOString(),
          executionTime: Date.now() - startTime
        }, { headers: corsHeaders });

      case 'categories':
        // 分类详细分析
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('posts')
          .select(`
            id,
            title,
            content,
            author,
            tags,
            created_at,
            category_id,
            categories (
              id,
              name,
              description
            )
          `)
          .not('category_id', 'is', null)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (categoriesError) {
          return NextResponse.json(
            { 
              error: `获取分类数据失败: ${categoriesError.message}`,
              executionTime: Date.now() - startTime
            },
            { status: 500, headers: corsHeaders }
          );
        }

        // 按分类分组统计
        const categoryGroups = new Map();
        categoriesData?.forEach(post => {
          const categoryName = post.categories?.name || '未分类';
          if (!categoryGroups.has(categoryName)) {
            categoryGroups.set(categoryName, {
              categoryId: post.category_id,
              categoryName,
              posts: [],
              totalPosts: 0,
              authors: new Set(),
              keywords: new Map(),
              timeRange: { earliest: null, latest: null }
            });
          }
          
          const group = categoryGroups.get(categoryName);
          group.posts.push(post);
          group.totalPosts++;
          group.authors.add(post.author);
          
          // 统计关键词
          (post.tags || []).forEach((tag: string) => {
            group.keywords.set(tag, (group.keywords.get(tag) || 0) + 1);
          });

          // 更新时间范围
          const postTime = new Date(post.created_at);
          if (!group.timeRange.earliest || postTime < new Date(group.timeRange.earliest)) {
            group.timeRange.earliest = post.created_at;
          }
          if (!group.timeRange.latest || postTime > new Date(group.timeRange.latest)) {
            group.timeRange.latest = post.created_at;
          }
        });

        // 转换为响应格式
        const categoryAnalysis = Array.from(categoryGroups.values()).map(group => ({
          categoryId: group.categoryId,
          categoryName: group.categoryName,
          totalPosts: group.totalPosts,
          uniqueAuthors: group.authors.size,
          topAuthors: Array.from(group.authors).slice(0, 5),
          topKeywords: Array.from(group.keywords.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([keyword, count]) => ({ keyword, count })),
          timeRange: group.timeRange,
          samplePosts: group.posts.slice(0, 3).map((post: any) => ({
            id: post.id,
            title: post.title,
            author: post.author,
            createdAt: post.created_at
          })),
          averageContentLength: Math.round(
            group.posts.reduce((sum: number, post: any) => 
              sum + (post.title?.length || 0) + (post.content?.length || 0), 0
            ) / group.totalPosts
          )
        })).sort((a, b) => b.totalPosts - a.totalPosts);

        return NextResponse.json({
          success: true,
          type: 'categories',
          totalCategories: categoryAnalysis.length,
          data: categoryAnalysis,
          generatedAt: new Date().toISOString()
        });

      case 'trends':
        // 趋势分析
        const { data: trendsData, error: trendsError } = await supabase
          .from('posts')
          .select('created_at, author, tags, category_id, categories(name)')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (trendsError) {
          return NextResponse.json(
            { error: `获取趋势数据失败: ${trendsError.message}` },
            { status: 500 }
          );
        }

        // 按时间段分析
        const now = new Date();
        const timeSegments = {
          '最近24小时': { posts: [], cutoff: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
          '最近7天': { posts: [], cutoff: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
          '最近30天': { posts: [], cutoff: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
        };

        trendsData?.forEach(post => {
          const postDate = new Date(post.created_at);
          Object.entries(timeSegments).forEach(([period, segment]) => {
            if (postDate >= segment.cutoff) {
              segment.posts.push(post);
            }
          });
        });

        const trendAnalysis = Object.entries(timeSegments).map(([period, segment]) => {
          const posts = segment.posts;
          const authorCount = new Map<string, number>();
          const categoryCount = new Map<string, number>();
          const keywordCount = new Map<string, number>();

          posts.forEach((post: any) => {
            // 统计作者
            authorCount.set(post.author, (authorCount.get(post.author) || 0) + 1);
            
            // 统计分类
            const categoryName = post.categories?.name || '未分类';
            categoryCount.set(categoryName, (categoryCount.get(categoryName) || 0) + 1);
            
            // 统计关键词
            (post.tags || []).forEach((tag: string) => {
              keywordCount.set(tag, (keywordCount.get(tag) || 0) + 1);
            });
          });

          return {
            period,
            totalPosts: posts.length,
            topAuthors: Array.from(authorCount.entries())
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([author, count]) => ({ author, count })),
            topCategories: Array.from(categoryCount.entries())
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([category, count]) => ({ category, count })),
            topKeywords: Array.from(keywordCount.entries())
              .sort((a, b) => b[1] - a[1])
              .slice(0, 10)
              .map(([keyword, count]) => ({ keyword, count }))
          };
        });

        return NextResponse.json({
          success: true,
          type: 'trends',
          data: trendAnalysis,
          generatedAt: new Date().toISOString()
        });

      case 'keywords':
        // 关键词分析
        const { data: keywordsData, error: keywordsError } = await supabase
          .from('keywords')
          .select('*')
          .order('search_count', { ascending: false })
          .limit(50);

        if (keywordsError) {
          return NextResponse.json(
            { error: `获取关键词数据失败: ${keywordsError.message}` },
            { status: 500 }
          );
        }

        // 获取每个关键词对应的帖子统计
        const keywordAnalysis = await Promise.all(
          (keywordsData || []).slice(0, 20).map(async (keywordData: any) => {
            const { data: posts, error } = await supabase
              .from('posts')
              .select(`
                id,
                title,
                author,
                created_at,
                categories(name)
              `)
              .eq('keyword_used', keywordData.keyword)
              .order('created_at', { ascending: false })
              .limit(10);

            const categoryDistribution = new Map<string, number>();
            const authorDistribution = new Map<string, number>();

            posts?.forEach(post => {
              const categoryName = post.categories?.name || '未分类';
              categoryDistribution.set(categoryName, (categoryDistribution.get(categoryName) || 0) + 1);
              authorDistribution.set(post.author, (authorDistribution.get(post.author) || 0) + 1);
            });

            return {
              keyword: keywordData.keyword,
              searchCount: keywordData.search_count,
              lastUsed: keywordData.last_used,
              totalPosts: posts?.length || 0,
              categories: Array.from(categoryDistribution.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([category, count]) => ({ category, count })),
              topAuthors: Array.from(authorDistribution.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([author, count]) => ({ author, count })),
              recentPosts: posts?.slice(0, 3).map(post => ({
                id: post.id,
                title: post.title,
                author: post.author,
                createdAt: post.created_at
              })) || []
            };
          })
        );

        return NextResponse.json({
          success: true,
          type: 'keywords',
          totalKeywords: keywordsData?.length || 0,
          data: keywordAnalysis,
          generatedAt: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: '无效的摘要类型。支持: overall, keyword, categories, trends, keywords' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('总结分析API错误:', error);
    return NextResponse.json(
      { error: '生成摘要失败: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/summary - 生成自定义摘要报告
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      keywords, 
      categories, 
      dateRange, 
      authors, 
      limit = 100,
      includeStats = true,
      includeInsights = true 
    } = body;

    // 构建查询条件
    let query = supabase
      .from('posts')
      .select(`
        id,
        title,
        content,
        author,
        tags,
        created_at,
        keyword_used,
        category_id,
        categories (
          id,
          name,
          description
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    // 应用筛选条件
    if (keywords && keywords.length > 0) {
      query = query.in('keyword_used', keywords);
    }

    if (categories && categories.length > 0) {
      query = query.in('category_id', categories);
    }

    if (authors && authors.length > 0) {
      query = query.in('author', authors);
    }

    if (dateRange && dateRange.start) {
      query = query.gte('created_at', dateRange.start);
    }

    if (dateRange && dateRange.end) {
      query = query.lte('created_at', dateRange.end);
    }

    const { data: posts, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: `获取数据失败: ${error.message}` },
        { status: 500 }
      );
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json({
        success: true,
        message: '没有找到符合条件的数据',
        data: {
          totalPosts: 0,
          filters: { keywords, categories, dateRange, authors },
          summary: null
        }
      });
    }

    // 生成自定义摘要
    const customSummary = {
      totalPosts: posts.length,
      filters: { keywords, categories, dateRange, authors, limit },
      
      // 基础统计
      stats: includeStats ? {
        authorCount: new Set(posts.map(p => p.author)).size,
        categoryDistribution: getCategoryDistribution(posts),
        keywordDistribution: getKeywordDistribution(posts),
        timeDistribution: getTimeDistribution(posts)
      } : null,

      // 深度洞察
      insights: includeInsights ? {
        topContent: posts
          .sort((a, b) => (b.title?.length || 0) + (b.content?.length || 0) - ((a.title?.length || 0) + (a.content?.length || 0)))
          .slice(0, 5)
          .map(post => ({
            id: post.id,
            title: post.title,
            author: post.author,
            category: post.categories?.name,
            contentLength: (post.title?.length || 0) + (post.content?.length || 0),
            createdAt: post.created_at
          })),
        
        contentPatterns: analyzeContentPatterns(posts),
        authorInsights: analyzeAuthorInsights(posts),
        temporalPatterns: analyzeTemporalPatterns(posts)
      } : null,

      // 摘要文本
      textSummary: generateTextSummary(posts, { keywords, categories, dateRange, authors })
    };

    return NextResponse.json({
      success: true,
      type: 'custom',
      data: customSummary,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('自定义摘要生成错误:', error);
    return NextResponse.json(
      { error: '生成自定义摘要失败: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// 辅助函数
function getCategoryDistribution(posts: any[]) {
  const distribution = new Map<string, number>();
  posts.forEach(post => {
    const category = post.categories?.name || '未分类';
    distribution.set(category, (distribution.get(category) || 0) + 1);
  });
  return Array.from(distribution.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => ({
      category,
      count,
      percentage: Math.round((count / posts.length) * 100)
    }));
}

function getKeywordDistribution(posts: any[]) {
  const distribution = new Map<string, number>();
  posts.forEach(post => {
    (post.tags || []).forEach((tag: string) => {
      distribution.set(tag, (distribution.get(tag) || 0) + 1);
    });
  });
  return Array.from(distribution.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([keyword, count]) => ({ keyword, count }));
}

function getTimeDistribution(posts: any[]) {
  const now = new Date();
  const timeRanges = {
    '今天': 0,
    '本周': 0,
    '本月': 0,
    '更早': 0
  };

  posts.forEach(post => {
    const postDate = new Date(post.created_at);
    const diffHours = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60);

    if (diffHours <= 24) {
      timeRanges['今天']++;
    } else if (diffHours <= 168) {
      timeRanges['本周']++;
    } else if (diffHours <= 720) {
      timeRanges['本月']++;
    } else {
      timeRanges['更早']++;
    }
  });

  return Object.entries(timeRanges)
    .filter(([, count]) => count > 0)
    .map(([period, count]) => ({ period, count }));
}

function analyzeContentPatterns(posts: any[]) {
  return [
    '平均内容长度: ' + Math.round(posts.reduce((sum, post) => 
      sum + (post.title?.length || 0) + (post.content?.length || 0), 0) / posts.length),
    '包含标签的帖子: ' + Math.round((posts.filter(p => p.tags && p.tags.length > 0).length / posts.length) * 100) + '%',
    '平均标签数量: ' + Math.round(posts.reduce((sum, post) => sum + (post.tags?.length || 0), 0) / posts.length)
  ];
}

function analyzeAuthorInsights(posts: any[]) {
  const authorStats = new Map<string, number>();
  posts.forEach(post => {
    authorStats.set(post.author, (authorStats.get(post.author) || 0) + 1);
  });

  const topAuthors = Array.from(authorStats.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return {
    totalAuthors: authorStats.size,
    topAuthors: topAuthors.map(([author, count]) => ({ author, count })),
    averagePostsPerAuthor: Math.round(posts.length / authorStats.size)
  };
}

function analyzeTemporalPatterns(posts: any[]) {
  const hourlyDistribution = new Array(24).fill(0);
  const dailyDistribution = new Array(7).fill(0);

  posts.forEach(post => {
    const date = new Date(post.created_at);
    hourlyDistribution[date.getHours()]++;
    dailyDistribution[date.getDay()]++;
  });

  const peakHour = hourlyDistribution.indexOf(Math.max(...hourlyDistribution));
  const peakDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][
    dailyDistribution.indexOf(Math.max(...dailyDistribution))
  ];

  return {
    peakPostingHour: peakHour + ':00',
    peakPostingDay: peakDay,
    hourlyPattern: hourlyDistribution,
    dailyPattern: dailyDistribution
  };
}

function generateTextSummary(posts: any[], filters: any) {
  const totalPosts = posts.length;
  const categories = getCategoryDistribution(posts);
  const topCategory = categories[0]?.category || '未知';
  const authorCount = new Set(posts.map(p => p.author)).size;
  
  let summary = `本次分析包含${totalPosts}篇帖子，来自${authorCount}位作者。`;
  
  if (filters.keywords && filters.keywords.length > 0) {
    summary += `主要关键词包括：${filters.keywords.join('、')}。`;
  }
  
  summary += `内容主要集中在${topCategory}分类，占比${categories[0]?.percentage || 0}%。`;
  
  if (filters.dateRange) {
    summary += `数据时间范围从${filters.dateRange.start || '开始'}到${filters.dateRange.end || '现在'}。`;
  }

  return summary;
}
