-- 数据库schema更新 - 添加platform列
-- 请在Supabase项目的SQL编辑器中执行此文件

-- 1. 为posts表添加platform列
ALTER TABLE posts ADD COLUMN IF NOT EXISTS platform VARCHAR(50) DEFAULT 'xiaohongshu' NOT NULL;

-- 2. 为platform列添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_posts_platform ON posts (platform);

-- 3. 为platform列添加注释
COMMENT ON COLUMN posts.platform IS '数据来源平台，如xiaohongshu, weibo等';

-- 4. 验证更新是否成功（可选）
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'posts' 
  AND column_name = 'platform';

-- 完成提示
SELECT 'Platform列添加成功！现在可以开始爬取和存储数据了。' AS status;
