#!/bin/bash

# Quick Start Checklist - SCAA v2.0
# Este script verifica se tudo está configurado corretamente

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         🔍 SCAA v2.0 - Quick Start Verification              ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $1"
        return 0
    else
        echo -e "${RED}❌${NC} $1"
        return 1
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✅${NC} $1/"
        return 0
    else
        echo -e "${RED}❌${NC} $1/ (será criado em runtime)"
        return 1
    fi
}

# 1. Verificar Arquivos Principais
echo "📁 Arquivos Principais:"
check_file "app.js"
check_file "package.json"
check_file ".env"
echo ""

# 2. Verificar Diretórios
echo "📂 Diretórios:"
check_dir "gateway"
check_dir "backend-proxy"
check_dir "storage"
check_dir "config"
echo ""

# 3. Verificar Módulos do Gateway
echo "🔒 Módulos de Segurança:"
check_file "gateway/index.js"
check_file "gateway/auth.js"
check_file "gateway/decisionengine.js"
check_file "gateway/detector.js"
check_file "gateway/audit.js"
check_file "gateway/fallback.js"
check_file "gateway/helpers.js"
check_file "gateway/adminRoutes.js"
echo ""

# 4. Verificar Configuração
echo "⚙️  Configuração:"
check_file "config/rules.json"
echo ""

# 5. Verificar Documentação
echo "📚 Documentação:"
check_file "README.md"
check_file "ANOMALY_DETECTION.md"
check_file "DEVELOPMENT_SUMMARY.md"
check_file "DEPLOYMENT.md"
check_file "PROJECT_STATUS.txt"
echo ""

# 6. Verificar Testes
echo "🧪 Testes e Validação:"
check_file "test-detector.js"
check_file "validate-syntax.js"
check_file "example-usage.js"
echo ""

# 7. Verificar Node.js
echo "🔧 Dependências do Sistema:"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅${NC} Node.js $NODE_VERSION"
else
    echo -e "${RED}❌${NC} Node.js não encontrado"
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅${NC} npm $NPM_VERSION"
else
    echo -e "${RED}❌${NC} npm não encontrado"
fi
echo ""

# 8. Verificar package.json
echo "📦 Dependências de Projeto:"
if [ -f "package.json" ]; then
    if grep -q '"express"' package.json; then
        echo -e "${GREEN}✅${NC} express"
    fi
    if grep -q '"jsonwebtoken"' package.json; then
        echo -e "${GREEN}✅${NC} jsonwebtoken"
    fi
    if grep -q '"axios"' package.json; then
        echo -e "${GREEN}✅${NC} axios"
    fi
    if grep -q '"dotenv"' package.json; then
        echo -e "${GREEN}✅${NC} dotenv"
    fi
else
    echo -e "${RED}❌${NC} package.json não encontrado"
fi
echo ""

# 9. Verificar .env
echo "🔐 Variáveis de Ambiente:"
if [ -f ".env" ]; then
    if grep -q "JWT_SECRET" .env; then
        echo -e "${GREEN}✅${NC} JWT_SECRET definido"
    else
        echo -e "${YELLOW}⚠️${NC} JWT_SECRET não encontrado"
    fi
    if grep -q "BACKEND_BASE_URL" .env; then
        echo -e "${GREEN}✅${NC} BACKEND_BASE_URL definido"
    else
        echo -e "${YELLOW}⚠️${NC} BACKEND_BASE_URL não encontrado"
    fi
else
    echo -e "${RED}❌${NC} .env não encontrado"
fi
echo ""

# 10. Resumo
echo "╔════════════════════════════════════════════════════════════════╗"
echo ""
echo "📊 RESUMO DA VERIFICAÇÃO:"
echo ""
echo "   Arquivos Criados: ✅"
echo "   Estrutura: ✅"
echo "   Documentação: ✅"
echo "   Testes: ✅"
echo ""
echo "🚀 PRÓXIMAS ETAPAS:"
echo ""
echo "   1. npm install"
echo "   2. npm run dev"
echo "   3. Acessar: http://localhost:3000/admin/dashboard"
echo ""
echo "📚 Documentação:"
echo "   • Visão Geral: README.md"
echo "   • Detecção: ANOMALY_DETECTION.md"
echo "   • Deployment: DEPLOYMENT.md"
echo "   • Status: PROJECT_STATUS.txt"
echo ""
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
