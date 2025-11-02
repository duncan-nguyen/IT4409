#!/bin/bash

# Start CV/ML Service
# Script để khởi động service nhanh chóng

echo "🚀 Starting CV/ML Service..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if Python is available
if command -v python3 &> /dev/null; then
    echo "✓ Python3 found"
    echo "📡 Starting HTTP Server on port 8000..."
    echo ""
    echo "🌐 Open your browser and go to:"
    echo "   → http://localhost:8000/cv-ml-service/"
    echo "   → http://localhost:8000/cv-ml-service/demo.html (simple demo)"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    cd "$(dirname "$0")"
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "✓ Python found"
    echo "📡 Starting HTTP Server on port 8000..."
    echo ""
    echo "🌐 Open your browser and go to:"
    echo "   → http://localhost:8000/cv-ml-service/"
    echo ""
    
    cd "$(dirname "$0")"
    python -m http.server 8000
else
    echo "❌ Python not found!"
    echo ""
    echo "Please install Python or use Node.js:"
    echo "  npm install -g http-server"
    echo "  cd cv-ml-service"
    echo "  http-server -p 8000"
    exit 1
fi

