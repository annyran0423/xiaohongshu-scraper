/**
 * 小红书内容分类系统
 * 基于关键词匹配和内容分析实现自动分类
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 分类规则配置
interface CategoryRule {
  id: string;
  name: string;
  keywords: string[];
  contentPatterns: RegExp[];
  priority: number; // 数字越小优先级越高
}

// 预定义分类规则
const CATEGORY_RULES: CategoryRule[] = [
  {
    id: '美妆护肤',
    name: '美妆护肤',
    keywords: [
      '护肤', '美妆', '化妆', '面膜', '精华', '防晒', '卸妆', '洁面', 
      '保湿', '美白', '抗老', '祛痘', '眼霜', '乳液', '面霜', '口红',
      '彩妆', '粉底', '遮瑕', '眉毛', '眼影', '腮红', '指甲油'
    ],
    contentPatterns: [
      /护肤|美妆|化妆|彩妆/i,
      /面膜|精华|防晒|卸妆/i,
      /口红|粉底|眼影|腮红/i
    ],
    priority: 1
  },
  {
    id: '时尚穿搭',
    name: '时尚穿搭',
    keywords: [
      '穿搭', '时尚', '服装', '搭配', '衣服', '裤子', '裙子', '鞋子',
      '包包', '配饰', '首饰', '手表', '帽子', '围巾', '外套', '毛衣',
      '连衣裙', '牛仔裤', '高跟鞋', '运动鞋', '靴子'
    ],
    contentPatterns: [
      /穿搭|时尚|服装|搭配/i,
      /衣服|裤子|裙子|鞋子/i,
      /包包|配饰|首饰/i
    ],
    priority: 2
  },
  {
    id: '美食',
    name: '美食',
    keywords: [
      '美食', '料理', '菜谱', '做饭', '烹饪', '餐厅', '小吃', '甜品',
      '蛋糕', '面包', '火锅', '烧烤', '炒菜', '汤', '粥', '面条',
      '饺子', '包子', '披萨', '寿司', '咖啡', '奶茶', '饮品'
    ],
    contentPatterns: [
      /美食|料理|菜谱|做饭|烹饪/i,
      /餐厅|小吃|甜品|蛋糕/i,
      /火锅|烧烤|炒菜|面条/i
    ],
    priority: 3
  },
  {
    id: '旅游',
    name: '旅游',
    keywords: [
      '旅游', '旅行', '游记', '攻略', '景点', '酒店', '民宿', '机票',
      '自驾', '徒步', '爬山', '海边', '古镇', '城市', '国外', '国内',
      '拍照', '风景', '文化', '历史', '博物馆', '寺庙'
    ],
    contentPatterns: [
      /旅游|旅行|游记|攻略/i,
      /景点|酒店|民宿/i,
      /自驾|徒步|爬山|海边/i
    ],
    priority: 4
  },
  {
    id: '生活方式',
    name: '生活方式',
    keywords: [
      '生活', '日常', '家居', '装修', '收纳', '清洁', '植物', '宠物',
      '读书', '音乐', '电影', '摄影', '手工', 'DIY', '艺术', '绘画',
      '书法', '花艺', '茶道', '咖啡', '香薰', '瑜伽', '冥想'
    ],
    contentPatterns: [
      /生活|日常|家居|装修/i,
      /收纳|清洁|植物|宠物/i,
      /读书|音乐|电影|摄影/i
    ],
    priority: 5
  },
  {
    id: '健身运动',
    name: '健身运动',
    keywords: [
      '健身', '运动', '锻炼', '减肥', '瘦身', '塑形', '肌肉', '力量',
      '跑步', '游泳', '瑜伽', '普拉提', '舞蹈', '球类', '户外', '登山',
      '骑行', '马拉松', '健康', '营养', '蛋白质', '卡路里'
    ],
    contentPatterns: [
      /健身|运动|锻炼|减肥/i,
      /瘦身|塑形|肌肉|力量/i,
      /跑步|游泳|瑜伽|普拉提/i
    ],
    priority: 6
  },
  {
    id: '学习工作',
    name: '学习工作',
    keywords: [
      '学习', '工作', '职场', '考试', '学生', '上班', '技能', '培训',
      '英语', '编程', '设计', '写作', '演讲', '时间管理', '效率', '笔记',
      '规划', '目标', '成长', '自律', '习惯', '思维', '方法'
    ],
    contentPatterns: [
      /学习|工作|职场|考试/i,
      /技能|培训|英语|编程/i,
      /效率|笔记|规划|目标/i
    ],
    priority: 7
  }
];

// 分类结果接口
interface CategorizationResult {
  categoryId: string;
  categoryName: string;
  confidence: number;
  matchedKeywords: string[];
  matchedPatterns: string[];
}

/**
 * 内容分类函数
 * @param title 标题
 * @param content 内容
 * @param tags 标签数组
 * @returns 分类结果
 */
