#!/bin/bash

# WhatsApp Bot Deployment Script
# This script helps you deploy your WhatsApp bot to Render via GitHub

echo "🚀 WhatsApp Bot Deployment Script"
echo "================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
fi

# Add all files
echo "📋 Adding files to Git..."
git add .

# Commit changes
echo "💾 Committing changes..."
read -p "Enter commit message (default: 'Deploy to Render'): " commit_message
commit_message=${commit_message:-"Deploy to Render"}
git commit -m "$commit_message"

# Check if remote exists
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "🔗 Setting up GitHub remote..."
    read -p "Enter your GitHub username: " github_username
    read -p "Enter your repository name (default: whatsapp-bot): " repo_name
    repo_name=${repo_name:-"whatsapp-bot"}
    
    git remote add origin "https://github.com/$github_username/$repo_name.git"
fi

# Push to GitHub
echo "📤 Pushing to GitHub..."
git branch -M main
git push -u origin main

echo "✅ Code pushed to GitHub successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Go to https://dashboard.render.com/"
echo "2. Click 'New +' and select 'Web Service'"
echo "3. Connect your GitHub repository"
echo "4. Configure the following settings:"
echo "   - Build Command: npm install"
echo "   - Start Command: npm start"
echo "   - Environment Variables:"
echo "     * NODE_ENV=production"
echo "     * PORT=10000"
echo "     * BOT_PREFIX=!"
echo "5. Deploy and wait for QR code in logs"
echo ""
echo "🎉 Your WhatsApp bot will be live shortly!"
