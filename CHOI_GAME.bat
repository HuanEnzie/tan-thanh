@echo off
cd /d "%~dp0"
where python >nul 2>nul
if %errorlevel%==0 (
  start "" cmd /c "timeout /t 1 >nul & start http://localhost:8765"
  python -m http.server 8765
) else (
  start "" index.html
)
