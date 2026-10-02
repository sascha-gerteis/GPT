@echo off
setlocal
cd /d "%~dp0"
set "PY_CMD="
where python >nul 2>nul && set "PY_CMD=python"
if not defined PY_CMD (
  where py >nul 2>nul && set "PY_CMD=py -3"
)
if not defined PY_CMD (
  echo.
  echo Python 3 is required to run this local demo.
  echo Install Python 3, then run START_ARCADE.bat again.
  echo.
  pause
  exit /b 1
)
start "Skill Arcade Local Server" cmd /c "%PY_CMD% -m http.server 8080"
timeout /t 1 /nobreak >nul
start "" "http://localhost:8080/"
endlocal
