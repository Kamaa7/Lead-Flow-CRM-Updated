@echo off
echo Setting up LeadFlow CRM Backend...
echo.

echo Step 1: Creating virtual environment...
python -m venv venv
if %ERRORLEVEL% NEQ 0 (
    echo Error creating virtual environment
    pause
    exit /b 1
)

echo Step 2: Activating virtual environment...
call .\venv\Scripts\activate
if %ERRORLEVEL% NEQ 0 (
    echo Error activating virtual environment
    pause
    exit /b 1
)

echo Step 3: Upgrading pip...
python -m pip install --upgrade pip
if %ERRORLEVEL% NEQ 0 (
    echo Error upgrading pip
    pause
    exit /b 1
)

echo Step 4: Installing dependencies...
pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo Error installing dependencies
    pause
    exit /b 1
)

echo Step 5: Creating .env file...
echo # Backend Configuration > .env
echo SECRET_KEY=your-secret-key-here >> .env
echo ALGORITHM=HS256 >> .env
echo ACCESS_TOKEN_EXPIRE_MINUTES=1440 >> .env
echo DATABASE_URL=sqlite:///./leadflow.db >> .env
echo FRONTEND_URL=http://localhost:3000 >> .env
echo.

echo Backend setup completed successfully!
echo.
echo To start the backend server, run:
echo    .\start_backend.bat

pause
