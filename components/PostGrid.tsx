'use client';

import { useState, useEffect } from 'react';
import PostCard from './PostCard';
import { Search, Filter, SortAsc, SortDesc, RefreshCw } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  url: string;
  tags?: string[];
  images?: string[];
  created_at: string;
  keyword_used?: string;
  categories?: {
    name: string;
    id: string;
  };
}

interface PostGridProps {
  posts: Post[];
  loading?: boolean;
  onRefresh?: () => void;
  showFilters?: boolean;
}

type SortOption = 'newest' | 'oldest' | 'title';

export default function PostGrid({ 
  posts, 
  loading = false, 
  onRefresh,
  showFilters = true 
}: PostGridProps) {
  const [filteredPosts, setFilteredPosts] = useState<Post[]>(posts);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');

  // 获取所有可用分类
  const categories = Array.from(new Set(
    posts
      .map(post => post.categories?.name)
      .filter(Boolean)
  )) as string[];

  // 过滤和排序逻辑
  useEffect(() => {
    let filtered = [...posts];

    // 分类过滤
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(post => 
        post.categories?.name === selectedCategory
      );
    }

    // 搜索过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query) ||
        post.author.toLowerCase().includes(query) ||
        post.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'title':
          return a.title.localeCompare(b.title, 'zh-CN');
        default:
          return 0;
      }
    });

    setFilteredPosts(filtered);
  }, [posts, selectedCategory, sortBy, searchQuery]);

  const getCategoryColor = (categoryName: string) => {
    switch (categoryName) {
      case '美妆护肤':
        return 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100';
      case '时尚穿搭':
        return 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100';
      case '美食':
        return 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100';
      case '旅游':
        return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
      case '生活方式':
        return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100';
      case '健身运动':
        return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100';
      case '学习工作':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
          <p className="text-gray-600">正在加载内容...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 过滤和排序控件 */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {/* 搜索框 */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索标题、内容、作者或标签..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* 分类过滤 */}
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 mr-2">分类：</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-pink-100 text-pink-700 border-pink-200'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  全部 ({posts.length})
                </button>
                {categories.map((category) => {
                  const count = posts.filter(post => post.categories?.name === category).length;
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                        selectedCategory === category
                          ? 'bg-pink-100 text-pink-700 border-pink-200'
                          : getCategoryColor(category)
                      }`}
                    >
                      {category} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 排序选项 */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {sortBy === 'newest' ? <SortDesc className="h-5 w-5 text-gray-500" /> : <SortAsc className="h-5 w-5 text-gray-500" />}
                <span className="text-sm font-medium text-gray-700">排序：</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="border border-gray-200 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="newest">最新发布</option>
                  <option value="oldest">最早发布</option>
                  <option value="title">标题排序</option>
                </select>
              </div>

              {/* 刷新按钮 */}
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  className="inline-flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>刷新</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 结果统计 */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          显示 <span className="font-semibold">{filteredPosts.length}</span> 个结果
          {searchQuery && (
            <span> （搜索：<span className="font-medium">"{searchQuery}"</span>）</span>
          )}
        </p>
      </div>

      {/* 帖子网格 */}
      {filteredPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="text-gray-400 mb-4">
              <Search className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery || selectedCategory !== 'all' ? '没有找到匹配的结果' : '暂无数据'}
            </h3>
            <p className="text-gray-600">
              {searchQuery || selectedCategory !== 'all' 
                ? '尝试调整搜索条件或筛选选项' 
                : '开始搜索关键词来抓取小红书内容'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
