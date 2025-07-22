import { createClient } from '@supabase/supabase-js'

// Test database connection and setup
async function testDatabaseConnection() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in environment variables')
    console.log('Please ensure the following are set in .env.local:')
    console.log('- NEXT_PUBLIC_SUPABASE_URL')
    console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY')
    return false
  }

  if (supabaseUrl.includes('your_supabase') || supabaseKey.includes('your_supabase')) {
    console.error('❌ Please replace placeholder values in .env.local with actual Supabase credentials')
    return false
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    console.log('🔄 Testing Supabase connection...')
    
    // Test basic connection
    const { data, error } = await supabase.from('categories').select('count').limit(1)
    
    if (error) {
      console.error('❌ Database connection failed:', error.message)
      if (error.message.includes('relation "categories" does not exist')) {
        console.log('\n📋 Database tables not found. Please run the schema.sql file in your Supabase dashboard:')
        console.log('1. Go to your Supabase project dashboard')
        console.log('2. Navigate to SQL Editor')
        console.log('3. Copy and paste the content from database/schema.sql')
        console.log('4. Run the SQL script to create tables')
      }
      return false
    }

    console.log('✅ Database connection successful!')
    
    // Test tables existence
    const tables = ['categories', 'keywords', 'posts']
    for (const table of tables) {
      const { error: tableError } = await supabase.from(table).select('count').limit(1)
      if (tableError) {
        console.error(`❌ Table '${table}' not found:`, tableError.message)
        return false
      } else {
        console.log(`✅ Table '${table}' exists`)
      }
    }

    // Test categories data
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('name')
      .limit(5)

    if (categoriesError) {
      console.error('❌ Error reading categories:', categoriesError.message)
      return false
    }

    console.log(`✅ Found ${categories?.length || 0} categories in database`)
    if (categories && categories.length > 0) {
      console.log('📂 Available categories:', categories.map(c => c.name).join(', '))
    }

    return true

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return false
  }
}

// Export for use in other files
export { testDatabaseConnection }

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testDatabaseConnection()
    .then(success => {
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      console.error('❌ Test failed:', error)
      process.exit(1)
    })
}