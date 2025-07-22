'use client';

import { useState, useEffect } from 'react';
import Head from 'next/head';
import SearchForm from '@/components/SearchForm';
import PostGrid from '@/components/PostGrid';
import CategoryFilter from '@/components/CategoryFilter';
import Navigation from '@/components/Navigation';
import Dashboard from '@/components/Dashboard';
import { Search, Filter, BarChart3, Loader2 } from 'lucide-react';

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

interface Category {
  id: string;
  name: string;
  count: number;
  color: string;
}

export default function HomePage() {
  const [currentView, setCurrentView] = useState<'search' | 'dashboard'>('search');
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [isCategoryFilterOpen, setIsCategoryFilterOpen] = useState(false);

  // 获取现有帖子数据
  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/summary?type=overall');
      if (response.ok) {
        const data = await response.json();
        // 这里需要调用一个获取帖子列表的API
        // 暂时使用模拟数据
        setPosts([]);
      }
    } catch (error) {
      console.error('获取帖子失败:', error);
    }
  };

  // 获取分类统计
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categorize?type=stats');
      if (response.ok) {
        const data = await response.json();
        const categoryList = Object.entries(data.categoriesWithPosts).map(([name, count]) => ({
          id: name,
          name: name,
          count: count as number,
          color: ''
        }));
        setCategories(categoryList);
      }
    } catch (error) {
      console.error('获取分类失败:', error);
    }
  };

  // 获取仪表板统计数据
  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/summary?type=overall');
      if (response.ok) {
        const data = await response.json();
        setDashboardStats({
          totalPosts: data.totalPosts || 0,
          totalCategories: data.totalCategories || 0,
          totalKeywords: data.totalKeywords || 0,
          totalAuthors: data.uniqueAuthors || 0,
          recentActivity: {
            today: 0,
            thisWeek: 0,
            thisMonth: data.totalPosts || 0
          },
          categoryDistribution: Object.entries(data.categoriesWithPosts || {}).map(([name, count]) => ({
            category: name,
            count: count as number,
            percentage: data.totalPosts > 0 ? (count as number / data.totalPosts) * 100 : 0
          })),
          topAuthors: [],
          topKeywords: [],
          dailyActivity: []
        });
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  // 处理搜索
  const handleSearch = async (keyword: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyword }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setSearchResults(data);
        // 如果有抓取到的数据，更新帖子列表
        if (data.scrapedPosts && data.scrapedPosts.length > 0) {
          setPosts(prevPosts => [...data.scrapedPosts, ...prevPosts]);
        }
        // 重新获取分类和统计数据
        await fetchCategories();
        await fetchDashboardStats();
      } else {
        console.error('搜索失败:', data.error);
      }
    } catch (error) {
      console.error('搜索请求失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 处理分类变更
  const handleCategoryChange = (categories: string[]) => {
    setSelectedCategories(categories);
  };

  // 过滤帖子
  const filteredPosts = selectedCategories.length === 0 
    ? posts 
    : posts.filter(post => 
        post.categories && selectedCategories.includes(post.categories.name)
      );

  // 初始化数据
  useEffect(() => {
    fetchPosts();
    fetchCategories();
    fetchDashboardStats();
  }, []);

  return (
    <>
      <Head>
        <title>小红书内容抓取分析平台 - 智能关键词搜索与分类总结</title>
        <meta name="description" content="专业的小红书内容抓取和分析平台，支持关键词搜索、智能分类、数据统计和趋势分析。帮助您轻松获取和分析小红书热门内容。" />
        <meta name="keywords" content="小红书,内容抓取,关键词搜索,数据分析,内容分类,社交媒体分析" />
        <meta name="author" content="Xiaohongshu Scraper Platform" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="utf-8" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://xiaohongshu-scraper.vercel.app/" />
        <meta property="og:title" content="小红书内容抓取分析平台" />
        <meta property="og:description" content="专业的小红书内容抓取和分析平台，支持关键词搜索、智能分类、数据统计和趋势分析。" />
        <meta property="og:image" content="https://xiaohongshu-scraper.vercel.app/og-image.png" />
        <meta property="og:site_name" content="小红书内容抓取分析平台" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://xiaohongshu-scraper.vercel.app/" />
        <meta property="twitter:title" content="小红书内容抓取分析平台" />
        <meta property="twitter:description" content="专业的小红书内容抓取和分析平台，支持关键词搜索、智能分类、数据统计和趋势分析。" />
        <meta property="twitter:image" content="https://xiaohongshu-scraper.vercel.app/og-image.png" />
        
        {/* Additional SEO */}
        <meta name="robots" content="index, follow" />
        <meta name="language" content="zh-CN" />
        <meta name="revisit-after" content="7 days" />
        <link rel="canonical" href="https://xiaohongshu-scraper.vercel.app/" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#ec4899" />
      </Head>
      
      <div className="min-h-screen bg-gray-50">
      <div className="lg:flex">
        {/* 侧边导航 */}
        <div className="lg:w-64 lg:flex-shrink-0">
          <Navigation />
        </div>

        {/* 主内容区域 */}
        <div className="flex-1 lg:flex">
          <div className="flex-1">
            {/* 视图切换标签 */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex space-x-8">
                <button
                  onClick={() => setCurrentView('search')}
                  className={`flex items-center space-x-2 pb-2 border-b-2 transition-colors ${
                    currentView === 'search'
                      ? 'border-pink-500 text-pink-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Search className="h-5 w-5" />
                  <span className="font-medium">搜索内容</span>
                </button>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`flex items-center space-x-2 pb-2 border-b-2 transition-colors ${
                    currentView === 'dashboard'
                      ? 'border-pink-500 text-pink-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <BarChart3 className="h-5 w-5" />
                  <span className="font-medium">数据统计</span>
                </button>
              </div>
            </div>

            {/* 主内容 */}
            <div className="p-6">
              {currentView === 'search' ? (
                <div className="space-y-6">
                  {/* 搜索表单 */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      关键词搜索
                    </h2>
                    <SearchForm onSearch={handleSearch} loading={loading} />
                    
                    {/* 搜索结果提示 */}
                    {searchResults && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-800">
                          ✅ 搜索完成！抓取到 <strong>{searchResults.scrapedPosts?.length || 0}</strong> 条内容，
                          保存 <strong>{searchResults.savedPosts || 0}</strong> 条到数据库
                        </p>
                        {searchResults.errors?.length > 0 && (
                          <p className="text-orange-600 mt-1">
                            ⚠️ {searchResults.errors.length} 条内容处理时出现问题
                          </p>
                        )}
                      </div>
                    )}

                    {/* 加载状态 */}
                    {loading && (
                      <div className="mt-4 flex items-center justify-center p-8 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                          <span className="text-blue-800 font-medium">正在抓取小红书内容...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 帖子展示区域 */}
                  <PostGrid 
                    posts={filteredPosts}
                    loading={loading}
                    onRefresh={fetchPosts}
                  />
                </div>
              ) : (
                /* 仪表板视图 */
                <Dashboard 
                  stats={dashboardStats}
                  loading={!dashboardStats}
                  onRefresh={fetchDashboardStats}
                />
              )}
            </div>
          </div>

          {/* 分类过滤侧边栏 */}
          {currentView === 'search' && (
            <div className="lg:w-80 lg:flex-shrink-0">
              <div className="lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
                <CategoryFilter
                  categories={categories}
                  selectedCategories={selectedCategories}
                  onCategoryChange={handleCategoryChange}
                  isOpen={isCategoryFilterOpen}
                  onToggle={() => setIsCategoryFilterOpen(!isCategoryFilterOpen)}
                  className="h-full"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 移动端分类过滤按钮 */}
      {currentView === 'search' && (
        <button
          onClick={() => setIsCategoryFilterOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-pink-600 text-white rounded-full shadow-lg hover:bg-pink-700 transition-colors flex items-center justify-center z-30"
        >
          <Filter className="h-6 w-6" />
        </button>
      )}
      </div>
    </>
  );
}
