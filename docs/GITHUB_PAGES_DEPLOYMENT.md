# GitHub Pages Deployment Guide

## Overview
This document provides step-by-step instructions for deploying the JSON Formatter to GitHub Pages.

## Prerequisites
- GitHub account (free at https://github.com)
- Git installed on your machine
- Your project pushed to a GitHub repository

## Deployment Steps

### 1. Create/Setup GitHub Repository

If you haven't already created a GitHub repository:

1. Go to https://github.com/new
2. Create a new repository named `json-formatter`
3. Choose **Public** (required for free GitHub Pages)
4. Click "Create repository"

### 2. Clone and Configure Local Repository

```bash
# Navigate to your project directory
cd json-formatter

# Initialize git (if not already done)
git init

# Add GitHub as remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/json-formatter.git

# Verify remote is set correctly
git remote -v
```

### 3. Commit and Push to GitHub

```bash
# Add all files to staging area
git add .

# Create initial commit
git commit -m "Initial commit: JSON Formatter - Format, validate, and minify JSON online"

# Push to main branch (or master if that's your default)
git branch -M main
git push -u origin main
```

### 4. Enable GitHub Pages in Repository Settings

1. Go to your repository on GitHub: `https://github.com/YOUR_USERNAME/json-formatter`
2. Click **Settings** (⚙️ icon)
3. Scroll down to **"Pages"** section in the left sidebar
4. Under **"Source"**, select:
   - **Deploy from a branch**
   - **Branch**: `main` (or `master`)
   - **Folder**: `/ (root)`
5. Click **Save**

The page should now show: "Your site is live at `https://YOUR_USERNAME.github.io/json-formatter/`"

### 5. Verify Deployment

- Wait 1-2 minutes for GitHub to build and deploy
- Visit: `https://YOUR_USERNAME.github.io/json-formatter/`
- You should see your JSON Formatter tool live!

### 6. Configure Custom Domain (Optional)

If you own a custom domain:

1. In Repository Settings → Pages
2. Under "Custom domain", enter your domain (e.g., `jsonformatter.com`)
3. Add DNS records to your domain registrar:
   - **Type A records** pointing to GitHub's IP addresses:
     - `185.199.108.153`
     - `185.199.109.153`
     - `185.199.110.153`
     - `185.199.111.153`
   - Or **CNAME record** pointing to: `YOUR_USERNAME.github.io`
4. Click **Save**
5. Check "Enforce HTTPS" after DNS verification

## Automated Deployments

### GitHub Actions Workflow
This project includes an automated GitHub Actions workflow (`.github/workflows/deploy.yml`) that:
- Automatically builds and deploys on every push to `main` branch
- Handles Pull Requests
- Manages permissions automatically
- No additional setup required!

### Viewing Deployment Status

1. Go to your GitHub repository
2. Click the **Actions** tab
3. You'll see deployment runs and their status
4. Click on any run to see detailed logs

## Troubleshooting

### Site not appearing after push
- **Wait longer**: GitHub Pages can take 1-2 minutes to deploy
- **Check Actions tab**: Ensure the deploy workflow completed successfully
- **Clear browser cache**: Hard refresh (Ctrl+Shift+R on Windows)
- **Check branch**: Verify you're pushing to `main` or `master`

### 404 Error on GitHub Pages
- **Check Settings**: Verify GitHub Pages is enabled
- **Check source branch**: Ensure correct branch is selected
- **Check file paths**: All CSS/JS paths in `index.html` should be relative
- **Check .nojekyll**: File should exist at root (already added)

### CSS/JS not loading
- **Relative paths**: Use relative paths like `css/styles.css` not `/css/styles.css`
- **Check index.html**: Verify link tags point to correct files
- **View browser console**: Check for 404 errors in DevTools

## Best Practices

✅ **Do**:
- Keep `main` branch deployment-ready
- Use descriptive commit messages
- Test locally before pushing
- Monitor GitHub Actions logs
- Keep CSS/JS files at project root level

❌ **Don't**:
- Push broken code to main
- Use absolute paths for assets
- Block .nojekyll file
- Commit sensitive data (API keys, tokens)

## Monitoring & Analytics

### Google Analytics
1. Create account at https://analytics.google.com
2. Get your Measurement ID (G-XXXXXXXXXX)
3. Replace placeholder in `index.html` head section
4. Redeploy and wait 24-48 hours for data collection

### Google AdSense
1. Create AdSense account at https://adsense.google.com
2. Add your publisher ID to `index.html`
3. Redeploy
4. Monitor earnings in AdSense dashboard

## Updating Your Site

After initial deployment, to update your site:

```bash
# Make your changes locally
# Edit files as needed

# Commit changes
git add .
git commit -m "Description of changes"

# Push to GitHub
git push origin main

# GitHub Actions automatically deploys within 1-2 minutes
```

## Support & Resources

- **GitHub Pages Docs**: https://docs.github.com/en/pages
- **GitHub Actions Docs**: https://docs.github.com/en/actions
- **Troubleshooting**: https://docs.github.com/en/pages/getting-started-with-github-pages/troubleshooting-custom-domains

---

**Last Updated**: April 18, 2026  
**Status**: Ready for Deployment
