@echo off
title Aarogya-Ai Launcher
echo ========================================================
echo               AAROGYA-AI - STARTUP SCRIPT
echo ========================================================
echo.

set "PROJ_ROOT=%~dp0"
if "%PROJ_ROOT:~-1%"=="\" set "PROJ_ROOT=%PROJ_ROOT:~0,-1%"
cd /d "%PROJ_ROOT%"

echo [1/3] Checking Python virtual environment...
if exist "%PROJ_ROOT%\venv\Scripts\python.exe" (
    set "VENV_ACTIVATE=%PROJ_ROOT%\venv\Scripts\activate.bat"
) else if exist "%PROJ_ROOT%\..\venv\Scripts\python.exe" (
    set "VENV_ACTIVATE=%PROJ_ROOT%\..\venv\Scripts\activate.bat"
) else (
    echo Creating virtual environment...
    python -m venv venv
    set "VENV_ACTIVATE=%PROJ_ROOT%\venv\Scripts\activate.bat"
    call "%VENV_ACTIVATE%"
    python -m pip install -r backend\requirements.txt
    python backend\ml\run_training.py
)

echo [2/3] Checking Frontend node modules...
if not exist "%PROJ_ROOT%\frontend\node_modules" (
    echo Installing frontend packages...
    cd /d "%PROJ_ROOT%\frontend"
    call npm install
    cd /d "%PROJ_ROOT%"
)

echo [3/3] Launching FastAPI Backend and Vite Frontend...
echo.
echo Starting Backend Server on http://127.0.0.1:8000 ...
cd /d "%PROJ_ROOT%\backend"
start "AarogyaAI Backend" cmd /k "set PYTHONUTF8=1&& call \"%VENV_ACTIVATE%\"&& python -m uvicorn app.main:app --reload --port 8000 --host 0.0.0.0"

rem Wait 2 seconds safely without redirection errors
ping 127.0.0.1 -n 3 >nul

echo Starting Frontend Server on http://localhost:5173 ...
cd /d "%PROJ_ROOT%\frontend"
start "AarogyaAI Frontend" cmd /k "npm run dev -- --host 0.0.0.0"
cd /d "%PROJ_ROOT%"

echo.
echo ========================================================
echo Application is starting!
echo Web App:  http://localhost:5173
echo API Docs: http://127.0.0.1:8000/docs
echo ========================================================
echo.

rem Auto open browser
ping 127.0.0.1 -n 3 >nul
start http://localhost:5173

pause
