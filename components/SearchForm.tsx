'use client';

import { useState } from 'react';
import { Search, Loader2, AlertCircle } from 'lucide-react';

interface SearchFormProps {
  onSearch: (keyword: string, limit: number) => void;
  isLoading?: boolean;
  error?: string;
}

export default function SearchForm({ onSearch, isLoading = false, error }: SearchFormProps) {
  const [keyword, setKeyword] = useState('');
  const [limit, setLimit] = useState(10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      onSearch(keyword.trim(), limit);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        小红书内容抓取器
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="输入搜索关键词 (如: 美食, 护肤, 健身...)"
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all duration-200 text-gray-700 placeholder-gray-400"
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center space-x-4">
          <label className="text-gray-700 font-medium">抓取数量:</label>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none bg-white text-gray-700"
            disabled={isLoading}
          >
            <option value={5}>5篇</option>
            <option value={10}>10篇</option>
            <option value={20}>20篇</option>
            <option value={50}>50篇</option>
          </select>
        </div>

        {error && (
          <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !keyword.trim()}
          className="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white py-3 px-6 rounded-lg font-semibold hover:from-pink-600 hover:to-red-600 focus:ring-4 focus:ring-pink-300 focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>抓取中...</span>
            </>
          ) : (
            <>
              <Search className="h-5 w-5" />
              <span>开始抓取</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-500">
        <p>系统将自动分析内容并分类到相应类别</p>
        <p className="mt-1">支持分类: 美妆护肤、时尚穿搭、美食、旅游、生活方式、健身运动、学习工作</p>
      </div>
    </div>
  );
}
