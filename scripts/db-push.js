#!/usr/bin/env node
// Script para aplicar o schema no Supabase
// Uso: node scripts/db-push.js

const fs = require('fs')
const path = require('path')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas. Verifique .env.local')
  process.exit(1)
}

const schemaPath = path.join(__dirname, '../supabase/schema.sql')
if (!fs.existsSync(schemaPath)) {
  console.error('❌ Arquivo schema.sql não encontrado em supabase/schema.sql')
  process.exit(1)
}

console.log('📦 Aplicando schema no Supabase...')
console.log(`🔗 URL: ${SUPABASE_URL}`)
console.log('')
console.log('⚠️  Execute o schema.sql diretamente no SQL Editor do Supabase:')
console.log('   1. Acesse: https://supabase.com/dashboard/project/_/sql')
console.log('   2. Cole o conteúdo do arquivo supabase/schema.sql')
console.log('   3. Clique em "Run"')
console.log('')
console.log('📄 Arquivo: supabase/schema.sql')
