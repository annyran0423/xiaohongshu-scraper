/**
 * 小红书内容总结系统
 * 提供内容摘要生成和统计分析功能
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 总结数据接口
interface PostSummary {
  totalPosts: number;
  categories: CategorySummary[];
  keywords: KeywordSummary[];
  timeRange: {
    earliest: string;
    latest: string;
  };
  authorStats: AuthorStats[];
  contentInsights: ContentInsights;
}

interface CategorySummary {
  categoryId: string;
  categoryName: string;
  postCount: number;
  percentage: number;
  topKeywords: string[];
  samplePosts: SamplePost[];
}

interface KeywordSummary {
  keyword: string;
  frequency: number;
  categories: string[];
  recentUsage: string;
}

interface AuthorStats {
  author: string;
  postCount: number;
  categories: string[];
  totalEngagement: number;
}

interface ContentInsights {
  averageContentLength: number;
  commonPatterns: string[];
  trending: {
    topics: string[];
    authors: string[];
    timeFrames: string[];
  };
  engagement: {
    highPerformance: SamplePost[];
    patterns: string[];
  };
}

interface SamplePost {
  id: string;
  title: string;
  author: string;
  url: string;
  createdAt: string;
}

/**
 * 生成关键词搜索的总结报告
 * @param keyword 搜索关键词
 * @param limit 限制返回的帖子数量
 * @returns 总结报告
 */
