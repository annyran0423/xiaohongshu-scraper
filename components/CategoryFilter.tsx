'use client';

import { useState, useEffect } from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  count: number;
  color: string;
}

interface CategoryFilterProps {
  categories: Category[];
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

interface FilterStats {
  totalPosts: number;
  selectedPosts: number;
  dateRange: string;
}

export default function CategoryFilter({
  categories,
  selectedCategories,
  onCategoryChange,
  isOpen,
  onToggle,
  className = ''
}: CategoryFilterProps) {
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    authors: false,
    keywords: false,
    dates: false
  });

  const getCategoryColor = (categoryName: string) => {
    switch (categoryName) {
      case '美妆护肤':
        return {
          bg: 'bg-pink-50',
          text: 'text-pink-700',
          border: 'border-pink-200',
          dot: 'bg-pink-500'
        };
      case '时尚穿搭':
        return {
          bg: 'bg-purple-50',
          text: 'text-purple-700',
          border: 'border-purple-200',
          dot: 'bg-purple-500'
        };
      case '美食':
        return {
          bg: 'bg-orange-50',
          text: 'text-orange-700',
          border: 'border-orange-200',
          dot: 'bg-orange-500'
        };
      case '旅游':
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          border: 'border-blue-200',
          dot: 'bg-blue-500'
        };
      case '生活方式':
        return {
          bg: 'bg-green-50',
          text: 'text-green-700',
          border: 'border-green-200',
          dot: 'bg-green-500'
        };
      case '健身运动':
        return {
          bg: 'bg-red-50',
          text: 'text-red-700',
          border: 'border-red-200',
          dot: 'bg-red-500'
        };
      case '学习工作':
        return {
          bg: 'bg-indigo-50',
          text: 'text-indigo-700',
          border: 'border-indigo-200',
          dot: 'bg-indigo-500'
        };
      default:
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-700',
          border: 'border-gray-200',
          dot: 'bg-gray-500'
        };
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    const newSelection = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId];
    onCategoryChange(newSelection);
  };

  const handleSelectAll = () => {
    const allCategoryIds = categories.map(cat => cat.id);
    onCategoryChange(allCategoryIds);
  };

  const handleClearAll = () => {
    onCategoryChange([]);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const totalSelectedPosts = categories
    .filter(cat => selectedCategories.includes(cat.id))
    .reduce((sum, cat) => sum + cat.count, 0);

  const FilterSection = ({ 
    title, 
    section, 
    children 
  }: { 
    title: string; 
    section: keyof typeof expandedSections; 
    children: React.ReactNode;
  }) => (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => toggleSection(section)}
        className="w-full flex items-center justify-between py-3 px-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-900">{title}</span>
        {expandedSections[section] ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </button>
      {expandedSections[section] && (
        <div className="px-4 pb-4">{children}</div>
      )}
    </div>
  );

  return (
    <>
      {/* 移动端遮罩 */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* 侧边栏 */}
      <div className={`
        fixed lg:sticky top-0 left-0 h-screen lg:h-auto z-50 lg:z-auto
        bg-white border-r border-gray-200 lg:border-r-0 lg:border lg:rounded-xl lg:shadow-sm
        transform transition-transform duration-300 ease-in-out lg:transform-none
        w-80 lg:w-full overflow-y-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${className}
      `}>
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 lg:border-b-0">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">筛选条件</h3>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* 筛选统计 */}
        <div className="p-4 bg-gray-50 border-b border-gray-100">
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">已选择分类：</span>
              <span className="font-medium text-gray-900">{selectedCategories.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">筛选结果：</span>
              <span className="font-medium text-gray-900">
                {selectedCategories.length === 0 
                  ? categories.reduce((sum, cat) => sum + cat.count, 0)
                  : totalSelectedPosts
                } 篇
              </span>
            </div>
          </div>
          
          {/* 快速操作按钮 */}
          <div className="flex space-x-2 mt-3">
            <button
              onClick={handleSelectAll}
              className="flex-1 px-3 py-1.5 text-xs font-medium text-pink-700 bg-pink-50 border border-pink-200 rounded-md hover:bg-pink-100 transition-colors"
            >
              全选
            </button>
            <button
              onClick={handleClearAll}
              className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
            >
              清空
            </button>
          </div>
        </div>

        {/* 分类筛选 */}
        <FilterSection title="内容分类" section="categories">
          <div className="space-y-2">
            {categories.map((category) => {
              const colors = getCategoryColor(category.name);
              const isSelected = selectedCategories.includes(category.id);
              
              return (
                <label
                  key={category.id}
                  className={`
                    flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all
                    ${isSelected 
                      ? `${colors.bg} ${colors.border} ${colors.text}` 
                      : 'border-gray-200 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleCategoryToggle(category.id)}
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                    />
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${colors.dot}`} />
                      <span className="font-medium text-sm">{category.name}</span>
                    </div>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 bg-white bg-opacity-60 rounded-full">
                    {category.count}
                  </span>
                </label>
              );
            })}
          </div>
        </FilterSection>

        {/* 作者筛选 */}
        <FilterSection title="作者" section="authors">
          <div className="text-sm text-gray-600">
            <p>作者筛选功能即将上线...</p>
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span>热门作者</span>
                <span className="text-xs bg-gray-200 px-2 py-1 rounded">敬请期待</span>
              </div>
            </div>
          </div>
        </FilterSection>

        {/* 关键词筛选 */}
        <FilterSection title="搜索关键词" section="keywords">
          <div className="text-sm text-gray-600">
            <p>关键词筛选功能即将上线...</p>
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span>热门关键词</span>
                <span className="text-xs bg-gray-200 px-2 py-1 rounded">敬请期待</span>
              </div>
            </div>
          </div>
        </FilterSection>

        {/* 时间筛选 */}
        <FilterSection title="发布时间" section="dates">
          <div className="text-sm text-gray-600">
            <p>时间筛选功能即将上线...</p>
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span>时间范围</span>
                <span className="text-xs bg-gray-200 px-2 py-1 rounded">敬请期待</span>
              </div>
            </div>
          </div>
        </FilterSection>
      </div>
    </>
  );
}
