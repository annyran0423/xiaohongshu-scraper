'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Search, 
  BarChart3, 
  Settings, 
  Menu, 
  X, 
  Home,
  Database,
  Filter,
  TrendingUp
} from 'lucide-react';

interface NavigationProps {
  className?: string;
}

export default function Navigation({ className = '' }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navigationItems = [
    {
      name: '首页',
      href: '/',
      icon: Home,
      description: '搜索和浏览内容'
    },
    {
      name: '搜索',
      href: '/search',
      icon: Search,
      description: '关键词搜索'
    },
    {
      name: '统计分析',
      href: '/dashboard',
      icon: BarChart3,
      description: '数据统计与分析'
    },
    {
      name: '分类管理',
      href: '/categories',
      icon: Filter,
      description: '内容分类管理'
    },
    {
      name: '数据库',
      href: '/database',
      icon: Database,
      description: '数据库管理'
    }
  ];

  const isActiveRoute = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname?.startsWith(href);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      {/* 移动端顶部导航栏 */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">小红书助手</h1>
              <p className="text-xs text-gray-500">内容抓取与分析</p>
            </div>
          </div>
          <button
            onClick={toggleMobileMenu}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* 移动端遮罩 */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      {/* 侧边导航栏 */}
      <nav className={`
        fixed lg:sticky top-0 left-0 h-screen z-50 lg:z-auto
        bg-white border-r border-gray-200
        transform transition-transform duration-300 ease-in-out lg:transform-none
        w-64 lg:w-full overflow-y-auto
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${className}
      `}>
        {/* 桌面端头部 */}
        <div className="hidden lg:block p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">小红书助手</h1>
              <p className="text-sm text-gray-500">内容抓取与分析平台</p>
            </div>
          </div>
        </div>

        {/* 导航菜单 */}
        <div className="p-4 space-y-2">
          {navigationItems.map((item) => {
            const isActive = isActiveRoute(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-pink-50 text-pink-700 border border-pink-200 shadow-sm' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-pink-600' : 'text-gray-500'}`} />
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                </div>
                {isActive && (
                  <div className="w-2 h-2 bg-pink-500 rounded-full" />
                )}
              </Link>
            );
          })}
        </div>

        {/* 底部信息 */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-gray-50">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-2">系统状态</p>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-gray-700">运行正常</span>
            </div>
          </div>
        </div>

        {/* 快速操作按钮 */}
        <div className="absolute bottom-16 left-4 right-4">
          <Link
            href="/search"
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg px-4 py-3 font-medium text-center block hover:from-pink-600 hover:to-rose-600 transition-all duration-200 shadow-lg"
          >
            开始搜索
          </Link>
        </div>
      </nav>

      {/* 桌面端顶部状态栏 */}
      <div className="hidden lg:block bg-white border-b border-gray-100 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm text-gray-600">系统运行正常</span>
            </div>
            <div className="text-sm text-gray-500">
              当前时间: {new Date().toLocaleString('zh-CN')}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              帮助
            </button>
            <button className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center space-x-1">
              <Settings className="h-4 w-4" />
              <span>设置</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
