@echo off
echo ================================================================
echo 🌊 Starting EcoFlow AI - Industrial Water SCADA Platform
echo ================================================================

set "PATH=%~dp0.tools\node;%PATH%"

echo [1/3] Starting Python AI Analytics Microservice (:8000)...
start "EcoFlow AI Microservice (:8000)" cmd /k "cd /d "%~dp0ai-service" && py server.py"

timeout /t 2 /nobreak >nul

echo [2/3] Starting Express & Socket.io Backend (:5000)...
start "EcoFlow Backend (:5000)" cmd /k "cd /d "%~dp0backend" && node src/server.js"

timeout /t 2 /nobreak >nul

echo [3/3] Starting React SCADA Frontend (:5173)...
start "EcoFlow Frontend (:5173)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

timeout /t 3 /nobreak >nul

echo ================================================================
echo 🚀 All services initialized! Opening dashboard in browser...
echo 👉 http://localhost:5173
echo ================================================================
start http://localhost:5173
