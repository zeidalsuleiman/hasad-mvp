#!/bin/bash

# HASAD Setup Script

echo "=========================================="
echo "HASAD Smart Farming System - Setup"
echo "=========================================="
echo ""

# Check if .env exists in backend
if [ ! -f "backend/.env" ]; then
    echo "Creating backend/.env from .env.example..."
    cp .env.example backend/.env
    echo "✓ Created backend/.env"
else
    echo "✓ backend/.env already exists"
fi

echo ""
echo "=========================================="
echo "NEXT STEPS:"
echo "=========================================="
echo ""
echo "1. Edit backend/.env and add your API keys:"
echo "   - OPENWEATHER_API_KEY (required for weather)"
echo "   - ANTHROPIC_API_KEY (required for AI assistant)"
echo ""
echo "2. Start the application:"
echo "   docker-compose up --build"
echo ""
echo "3. Access the application:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:8000"
echo "   - API Docs: http://localhost:8000/docs"
echo ""
echo "For detailed instructions, see SETUP.md"
echo ""
