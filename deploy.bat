@echo off
REM WhatsApp Bot Deployment Script for Windows
REM This script helps you deploy your WhatsApp bot to Render via GitHub

echo 🚀 WhatsApp Bot Deployment Script
echo =================================

REM Check if git is initialized
if not exist ".git" (
    echo 📁 Initializing Git repository...
    git init
)

REM Add all files
echo 📋 Adding files to Git...
git add .

REM Commit changes
set /p commit_message="Enter commit message (default: Deploy to Render): "
if "%commit_message%"=="" set commit_message=Deploy to Render
echo 💾 Committing changes...
git commit -m "%commit_message%"

REM Check if remote exists
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo 🔗 Setting up GitHub remote...
    set /p github_username="Enter your GitHub username: "
    set /p repo_name="Enter your repository name (default: whatsapp-bot): "
    if "%repo_name%"=="" set repo_name=whatsapp-bot
    
    git remote add origin "https://github.com/%github_username%/%repo_name%.git"
)

REM Push to GitHub
echo 📤 Pushing to GitHub...
git branch -M main
git push -u origin main

echo ✅ Code pushed to GitHub successfully!
echo.
echo 📋 Next steps:
echo 1. Go to https://dashboard.render.com/
echo 2. Click 'New +' and select 'Web Service'
echo 3. Connect your GitHub repository
echo 4. Configure the following settings:
echo    - Build Command: npm install
echo    - Start Command: npm start
echo    - Environment Variables:
echo      * NODE_ENV=production
echo      * PORT=10000
echo      * BOT_PREFIX=!
echo 5. Deploy and wait for QR code in logs
echo.
echo 🎉 Your WhatsApp bot will be live shortly!
pause
