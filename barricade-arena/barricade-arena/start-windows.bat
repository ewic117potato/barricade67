@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Node.js is required. Install Node.js LTS from https://nodejs.org/
 pause
 exit /b 1
)
if not exist node_modules (
 echo Installing required server packages...
 call npm install
 if errorlevel 1 (pause & exit /b 1)
)
echo.
echo ==========================================
echo BARRICADE ARENA - http://localhost:3000
echo ==========================================
echo.
echo Friends outside your Wi-Fi need you to deploy this project to a public Node.js host.
echo Keep this window open while playing.
echo.
start "" "http://localhost:3000"
npm start
pause