export async function generateKeywordSummary(
  keyword: string,
  limit: number = 100
): Promise<PostSummary> {
  try {
    // 获取相关帖子数据
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        content,
        author,
        url,
        tags,
        created_at,
        category_id,
        categories (
          id,
          name
        )
      `)
      .eq('keyword_used', keyword)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`获取帖子数据失败: ${error.message}`);
    }

    if (!posts || posts.length === 0) {
      return createEmptySummary();
    }

    // 分析分类分布
    const categoryStats = analyzeCategoryDistribution(posts);
    
    // 分析关键词频率
    const keywordStats = analyzeKeywordFrequency(posts);
    
    // 分析作者统计
    const authorStats = analyzeAuthorStats(posts);
    
    // 生成内容洞察
    const contentInsights = generateContentInsights(posts);
    
    // 计算时间范围
    const timeRange = calculateTimeRange(posts);

    return {
      totalPosts: posts.length,
      categories: categoryStats,
      keywords: keywordStats,
      timeRange,
      authorStats,
      contentInsights
    };

  } catch (error) {
    console.error('生成摘要失败:', error);
    throw error;
  }
}

/**
 * 分析分类分布
 */
function analyzeCategoryDistribution(posts: any[]): CategorySummary[] {
  const categoryMap = new Map<string, {
    categoryId: string;
    categoryName: string;
    posts: any[];
  }>();

  // 统计每个分类的帖子
  posts.forEach(post => {
    const categoryId = post.category_id;
    const categoryName = post.categories?.name || '未分类';
    
    if (!categoryMap.has(categoryId)) {
      categoryMap.set(categoryId, {
        categoryId,
        categoryName,
        posts: []
      });
    }
    
    categoryMap.get(categoryId)!.posts.push(post);
  });

  // 生成分类摘要
  const totalPosts = posts.length;
  const categories: CategorySummary[] = [];

  categoryMap.forEach(({ categoryId, categoryName, posts: categoryPosts }) => {
    const postCount = categoryPosts.length;
    const percentage = Math.round((postCount / totalPosts) * 100);
    
    // 提取该分类的热门关键词
    const topKeywords = extractTopKeywords(categoryPosts, 5);
    
    // 选择样例帖子
    const samplePosts = categoryPosts
      .slice(0, 3)
      .map(post => ({
        id: post.id,
        title: post.title,
        author: post.author,
        url: post.url,
        createdAt: post.created_at
      }));

    categories.push({
      categoryId,
      categoryName,
      postCount,
      percentage,
      topKeywords,
      samplePosts
    });
  });

  // 按帖子数量排序
  return categories.sort((a, b) => b.postCount - a.postCount);
}

/**
 * 分析关键词频率
 */
function analyzeKeywordFrequency(posts: any[]): KeywordSummary[] {
  const keywordMap = new Map<string, {
    frequency: number;
    categories: Set<string>;
    lastUsed: string;
  }>();

  posts.forEach(post => {
    const tags = post.tags || [];
    const categoryName = post.categories?.name || '未分类';
    const createdAt = post.created_at;

    // 处理标签
    tags.forEach((tag: string) => {
      if (!keywordMap.has(tag)) {
        keywordMap.set(tag, {
          frequency: 0,
          categories: new Set(),
          lastUsed: createdAt
        });
      }
      
      const entry = keywordMap.get(tag)!;
      entry.frequency++;
      entry.categories.add(categoryName);
      
      // 更新最近使用时间
      if (new Date(createdAt) > new Date(entry.lastUsed)) {
        entry.lastUsed = createdAt;
      }
    });
  });

  // 转换为数组并排序
  const keywords: KeywordSummary[] = Array.from(keywordMap.entries())
    .map(([keyword, data]) => ({
      keyword,
      frequency: data.frequency,
      categories: Array.from(data.categories),
      recentUsage: data.lastUsed
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 20); // 只返回前20个热门关键词

  return keywords;
}

/**
 * 分析作者统计
 */
function analyzeAuthorStats(posts: any[]): AuthorStats[] {
  const authorMap = new Map<string, {
    postCount: number;
    categories: Set<string>;
  }>();

  posts.forEach(post => {
    const author = post.author;
    const categoryName = post.categories?.name || '未分类';

    if (!authorMap.has(author)) {
      authorMap.set(author, {
        postCount: 0,
        categories: new Set()
      });
    }

    const entry = authorMap.get(author)!;
    entry.postCount++;
    entry.categories.add(categoryName);
  });

  const authorStats: AuthorStats[] = Array.from(authorMap.entries())
    .map(([author, data]) => ({
      author,
      postCount: data.postCount,
      categories: Array.from(data.categories),
      totalEngagement: data.postCount // 简化的参与度计算
    }))
    .sort((a, b) => b.postCount - a.postCount)
    .slice(0, 10); // 只返回前10个活跃作者

  return authorStats;
}

/**
 * 生成内容洞察
 */
function generateContentInsights(posts: any[]): ContentInsights {
  // 计算平均内容长度
  const totalLength = posts.reduce((sum, post) => {
    return sum + (post.content?.length || 0) + (post.title?.length || 0);
  }, 0);
  const averageContentLength = Math.round(totalLength / posts.length);

  // 提取常见模式
  const commonPatterns = extractCommonPatterns(posts);

  // 分析趋势
  const trendingTopics = extractTopKeywords(posts, 10);
  const trendingAuthors = posts
    .reduce((authorMap: Map<string, number>, post) => {
      const author = post.author;
      authorMap.set(author, (authorMap.get(author) || 0) + 1);
      return authorMap;
    }, new Map())
    .entries();

  const topAuthors = Array.from(trendingAuthors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([author]) => author);

  // 高表现帖子（基于标题长度和内容丰富度）
  const highPerformance = posts
    .map(post => ({
      ...post,
      score: (post.title?.length || 0) + (post.content?.length || 0) + (post.tags?.length || 0) * 10
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(post => ({
      id: post.id,
      title: post.title,
      author: post.author,
      url: post.url,
      createdAt: post.created_at
    }));

  return {
    averageContentLength,
    commonPatterns,
    trending: {
      topics: trendingTopics,
      authors: topAuthors,
      timeFrames: calculateTimeFrames(posts)
    },
    engagement: {
      highPerformance,
      patterns: ['内容丰富', '标题吸引', '标签完整']
    }
  };
}

/**
 * 提取热门关键词
 */
function extractTopKeywords(posts: any[], limit: number): string[] {
  const keywordCount = new Map<string, number>();

  posts.forEach(post => {
    const tags = post.tags || [];
    tags.forEach((tag: string) => {
      keywordCount.set(tag, (keywordCount.get(tag) || 0) + 1);
    });
  });

  return Array.from(keywordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([keyword]) => keyword);
}

/**
 * 提取常见模式
 */
function extractCommonPatterns(posts: any[]): string[] {
  const patterns = [
    '包含表情符号',
    '多图展示',
    '个人经验分享',
    '产品推荐',
    '教程指导'
  ];

  return patterns.filter(pattern => {
    // 简化的模式匹配逻辑
    return posts.some(post => {
      const content = `${post.title} ${post.content}`.toLowerCase();
      switch (pattern) {
        case '包含表情符号':
          return /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(content);
        case '多图展示':
          return (post.images?.length || 0) > 2;
        case '个人经验分享':
          return /我的|经验|分享|心得/.test(content);
        case '产品推荐':
          return /推荐|好用|必买|种草/.test(content);
        case '教程指导':
          return /教程|步骤|方法|如何/.test(content);
        default:
          return false;
      }
    });
  });
}

/**
 * 计算时间范围
 */
function calculateTimeRange(posts: any[]): { earliest: string; latest: string } {
  const dates = posts.map(post => new Date(post.created_at));
  const earliest = new Date(Math.min(...dates.map(d => d.getTime())));
  const latest = new Date(Math.max(...dates.map(d => d.getTime())));

  return {
    earliest: earliest.toISOString(),
    latest: latest.toISOString()
  };
}

/**
 * 计算时间分布
 */
function calculateTimeFrames(posts: any[]): string[] {
  const now = new Date();
  const timeFrames = {
    '最近24小时': 0,
    '最近7天': 0,
    '最近30天': 0,
    '更早': 0
  };

  posts.forEach(post => {
    const postDate = new Date(post.created_at);
    const diffHours = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60);

    if (diffHours <= 24) {
      timeFrames['最近24小时']++;
    } else if (diffHours <= 168) { // 7天
      timeFrames['最近7天']++;
    } else if (diffHours <= 720) { // 30天
      timeFrames['最近30天']++;
    } else {
      timeFrames['更早']++;
    }
  });

  return Object.entries(timeFrames)
    .filter(([, count]) => count > 0)
    .map(([timeFrame, count]) => `${timeFrame}: ${count}篇`);
}

/**
 * 创建空摘要
 */
function createEmptySummary(): PostSummary {
  return {
    totalPosts: 0,
    categories: [],
    keywords: [],
    timeRange: {
      earliest: new Date().toISOString(),
      latest: new Date().toISOString()
    },
    authorStats: [],
    contentInsights: {
      averageContentLength: 0,
      commonPatterns: [],
      trending: {
        topics: [],
        authors: [],
        timeFrames: []
      },
      engagement: {
        highPerformance: [],
        patterns: []
      }
    }
  };
}

/**
 * 生成整体统计摘要
 * @returns 整体统计数据
 */
export async function generateOverallStats(): Promise<{
  totalPosts: number;
  totalKeywords: number;
  totalCategories: number;
  recentActivity: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  topCategories: Array<{ name: string; count: number }>;
  topKeywords: Array<{ keyword: string; count: number }>;
}> {
  try {
    // 获取总帖子数
    const { count: totalPosts } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true });

    // 获取关键词数量
    const { count: totalKeywords } = await supabase
      .from('keywords')
      .select('*', { count: 'exact', head: true });

    // 获取分类数量
    const { count: totalCategories } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true });

    // 获取最近活动统计
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const { count: todayCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    const { count: weekCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thisWeek.toISOString());

    const { count: monthCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thisMonth.toISOString());

    // 获取热门分类
    const { data: allPosts } = await supabase
      .from('posts')
      .select(`
        categories (name)
      `)
      .not('category_id', 'is', null);

    // 在应用层进行分组统计
    const categoryMap = new Map<string, number>();
    allPosts?.forEach(post => {
      const categoryName = post.categories?.name || '未分类';
      categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + 1);
    });

    const categoryStats = Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return {
      totalPosts: totalPosts || 0,
      totalKeywords: totalKeywords || 0,
      totalCategories: totalCategories || 0,
      recentActivity: {
        today: todayCount || 0,
        thisWeek: weekCount || 0,
        thisMonth: monthCount || 0
      },
      topCategories: categoryStats || [],
      topKeywords: [] // 需要进一步实现
    };

  } catch (error) {
    console.error('生成整体统计失败:', error);
    throw error;
  }
}
