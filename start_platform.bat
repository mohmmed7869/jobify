@echo off
title Smart Recruitment Platform - Full System Startup
color 0B

echo ======================================================
echo    Smart Recruitment Platform - Full System Startup
echo    Developed by: Eng. Mohammed Ali (783332292)
echo ======================================================
echo.

:: 1. Start AI Service (FastAPI)
echo [1/3] Starting AI Microservice (Python FastAPI)...
start "AI Service" cmd /k "cd ai-service && python main.py"
timeout /t 5 /nobreak > nul

:: 2. Start Backend (Node.js)
echo [2/3] Starting Backend Server (Node.js Express)...
start "Backend Server" cmd /k "cd backend && npm start"
timeout /t 5 /nobreak > nul

:: 3. Start Frontend (React)
echo [3/3] Starting Client Interface (React)...
start "Frontend Client" cmd /k "cd client && npm start"

echo.
echo ======================================================
echo    All services are starting up!
echo    - AI Service: http://localhost:8000
echo    - Backend: http://localhost:5000
echo    - Frontend: http://localhost:3000
echo.
echo    Developer: Eng. Mohammed Ali (Yemen - Sana'a)
echo ======================================================
pause