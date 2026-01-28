#!/usr/bin/env node

/**
 * Script de validação sintática
 * Verifica se todos os módulos podem ser carregados sem erros
 */

const path = require('path');

console.log('\n🔍 Validando sintaxe do código SCAA...\n');

const files = [
  'gateway/auth.js',
  'gateway/audit.js',
  'gateway/accesscontrol.js',
  'gateway/decisionengine.js',
  'gateway/detector.js',
  'gateway/fallback.js',
  'gateway/helpers.js',
  'gateway/index.js',
  'backend-proxy/proxy.js',
  'storage/logStore.js',
];

let validCount = 0;
let errorCount = 0;

files.forEach(file => {
  try {
    const filePath = path.join(__dirname, file);
    require(filePath);
    console.log(`✅ ${file}`);
    validCount++;
  } catch (error) {
    console.error(`❌ ${file}`);
    console.error(`   Erro: ${error.message}\n`);
    errorCount++;
  }
});

console.log(`\n📊 Resultado: ${validCount} arquivos ✅ | ${errorCount} arquivos ❌\n`);

if (errorCount === 0) {
  console.log('🎉 Todos os arquivos têm sintaxe válida!\n');
  process.exit(0);
} else {
  console.log('⚠️  Alguns arquivos têm erros de sintaxe!\n');
  process.exit(1);
}
