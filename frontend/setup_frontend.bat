@echo off
echo Setting up LeadFlow CRM Frontend...
echo.

echo Step 1: Creating .env file...
echo # Frontend Configuration > .env
echo REACT_APP_API_URL=http://localhost:8001 >> .env
echo REACT_APP_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key >> .env
echo.

echo Step 2: Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Error installing dependencies
    pause
    exit /b 1
)

echo.
echo Frontend setup completed successfully!
echo.
echo To start the frontend development server, run:
echo    npm start

echo.
pause
