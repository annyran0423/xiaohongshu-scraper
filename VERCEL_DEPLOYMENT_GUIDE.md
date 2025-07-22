# 🚀 Vercel部署指南

本指南将帮助您将小红书抓取网站部署到Vercel平台，让用户可以直接在线使用。

## 📋 部署前准备

### 1. 确保项目完整性
- ✅ Next.js应用已配置完成
- ✅ Supabase数据库已设置完成
- ✅ 所有API接口正常工作
- ✅ 前端组件已完成开发

### 2. 准备Git仓库
```bash
# 如果还没有Git仓库，请初始化
git init
git add .
git commit -m "Initial commit: 小红书抓取网站完成开发"

# 推送到GitHub (推荐) 或 GitLab
git remote add origin https://github.com/yourusername/xiaohongshu-scraper.git
git push -u origin main
```

## 🌐 Vercel部署步骤

### 步骤1: 创建Vercel账户
1. 访问 [vercel.com](https://vercel.com)
2. 点击 "Sign Up" 注册账户
3. 推荐使用GitHub账户登录以便后续集成

### 步骤2: 连接项目仓库
1. 登录Vercel后，点击 "New Project"
2. 选择 "Import Git Repository"
3. 选择您的GitHub仓库 `xiaohongshu-scraper`
4. 点击 "Import"

### 步骤3: 配置项目设置
1. **Project Name**: `xiaohongshu-scraper` (或您喜欢的名称)
2. **Framework**: Next.js (Vercel会自动检测)
3. **Root Directory**: `.` (项目根目录)
4. **Build Command**: `npm run build` (保持默认)
5. **Output Directory**: `.next` (保持默认)

### 步骤4: 配置环境变量 🔑
在Vercel项目设置中添加以下环境变量：

#### 必需的环境变量：
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

#### 可选的环境变量：
```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production
```

#### 添加环境变量的步骤：
1. 在Vercel项目页面，点击 "Settings"
2. 点击左侧菜单的 "Environment Variables"
3. 逐个添加上述环境变量：
   - **Name**: 环境变量名称
   - **Value**: 对应的值
   - **Environment**: 选择 "Production", "Preview", "Development" (推荐全选)
4. 点击 "Add" 保存

### 步骤5: 获取Supabase配置信息
1. 登录您的 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择您的项目
3. 点击左侧菜单的 "Settings" → "API"
4. 复制以下信息：
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret key** → `SUPABASE_SERVICE_ROLE_KEY` (可选)

### 步骤6: 部署项目
1. 环境变量配置完成后，点击 "Deploy"
2. Vercel将自动开始构建和部署过程
3. 等待部署完成 (通常需要2-5分钟)

## 🔧 部署后配置

### 1. 更新Supabase RLS策略 (如果需要)
如果您使用了Row Level Security，可能需要更新策略以允许Vercel域名：

```sql
-- 在Supabase SQL编辑器中执行
ALTER POLICY "Enable read access for all users" ON "public"."posts"
USING (true);

ALTER POLICY "Enable insert for authenticated users only" ON "public"."posts"
WITH CHECK (true);
```

### 2. 测试部署的网站
1. 访问Vercel提供的URL (例如: `https://xiaohongshu-scraper-xxx.vercel.app`)
2. 测试以下功能：
   - ✅ 主页加载正常
   - ✅ 搜索功能工作
   - ✅ 数据抓取功能
   - ✅ 分类和总结功能
   - ✅ 响应式设计

### 3. 自定义域名 (可选)
1. 在Vercel项目设置中点击 "Domains"
2. 添加您的自定义域名
3. 按照提示配置DNS记录

## 🐛 常见问题解决

### 问题1: 构建失败
**解决方案:**
```bash
# 本地测试构建
npm run build
# 如果本地构建成功，检查环境变量配置
```

### 问题2: Supabase连接失败
**解决方案:**
- 确认环境变量名称完全正确 (区分大小写)
- 确认Supabase URL和Key没有多余的空格
- 检查Supabase项目是否暂停

### 问题3: API路由无法访问
**解决方案:**
- 检查 `next.config.ts` 中的 `serverActions` 配置
- 确保API路由文件路径正确

### 问题4: 图片无法显示
**解决方案:**
- 检查 `next.config.ts` 中的 `images` 配置
- 确认小红书图片域名在allowed列表中

## 📈 部署后优化

### 1. 性能监控
- 使用Vercel Analytics监控网站性能
- 查看Core Web Vitals指标

### 2. 自动部署
- Vercel会自动监听GitHub仓库变更
- 每次push到main分支会触发自动部署

### 3. 环境分离
- 使用不同分支部署到不同环境
- `main` → Production
- `develop` → Preview

## 📞 需要帮助？

如果在部署过程中遇到问题，请检查：
1. Vercel部署日志 (在项目页面查看)
2. 浏览器开发者工具的控制台错误
3. Supabase项目状态和API配置

祝您部署成功！🎉

---

## 📝 快速检查清单

部署前请确认：
- [ ] Git仓库已推送到GitHub/GitLab
- [ ] Supabase数据库schema完整 (包含platform列)
- [ ] 本地 `npm run build` 成功
- [ ] 环境变量已准备好
- [ ] Vercel账户已创建

部署后请测试：
- [ ] 网站可以正常访问
- [ ] 搜索功能正常
- [ ] 数据可以保存到Supabase
- [ ] 所有页面响应正常
- [ ] 移动端适配良好
