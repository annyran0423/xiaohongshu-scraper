'use client';

import { ExternalLink, User, Calendar, Tag, Hash } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  url: string;
  tags?: string[];
  images?: string[];
  created_at: string;
  categories?: {
    name: string;
    id: string;
  };
}

interface PostCardProps {
  post: Post;
  className?: string;
}

export default function PostCard({ post, className = '' }: PostCardProps) {
  const getCategoryColor = (categoryName?: string) => {
    switch (categoryName) {
      case '美妆护肤':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case '时尚穿搭':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case '美食':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case '旅游':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case '生活方式':
        return 'bg-green-100 text-green-800 border-green-200';
      case '健身运动':
        return 'bg-red-100 text-red-800 border-red-200';
      case '学习工作':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength) + '...';
  };

  return (
    <div className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-100 ${className}`}>
      {/* 图片展示区域 */}
      {post.images && post.images.length > 0 && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={post.images[0]}
            alt={post.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          {post.images.length > 1 && (
            <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded-full text-xs">
              +{post.images.length - 1}
            </div>
          )}
        </div>
      )}

      <div className="p-6">
        {/* 分类标签 */}
        {post.categories && (
          <div className="mb-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(post.categories.name)}`}>
              <Hash className="h-3 w-3 mr-1" />
              {post.categories.name}
            </span>
          </div>
        )}

        {/* 标题 */}
        <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
          {post.title}
        </h3>

        {/* 内容预览 */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
          {truncateContent(post.content)}
        </p>

        {/* 标签 */}
        {post.tags && post.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1">
            {post.tags.slice(0, 6).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 bg-gray-50 text-gray-600 rounded-md text-xs"
              >
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </span>
            ))}
            {post.tags.length > 6 && (
              <span className="text-xs text-gray-400">
                +{post.tags.length - 6}
              </span>
            )}
          </div>
        )}

        {/* 元信息 */}
        <div className="flex items-center justify-between text-sm text-gray-500 border-t border-gray-100 pt-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <User className="h-4 w-4" />
              <span className="font-medium">{post.author}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(post.created_at)}</span>
            </div>
          </div>

          {/* 查看原文链接 */}
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 text-pink-600 hover:text-pink-700 font-medium transition-colors duration-200"
          >
            <span>查看原文</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
