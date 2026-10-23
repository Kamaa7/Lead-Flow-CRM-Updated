@echo off
echo Starting LeadFlow CRM Backend...
echo.

call .\venv\Scripts\activate
if %ERRORLEVEL% NEQ 0 (
    echo Error activating virtual environment
    pause
    exit /b 1
)

echo Starting FastAPI server...
uvicorn server:app --reload --port 8001

pause
