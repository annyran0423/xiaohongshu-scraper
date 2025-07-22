-- Xiaohongshu Scraper Database Schema
-- This file contains all the table definitions for the Xiaohongshu scraping application

-- Enable RLS (Row Level Security)
-- Note: You may need to configure RLS policies based on your authentication requirements

-- 1. Categories table for classification system
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Keywords table for search terms tracking
CREATE TABLE IF NOT EXISTS keywords (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    keyword VARCHAR(200) NOT NULL UNIQUE,
    search_count INTEGER DEFAULT 0,
    last_used TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Posts table for storing scraped Xiaohongshu posts
CREATE TABLE IF NOT EXISTS posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    author VARCHAR(200),
    author_id VARCHAR(100), -- Xiaohongshu user ID
    tags TEXT[], -- Array of tags/hashtags
    images TEXT[], -- Array of image URLs
    url TEXT NOT NULL UNIQUE, -- Original Xiaohongshu post URL
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    keyword_used VARCHAR(200), -- The keyword that found this post
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    post_created_at TIMESTAMP WITH TIME ZONE, -- When the original post was created on Xiaohongshu
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_category_id ON posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_keyword_used ON posts(keyword_used);
CREATE INDEX IF NOT EXISTS idx_posts_scraped_at ON posts(scraped_at);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author);
CREATE INDEX IF NOT EXISTS idx_keywords_last_used ON keywords(last_used);

-- 5. Insert default categories
INSERT INTO categories (name, description, color) VALUES 
    ('美妆护肤', '美妆、护肤、化妆品相关内容', '#FF69B4'),
    ('时尚穿搭', '服装、搭配、时尚趋势相关内容', '#9370DB'),
    ('美食', '美食制作、餐厅推荐、食谱分享', '#FF6347'),
    ('旅游', '旅游攻略、景点推荐、旅行经验', '#32CD32'),
    ('生活方式', '日常生活、居家、生活技巧', '#20B2AA'),
    ('健身运动', '健身、运动、减肥相关内容', '#FF4500'),
    ('学习工作', '学习方法、工作技巧、职场经验', '#4169E1'),
    ('其他', '未分类或其他类型内容', '#808080')
ON CONFLICT (name) DO NOTHING;

-- 6. Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Create triggers to automatically update updated_at
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_keywords_updated_at BEFORE UPDATE ON keywords
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Enable Row Level Security (optional, depends on your auth requirements)
-- ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies (uncomment and modify if needed)
-- CREATE POLICY "Enable read access for all users" ON categories FOR SELECT USING (true);
-- CREATE POLICY "Enable read access for all users" ON keywords FOR SELECT USING (true);
-- CREATE POLICY "Enable read access for all users" ON posts FOR SELECT USING (true);