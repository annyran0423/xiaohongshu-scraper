import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { resolve } from 'path'

// 手动加载环境变量
dotenv.config({ path: resolve(__dirname, '../.env.local') })

// 创建Supabase客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少Supabase环境变量')
  console.log('SUPABASE_URL:', supabaseUrl ? '已设置' : '未设置')
  console.log('SUPABASE_KEY:', supabaseKey ? '已设置' : '未设置')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDatabaseConnection() {
  console.log('🔍 开始测试数据库连接和schema状态...')
  
  try {
    // 1. 测试基本连接
    console.log('\n1. 测试基本数据库连接...')
    const { data: connectionTest, error: connectionError } = await supabase
      .from('categories')
      .select('*')
      .limit(1)
    
    if (connectionError) {
      console.error('❌ 数据库连接失败:', connectionError.message)
      return
    }
    console.log('✅ 数据库连接成功')
    
    // 2. 检查categories表
    console.log('\n2. 检查categories表...')
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
    
    if (categoriesError) {
      console.error('❌ Categories表查询失败:', categoriesError.message)
    } else {
      console.log(`✅ Categories表正常，共有 ${categories?.length || 0} 个分类`)
      console.log('分类列表:', categories?.map(c => c.name).join(', '))
    }
    
    // 3. 检查posts表结构
    console.log('\n3. 检查posts表结构...')
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .limit(1)
    
    if (postsError) {
      console.error('❌ Posts表查询失败:', postsError.message)
      if (postsError.message.includes('platform')) {
        console.log('🔧 建议：请在Supabase SQL编辑器中执行更新后的schema.sql文件')
        console.log('   特别是添加platform列的ALTER TABLE语句')
      }
    } else {
      console.log('✅ Posts表可以正常访问')
    }
    
    // 4. 检查keywords表
    console.log('\n4. 检查keywords表...')
    const { data: keywords, error: keywordsError } = await supabase
      .from('keywords')
      .select('*')
      .limit(5)
    
    if (keywordsError) {
      console.error('❌ Keywords表查询失败:', keywordsError.message)
    } else {
      console.log(`✅ Keywords表正常，共有 ${keywords?.length || 0} 条记录`)
    }
    
    // 5. 尝试插入测试数据
    console.log('\n5. 尝试插入测试数据...')
    const testPost = {
      title: '数据库连接测试帖子',
      content: '这是一个测试帖子，用于验证数据库连接',
      author: '测试用户',
      url: 'https://test.example.com',
      tags: ['测试', '数据库'],
      images: ['https://test.example.com/image.jpg'],
      platform: 'xiaohongshu',
      category_id: categories && categories.length > 0 ? categories[0].id : null
    }
    
    const { data: insertResult, error: insertError } = await supabase
      .from('posts')
      .insert(testPost)
      .select()
    
    if (insertError) {
      console.error('❌ 测试数据插入失败:', insertError.message)
      if (insertError.message.includes('platform')) {
        console.log('\n🚨 数据库schema需要更新！')
        console.log('请在Supabase项目的SQL编辑器中执行以下语句：')
        console.log('ALTER TABLE posts ADD COLUMN platform VARCHAR(50) DEFAULT \'xiaohongshu\' NOT NULL;')
      }
    } else {
      console.log('✅ 测试数据插入成功')
      console.log('插入的数据:', insertResult)
      
      // 清理测试数据
      const { error: deleteError } = await supabase
        .from('posts')
        .delete()
        .eq('title', '数据库连接测试帖子')
      
      if (!deleteError) {
        console.log('✅ 测试数据已清理')
      }
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error)
  }
}

// 执行测试
testDatabaseConnection()
  .then(() => {
    console.log('\n🎉 数据库测试完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 测试失败:', error)
    process.exit(1)
  })
