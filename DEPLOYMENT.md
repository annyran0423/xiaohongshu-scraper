# Vercel 部署指南

## 部署步骤

### 1. 准备工作
确保你已经有：
- Vercel 账户
- Supabase 项目和数据库
- GitHub 仓库（已推送最新代码）

### 2. 获取 Supabase 凭据
1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 在 Settings > API 中找到：
   - Project URL (用作 `NEXT_PUBLIC_SUPABASE_URL`)
   - anon/public key (用作 `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

### 3. 在 Vercel 中部署
1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "New Project"
3. 导入你的 GitHub 仓库
4. 在 "Environment Variables" 部分添加：

```
NEXT_PUBLIC_SUPABASE_URL = 你的_supabase_项目_url
NEXT_PUBLIC_SUPABASE_ANON_KEY = 你的_supabase_anon_key
```

### 4. 配置环境变量
Vercel 会自动识别 `vercel.json` 中的配置。环境变量需要手动添加：

- `NEXT_PUBLIC_SUPABASE_URL`: 你的 Supabase 项目 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 你的 Supabase anon key
- `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD`: 已在 vercel.json 中配置
- `PUPPETEER_EXECUTABLE_PATH`: 已在 vercel.json 中配置

### 5. 部署
点击 "Deploy" 开始部署。Vercel 将：
- 使用 Node.js 18.x 运行时
- 执行 `npm install`
- 运行 `npm run build`
- 部署到生产环境

## 重要配置说明

### vercel.json 配置
```json
{
  "nodeVersion": "18.x",           // 指定 Node.js 版本
  "framework": "nextjs",           // Next.js 框架
  "buildCommand": "npm run build", // 构建命令
  "installCommand": "npm install", // 安装命令
  "functions": {                   // API 路由超时设置
    "app/api/scrape/route.ts": { "maxDuration": 300 },
    "app/api/categorize/route.ts": { "maxDuration": 60 },
    "app/api/summary/route.ts": { "maxDuration": 60 }
  }
}
```

### 环境变量安全性
- 生产环境变量通过 Vercel Dashboard 配置
- 本地开发使用 `.env.local` 文件
- 永远不要将真实凭据提交到代码仓库

## 故障排除

### 常见问题
1. **npm install 失败**: 已修复 `.npmrc` 中的 `engine-strict` 问题
2. **构建失败**: 确保环境变量已正确配置
3. **API 超时**: 检查函数超时设置是否合适

### 构建成功标志
✅ npm install 完成（~399 packages）  
✅ Next.js 编译成功  
✅ 静态页面生成完成  
✅ API 路由配置正确  

## 监控和维护
- 在 Vercel Dashboard 查看部署日志
- 监控函数执行时间和错误率
- 定期更新依赖和安全补丁
