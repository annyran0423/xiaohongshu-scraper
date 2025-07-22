# 🚨 数据库Schema更新操作指南

## 当前状态
- ✅ 数据库连接正常
- ✅ Categories表完整 (8个分类)
- ✅ Keywords表结构正常  
- ❌ **Posts表缺少platform列** - 需要立即修复

## 🔧 修复步骤（必须执行）

### 1. 打开Supabase控制台
- 访问：https://supabase.com/dashboard
- 选择您的项目：`fmjefoydxkckqdqrvsbc`

### 2. 进入SQL编辑器
- 点击左侧菜单 "SQL Editor"
- 点击 "New query" 按钮

### 3. 复制并执行以下SQL语句：

```sql
-- 添加platform列
ALTER TABLE posts ADD COLUMN platform VARCHAR(50) DEFAULT 'xiaohongshu' NOT NULL;

-- 添加索引提高性能
CREATE INDEX idx_posts_platform ON posts (platform);

-- 验证添加成功
SELECT 'Platform列添加成功！' AS status;
```

### 4. 点击"Run"按钮执行

## ✅ 执行成功标志
- 看到消息："Platform列添加成功！"
- 无错误提示

## 🎯 完成后的效果
- 爬虫API可以正常存储数据到数据库
- 支持多平台数据来源(xiaohongshu, weibo等)
- 完整的数据追踪和分类

---
**重要：** 不执行此步骤，爬虫抓取的数据无法保存到数据库！
