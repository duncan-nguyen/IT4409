#!/bin/bash

# CNWeb Setup Script
# This script helps you set up the CNWeb project

set -e

echo "========================================="
echo "  CNWeb Project Setup"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    echo "Please install Docker Desktop: https://www.docker.com/products/docker-desktop"
    exit 1
fi

echo -e "${GREEN}✅ Docker is installed${NC}"

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✅ Docker Compose is installed${NC}"
echo ""

# Ask user which setup they want
echo "Choose setup mode:"
echo "1) Full Docker setup (Recommended for quick start)"
echo "2) Local development setup (Requires Node.js)"
echo "3) Just show me the commands"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "========================================="
        echo "  Starting Full Docker Setup"
        echo "========================================="
        echo ""
        
        echo -e "${YELLOW}Building and starting all services...${NC}"
        docker-compose up --build -d
        
        echo ""
        echo -e "${GREEN}✅ All services started!${NC}"
        echo ""
        echo "Services running at:"
        echo "  🌐 Frontend:         http://localhost:3000"
        echo "  🔧 Room API:         http://localhost:4000"
        echo "  📡 Signaling Server: http://localhost:5000"
        echo "  🗄️  PostgreSQL:       localhost:5432"
        echo ""
        echo "View logs with:"
        echo "  docker-compose logs -f [service-name]"
        echo ""
        echo "Stop services with:"
        echo "  docker-compose down"
        echo ""
        ;;
        
    2)
        echo ""
        echo "========================================="
        echo "  Local Development Setup"
        echo "========================================="
        echo ""
        
        # Check Node.js
        if ! command -v node &> /dev/null; then
            echo -e "${RED}❌ Node.js is not installed${NC}"
            echo "Please install Node.js 18+: https://nodejs.org/"
            exit 1
        fi
        
        echo -e "${GREEN}✅ Node.js is installed: $(node --version)${NC}"
        echo ""
        
        # Start PostgreSQL and COTURN with Docker
        echo -e "${YELLOW}Starting PostgreSQL and COTURN...${NC}"
        docker-compose up -d postgres coturn
        
        echo ""
        echo -e "${GREEN}✅ Database and COTURN started${NC}"
        echo ""
        echo "Now open 3 separate terminals and run:"
        echo ""
        echo -e "${YELLOW}Terminal 1 - Frontend:${NC}"
        echo "  cd frontend"
        echo "  npm install"
        echo "  npm run dev"
        echo ""
        echo -e "${YELLOW}Terminal 2 - Room API:${NC}"
        echo "  cd room-api"
        echo "  npm install"
        echo "  cp .env.example .env"
        echo "  npm run dev"
        echo ""
        echo -e "${YELLOW}Terminal 3 - Signaling Server:${NC}"
        echo "  cd signaling-server"
        echo "  npm install"
        echo "  cp .env.example .env"
        echo "  npm run dev"
        echo ""
        ;;
        
    3)
        echo ""
        echo "========================================="
        echo "  Quick Reference Commands"
        echo "========================================="
        echo ""
        echo -e "${YELLOW}Docker Commands:${NC}"
        echo "  Start all services:"
        echo "    docker-compose up --build"
        echo ""
        echo "  Start in background:"
        echo "    docker-compose up -d --build"
        echo ""
        echo "  View logs:"
        echo "    docker-compose logs -f"
        echo "    docker-compose logs -f frontend"
        echo ""
        echo "  Stop services:"
        echo "    docker-compose down"
        echo ""
        echo "  Stop and remove volumes:"
        echo "    docker-compose down -v"
        echo ""
        echo -e "${YELLOW}Development Commands:${NC}"
        echo "  Frontend:"
        echo "    cd frontend && npm install && npm run dev"
        echo ""
        echo "  Room API:"
        echo "    cd room-api && npm install && npm run dev"
        echo ""
        echo "  Signaling Server:"
        echo "    cd signaling-server && npm install && npm run dev"
        echo ""
        echo -e "${YELLOW}Testing:${NC}"
        echo "  Create a room:"
        echo "    curl -X POST http://localhost:4000/api/rooms \\"
        echo "      -H 'Content-Type: application/json' \\"
        echo "      -d '{\"name\":\"Test Room\"}'"
        echo ""
        echo "  List rooms:"
        echo "    curl http://localhost:4000/api/rooms"
        echo ""
        echo "  Health checks:"
        echo "    curl http://localhost:4000/health"
        echo "    curl http://localhost:5000/health"
        echo ""
        ;;
        
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo "========================================="
echo "  📚 Documentation"
echo "========================================="
echo ""
echo "Read the following files for more information:"
echo "  📄 README.md           - Main documentation"
echo "  🚀 QUICKSTART.md       - Quick start guide"
echo "  📋 PROJECT_SUMMARY.md  - Project overview"
echo "  🏗️  docs/ARCHITECTURE.md - System architecture"
echo "  💻 docs/DEVELOPMENT.md  - Development guide"
echo "  🚢 docs/DEPLOYMENT.md   - Deployment guide"
echo ""
echo -e "${GREEN}Setup complete! Happy coding! 🎉${NC}"
