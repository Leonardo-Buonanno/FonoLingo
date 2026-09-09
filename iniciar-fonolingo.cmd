@echo off
cd /d "%~dp0"
if not exist ".env" (
  copy ".env.example" ".env" >nul
  echo Configure GEMINI_API_KEY no arquivo .env antes do primeiro uso.
  pause
  exit /b 1
)
if not exist "node_modules" call npm install
call npm run build || exit /b 1
start "" "http://localhost:3001"
call npm start
