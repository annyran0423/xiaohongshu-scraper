'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Hash, 
  Calendar,
  Eye,
  RefreshCw,
  Download
} from 'lucide-react';

interface DashboardStats {
  totalPosts: number;
  totalCategories: number;
  totalKeywords: number;
  totalAuthors: number;
  recentActivity: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  categoryDistribution: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  topAuthors: Array<{
    author: string;
    count: number;
  }>;
  topKeywords: Array<{
    keyword: string;
    count: number;
    lastUsed: string;
  }>;
  dailyActivity: Array<{
    date: string;
    count: number;
  }>;
}

interface DashboardProps {
  stats?: DashboardStats;
  loading?: boolean;
  onRefresh?: () => void;
}

export default function Dashboard({ stats, loading = false, onRefresh }: DashboardProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const getCategoryColor = (categoryName: string) => {
    switch (categoryName) {
      case '美妆护肤':
        return 'bg-pink-500';
      case '时尚穿搭':
        return 'bg-purple-500';
      case '美食':
        return 'bg-orange-500';
      case '旅游':
        return 'bg-blue-500';
      case '生活方式':
        return 'bg-green-500';
      case '健身运动':
        return 'bg-red-500';
      case '学习工作':
        return 'bg-indigo-500';
      default:
        return 'bg-gray-500';
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    color = 'text-gray-600' 
  }: {
    title: string;
    value: string | number;
    change?: string;
    icon: any;
    color?: string;
  }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <p className="text-sm text-green-600 mt-1">
              <TrendingUp className="inline h-4 w-4 mr-1" />
              {change}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-gray-50 ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );

  const ProgressBar = ({ 
    label, 
    value, 
    total, 
    color 
  }: {
    label: string;
    value: number;
    total: number;
    color: string;
  }) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return (
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3 flex-1">
          <div className={`w-3 h-3 rounded-full ${color}`} />
          <span className="text-sm font-medium text-gray-700 flex-1">{label}</span>
          <span className="text-sm text-gray-500">{value}</span>
        </div>
        <div className="w-24 bg-gray-200 rounded-full h-2 ml-4">
          <div 
            className={`h-2 rounded-full ${color}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
          <p className="text-gray-600">正在加载统计数据...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">暂无统计数据</h3>
        <p className="text-gray-600">开始搜索关键词来生成数据分析</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">数据统计</h1>
          <p className="text-gray-600 mt-1">小红书内容抓取分析报告</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            <option value="7d">最近 7 天</option>
            <option value="30d">最近 30 天</option>
            <option value="90d">最近 90 天</option>
          </select>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>刷新</span>
            </button>
          )}
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="总帖子数"
          value={stats.totalPosts.toLocaleString()}
          change="+12% 本月"
          icon={Eye}
          color="text-blue-600"
        />
        <StatCard
          title="分类数量"
          value={stats.totalCategories}
          icon={Hash}
          color="text-green-600"
        />
        <StatCard
          title="关键词数"
          value={stats.totalKeywords}
          change="+5 新增"
          icon={Hash}
          color="text-purple-600"
        />
        <StatCard
          title="作者数量"
          value={stats.totalAuthors}
          icon={Users}
          color="text-orange-600"
        />
      </div>

      {/* 近期活动统计 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          近期活动
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{stats.recentActivity.today}</p>
            <p className="text-sm text-gray-600 mt-1">今日抓取</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{stats.recentActivity.thisWeek}</p>
            <p className="text-sm text-gray-600 mt-1">本周抓取</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{stats.recentActivity.thisMonth}</p>
            <p className="text-sm text-gray-600 mt-1">本月抓取</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 分类分布 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            分类分布
          </h3>
          <div className="space-y-4">
            {stats.categoryDistribution.map((item, index) => (
              <ProgressBar
                key={index}
                label={item.category}
                value={item.count}
                total={stats.totalPosts}
                color={getCategoryColor(item.category)}
              />
            ))}
          </div>
        </div>

        {/* 热门作者 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            热门作者 TOP 5
          </h3>
          <div className="space-y-3">
            {stats.topAuthors.slice(0, 5).map((author, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                    <span className="text-pink-600 font-semibold text-sm">
                      #{index + 1}
                    </span>
                  </div>
                  <span className="font-medium text-gray-900">{author.author}</span>
                </div>
                <span className="text-sm font-semibold text-gray-600">
                  {author.count} 篇
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 热门关键词 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Hash className="h-5 w-5 mr-2" />
          热门搜索关键词
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.topKeywords.map((keyword, index) => (
            <div 
              key={index}
              className="p-4 border border-gray-200 rounded-lg hover:border-pink-300 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{keyword.keyword}</span>
                <span className="bg-pink-100 text-pink-600 px-2 py-1 rounded-full text-xs font-semibold">
                  {keyword.count}次
                </span>
              </div>
              <p className="text-xs text-gray-500">
                最近使用: {new Date(keyword.lastUsed).toLocaleDateString('zh-CN')}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 每日活动图表 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          每日抓取趋势
        </h3>
        <div className="h-64 flex items-end justify-between space-x-2">
          {stats.dailyActivity.slice(-14).map((day, index) => {
            const maxCount = Math.max(...stats.dailyActivity.map(d => d.count));
            const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="bg-gradient-to-t from-pink-500 to-pink-300 rounded-t-md w-full min-h-[4px] transition-all duration-300"
                  style={{ height: `${height}%` }}
                  title={`${day.date}: ${day.count} 篇`}
                />
                <span className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left">
                  {new Date(day.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 导出按钮 */}
      <div className="flex justify-center">
        <button className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
          <Download className="h-4 w-4" />
          <span>导出统计报告</span>
        </button>
      </div>
    </div>
  );
}
