# CNWeb Setup Script for Windows PowerShell
# This script helps you set up the CNWeb project on Windows

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  CNWeb Project Setup" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker is installed: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed" -ForegroundColor Red
    Write-Host "Please install Docker Desktop: https://www.docker.com/products/docker-desktop"
    exit 1
}

# Check if Docker Compose is installed
try {
    $composeVersion = docker-compose --version
    Write-Host "✅ Docker Compose is installed: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose is not installed" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Ask user which setup they want
Write-Host "Choose setup mode:" -ForegroundColor Yellow
Write-Host "1) Full Docker setup (Recommended for quick start)"
Write-Host "2) Local development setup (Requires Node.js)"
Write-Host "3) Just show me the commands"
Write-Host ""
$choice = Read-Host "Enter your choice (1-3)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "=========================================" -ForegroundColor Cyan
        Write-Host "  Starting Full Docker Setup" -ForegroundColor Cyan
        Write-Host "=========================================" -ForegroundColor Cyan
        Write-Host ""
        
        Write-Host "Building and starting all services..." -ForegroundColor Yellow
        docker-compose up --build -d
        
        Write-Host ""
        Write-Host "✅ All services started!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Services running at:" -ForegroundColor Cyan
        Write-Host "  🌐 Frontend:         http://localhost:3000"
        Write-Host "  🔧 Room API:         http://localhost:4000"
        Write-Host "  📡 Signaling Server: http://localhost:5000"
        Write-Host "  🗄️  PostgreSQL:       localhost:5432"
        Write-Host ""
        Write-Host "View logs with:" -ForegroundColor Yellow
        Write-Host "  docker-compose logs -f [service-name]"
        Write-Host ""
        Write-Host "Stop services with:" -ForegroundColor Yellow
        Write-Host "  docker-compose down"
        Write-Host ""
    }
    
    "2" {
        Write-Host ""
        Write-Host "=========================================" -ForegroundColor Cyan
        Write-Host "  Local Development Setup" -ForegroundColor Cyan
        Write-Host "=========================================" -ForegroundColor Cyan
        Write-Host ""
        
        # Check Node.js
        try {
            $nodeVersion = node --version
            Write-Host "✅ Node.js is installed: $nodeVersion" -ForegroundColor Green
        } catch {
            Write-Host "❌ Node.js is not installed" -ForegroundColor Red
            Write-Host "Please install Node.js 18+: https://nodejs.org/"
            exit 1
        }
        
        Write-Host ""
        
        # Start PostgreSQL and COTURN with Docker
        Write-Host "Starting PostgreSQL and COTURN..." -ForegroundColor Yellow
        docker-compose up -d postgres coturn
        
        Write-Host ""
        Write-Host "✅ Database and COTURN started" -ForegroundColor Green
        Write-Host ""
        Write-Host "Now open 3 separate PowerShell windows and run:" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Terminal 1 - Frontend:" -ForegroundColor Yellow
        Write-Host "  cd frontend"
        Write-Host "  npm install"
        Write-Host "  npm run dev"
        Write-Host ""
        Write-Host "Terminal 2 - Room API:" -ForegroundColor Yellow
        Write-Host "  cd room-api"
        Write-Host "  npm install"
        Write-Host "  Copy-Item .env.example .env"
        Write-Host "  npm run dev"
        Write-Host ""
        Write-Host "Terminal 3 - Signaling Server:" -ForegroundColor Yellow
        Write-Host "  cd signaling-server"
        Write-Host "  npm install"
        Write-Host "  Copy-Item .env.example .env"
        Write-Host "  npm run dev"
        Write-Host ""
    }
    
    "3" {
        Write-Host ""
        Write-Host "=========================================" -ForegroundColor Cyan
        Write-Host "  Quick Reference Commands" -ForegroundColor Cyan
        Write-Host "=========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Docker Commands:" -ForegroundColor Yellow
        Write-Host "  Start all services:"
        Write-Host "    docker-compose up --build"
        Write-Host ""
        Write-Host "  Start in background:"
        Write-Host "    docker-compose up -d --build"
        Write-Host ""
        Write-Host "  View logs:"
        Write-Host "    docker-compose logs -f"
        Write-Host "    docker-compose logs -f frontend"
        Write-Host ""
        Write-Host "  Stop services:"
        Write-Host "    docker-compose down"
        Write-Host ""
        Write-Host "  Stop and remove volumes:"
        Write-Host "    docker-compose down -v"
        Write-Host ""
        Write-Host "Development Commands:" -ForegroundColor Yellow
        Write-Host "  Frontend:"
        Write-Host "    cd frontend; npm install; npm run dev"
        Write-Host ""
        Write-Host "  Room API:"
        Write-Host "    cd room-api; npm install; npm run dev"
        Write-Host ""
        Write-Host "  Signaling Server:"
        Write-Host "    cd signaling-server; npm install; npm run dev"
        Write-Host ""
        Write-Host "Testing:" -ForegroundColor Yellow
        Write-Host "  Create a room:"
        Write-Host "    curl -Method POST http://localhost:4000/api/rooms ``"
        Write-Host "      -ContentType 'application/json' ``"
        Write-Host "      -Body '{\"name\":\"Test Room\"}'"
        Write-Host ""
        Write-Host "  List rooms:"
        Write-Host "    curl http://localhost:4000/api/rooms"
        Write-Host ""
        Write-Host "  Health checks:"
        Write-Host "    curl http://localhost:4000/health"
        Write-Host "    curl http://localhost:5000/health"
        Write-Host ""
    }
    
    default {
        Write-Host "❌ Invalid choice" -ForegroundColor Red
        exit 1
    }
}

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  📚 Documentation" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Read the following files for more information:"
Write-Host "  📄 README.md           - Main documentation"
Write-Host "  🚀 QUICKSTART.md       - Quick start guide"
Write-Host "  📋 PROJECT_SUMMARY.md  - Project overview"
Write-Host "  🏗️  docs/ARCHITECTURE.md - System architecture"
Write-Host "  💻 docs/DEVELOPMENT.md  - Development guide"
Write-Host "  🚢 docs/DEPLOYMENT.md   - Deployment guide"
Write-Host ""
Write-Host "Setup complete! Happy coding! 🎉" -ForegroundColor Green
