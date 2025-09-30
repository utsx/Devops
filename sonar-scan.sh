#!/bin/bash

# SonarCloud Local Analysis Script
# Этот скрипт запускает анализ кода локально с теми же настройками, что и в CI

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting local SonarCloud analysis...${NC}"

# Проверяем наличие необходимых переменных окружения
if [ -z "$SONAR_TOKEN" ]; then
    echo -e "${RED}❌ SONAR_TOKEN environment variable is not set${NC}"
    echo "Please set your SonarCloud token:"
    echo "export SONAR_TOKEN=your_token_here"
    exit 1
fi

# Проверяем наличие Java
if ! command -v java &> /dev/null; then
    echo -e "${RED}❌ Java is not installed${NC}"
    exit 1
fi

# Проверяем наличие Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Running pre-analysis checks...${NC}"

# Проверяем структуру проекта
if [ ! -f "backend/pom.xml" ]; then
    echo -e "${RED}❌ Backend pom.xml not found${NC}"
    exit 1
fi

if [ ! -f "frontend/package.json" ]; then
    echo -e "${RED}❌ Frontend package.json not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Pre-analysis checks passed${NC}"

# Очищаем предыдущие артефакты
echo -e "${YELLOW}🧹 Cleaning previous artifacts...${NC}"
rm -rf backend/target/
rm -rf frontend/coverage/
rm -rf frontend/build/

# Backend: Тестирование и генерация отчета покрытия
echo -e "${BLUE}🔧 Building and testing backend...${NC}"
cd backend

# Запускаем тесты с coverage
./mvnw clean test jacoco:report
backend_test_result=$?

if [ $backend_test_result -ne 0 ]; then
    echo -e "${RED}❌ Backend tests failed${NC}"
    exit 1
fi

# Проверяем coverage
echo -e "${YELLOW}📊 Checking backend coverage...${NC}"
./mvnw jacoco:check
backend_coverage_result=$?

if [ $backend_coverage_result -ne 0 ]; then
    echo -e "${RED}❌ Backend coverage check failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Backend tests and coverage passed${NC}"

cd ..

# Frontend: Тестирование и генерация отчета покрытия
echo -e "${BLUE}🔧 Testing frontend...${NC}"
cd frontend

# Устанавливаем зависимости
npm ci

# Запускаем тесты с coverage
npm run test:coverage
frontend_test_result=$?

if [ $frontend_test_result -ne 0 ]; then
    echo -e "${RED}❌ Frontend tests failed${NC}"
    exit 1
fi

# Проверяем coverage
if [ -f "coverage/coverage-summary.json" ]; then
    coverage=$(node -p "JSON.parse(require('fs').readFileSync('coverage/coverage-summary.json')).total.lines.pct")
    echo -e "${YELLOW}📊 Frontend coverage: ${coverage}%${NC}"
    
    if [ "$(echo "$coverage >= 80" | bc -l)" -eq 1 ]; then
        echo -e "${GREEN}✅ Frontend coverage meets minimum threshold${NC}"
    else
        echo -e "${RED}❌ Frontend coverage (${coverage}%) is below minimum threshold (80%)${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Frontend coverage report not found${NC}"
    exit 1
fi

cd ..

# Запускаем SonarCloud анализ
echo -e "${BLUE}🔍 Running SonarCloud analysis...${NC}"

# Используем sonar-scanner или Maven plugin
if command -v sonar-scanner &> /dev/null; then
    echo -e "${YELLOW}Using sonar-scanner CLI${NC}"
    sonar-scanner \
        -Dsonar.projectKey=utsx_Devops \
        -Dsonar.organization=utsx \
        -Dsonar.sources=backend/src/main,frontend/src \
        -Dsonar.tests=backend/src/test,frontend/src/__tests__ \
        -Dsonar.java.binaries=backend/target/classes \
        -Dsonar.coverage.jacoco.xmlReportPaths=backend/target/site/jacoco/jacoco.xml \
        -Dsonar.javascript.lcov.reportPaths=frontend/coverage/lcov.info \
        -Dsonar.typescript.lcov.reportPaths=frontend/coverage/lcov.info \
        -Dsonar.host.url=https://sonarcloud.io \
        -Dsonar.token=$SONAR_TOKEN
else
    echo -e "${YELLOW}Using Maven SonarQube plugin${NC}"
    cd backend
    ./mvnw sonar:sonar \
        -Dsonar.token=$SONAR_TOKEN \
        -Dsonar.projectKey=utsx_Devops \
        -Dsonar.organization=utsx \
        -Dsonar.host.url=https://sonarcloud.io
    cd ..
fi

sonar_result=$?

if [ $sonar_result -eq 0 ]; then
    echo -e "${GREEN}🎉 SonarCloud analysis completed successfully!${NC}"
    echo -e "${BLUE}📊 Check results at: https://sonarcloud.io/project/overview?id=utsx_Devops${NC}"
else
    echo -e "${RED}❌ SonarCloud analysis failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All quality checks passed!${NC}"