export async function categorizeContent(
  title: string, 
  content: string, 
  tags: string[] = []
): Promise<CategorizationResult> {
  const text = `${title} ${content} ${tags.join(' ')}`.toLowerCase();
  const results: Array<CategorizationResult & { score: number }> = [];

  // 对每个分类规则进行匹配
  for (const rule of CATEGORY_RULES) {
    let score = 0;
    const matchedKeywords: string[] = [];
    const matchedPatterns: string[] = [];

    // 关键词匹配（权重：1分/关键词）
    for (const keyword of rule.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        score += 1;
        matchedKeywords.push(keyword);
      }
    }

    // 正则模式匹配（权重：3分/模式）
    for (const pattern of rule.contentPatterns) {
      if (pattern.test(text)) {
        score += 3;
        matchedPatterns.push(pattern.source);
      }
    }

    // 优先级调整（优先级越高，得分加成越多）
    const priorityBonus = (8 - rule.priority) * 0.5;
    score += priorityBonus;

    if (score > 0) {
      // 计算置信度（0-1之间）
      const maxPossibleScore = rule.keywords.length + (rule.contentPatterns.length * 3) + priorityBonus;
      const confidence = Math.min(score / maxPossibleScore, 1);

      results.push({
        categoryId: rule.id,
        categoryName: rule.name,
        confidence: confidence,
        matchedKeywords,
        matchedPatterns,
        score
      });
    }
  }

  if (results.length === 0) {
    // 默认分类：其他
    return {
      categoryId: '其他',
      categoryName: '其他',
      confidence: 0.1,
      matchedKeywords: [],
      matchedPatterns: []
    };
  }

  // 按得分排序，返回最高分的分类
  results.sort((a, b) => b.score - a.score);
  const bestMatch = results[0];

  return {
    categoryId: bestMatch.categoryId,
    categoryName: bestMatch.categoryName,
    confidence: bestMatch.confidence,
    matchedKeywords: bestMatch.matchedKeywords,
    matchedPatterns: bestMatch.matchedPatterns
  };
}

/**
 * 批量分类处理
 * @param posts 帖子数组
 * @returns 分类结果数组
 */
export async function batchCategorize(posts: Array<{
  id: string;
  title: string;
  content: string;
  tags?: string[];
}>): Promise<Array<{
  id: string;
  category: CategorizationResult;
}>> {
  const results = [];

  for (const post of posts) {
    const category = await categorizeContent(post.title, post.content, post.tags);
    results.push({
      id: post.id,
      category
    });
  }

  return results;
}

/**
 * 获取分类对应的UUID
 * @param categoryName 分类名称
 * @returns 分类UUID
 */
export async function getCategoryUUID(categoryName: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('categories')
    .select('id')
    .eq('name', categoryName)
    .single();

  if (error || !data) {
    console.error('获取分类UUID失败:', error);
    return null;
  }

  return data.id;
}

/**
 * 更新帖子分类
 * @param postId 帖子ID
 * @param categoryName 分类名称
 * @param confidence 置信度
 * @returns 更新是否成功
 */
export async function updatePostCategory(
  postId: string,
  categoryName: string,
  confidence: number
): Promise<boolean> {
  try {
    const categoryUUID = await getCategoryUUID(categoryName);
    if (!categoryUUID) {
      console.error('未找到分类UUID:', categoryName);
      return false;
    }

    const { error } = await supabase
      .from('posts')
      .update({
        category_id: categoryUUID,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId);

    if (error) {
      console.error('更新帖子分类失败:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('更新帖子分类异常:', error);
    return false;
  }
}
