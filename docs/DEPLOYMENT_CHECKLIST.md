# 🚀 GitHub Pages Deployment Checklist

Use this checklist to ensure your JSON Formatter is ready for GitHub Pages deployment.

## Pre-Deployment ✅

- [ ] All HTML files are in the root directory or properly referenced
- [ ] All CSS/JS files use relative paths (e.g., `css/styles.css` not `/css/styles.css`)
- [ ] `index.html` is the main entry point
- [ ] `.gitignore` file is present
- [ ] `.nojekyll` file is present (already created)
- [ ] No sensitive data in code (API keys, tokens, passwords)
- [ ] Meta tags in `index.html` are complete:
  - [ ] `<meta charset="UTF-8">`
  - [ ] `<meta name="viewport">`
  - [ ] `<meta name="description">`
  - [ ] `<title>` tag
- [ ] All images and assets are referenced with relative paths
- [ ] Local testing completed (works in browser when opening `index.html`)

## GitHub Setup ✅

- [ ] GitHub repository created (public)
- [ ] Repository URL: `https://github.com/YOUR_USERNAME/json-formatter`
- [ ] Code pushed to `main` branch
  ```bash
  git remote add origin https://github.com/YOUR_USERNAME/json-formatter.git
  git branch -M main
  git push -u origin main
  ```
- [ ] GitHub Actions workflow is in place (`.github/workflows/deploy.yml`)
- [ ] All files committed (nothing uncommitted)
  ```bash
  git status  # Should show "nothing to commit, working tree clean"
  ```

## GitHub Pages Configuration ✅

- [ ] Go to: `https://github.com/YOUR_USERNAME/json-formatter/settings/pages`
- [ ] **Source** is set to: Branch: `main`, Folder: `/ (root)`
- [ ] **Enforce HTTPS** is checked (after DNS propagates)
- [ ] Change is saved
- [ ] Workflow status shows "deployed" in Actions tab

## Post-Deployment ✅

- [ ] Site is accessible at `https://YOUR_USERNAME.github.io/json-formatter/`
- [ ] All pages load correctly
- [ ] CSS and styling displays properly
- [ ] JavaScript functionality works
- [ ] Images load without 404 errors
- [ ] Responsive design works on mobile/tablet
- [ ] Dark mode toggle works (if implemented)
- [ ] Console has no errors (F12 → Console tab)

## Optional Enhancements ✅

- [ ] **Custom Domain Setup**
  - [ ] Domain registered
  - [ ] DNS records added (A records or CNAME)
  - [ ] Domain added in GitHub Pages settings
  - [ ] HTTPS enabled

- [ ] **Analytics Setup**
  - [ ] Google Analytics 4 account created
  - [ ] Measurement ID obtained
  - [ ] ID added to `index.html` (replace `G-XXXXXXXXXX`)
  - [ ] Deployed to production

- [ ] **AdSense Setup**
  - [ ] AdSense account created
  - [ ] Publisher ID obtained
  - [ ] ID added to `index.html` (replace `ca-pub-XXXXXXXXXXXXXXXX`)
  - [ ] Ads set up in AdSense dashboard
  - [ ] Deployed to production

## Troubleshooting Commands ✅

If something goes wrong, use these commands:

```bash
# Check git remote is correct
git remote -v

# Check current branch
git branch

# Check git status
git status

# View recent commits
git log --oneline -5

# Force push (use cautiously!)
git push origin main --force

# Check for untracked files
git status --porcelain
```

## Quick Deployment Steps

1. Make changes locally
2. Test in browser
3. Commit changes: `git commit -m "Description"`
4. Push to GitHub: `git push origin main`
5. Check Actions tab for deployment status
6. Visit `https://YOUR_USERNAME.github.io/json-formatter/` within 1-2 minutes

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Site shows 404 | Enable GitHub Pages in Settings |
| CSS/JS not loading | Check file paths are relative |
| Changes not appearing | Wait 1-2 minutes, hard refresh browser |
| GitHub Actions fail | Check workflow logs in Actions tab |
| Custom domain not working | Verify DNS records and wait 24-48 hours |

## Verification Log

- **Deployment Date**: _______________
- **URL**: `https://YOUR_USERNAME.github.io/json-formatter/`
- **Initial Status**: ✅ Working / ❌ Issues
- **Issues Found**: _____________________________
- **Custom Domain**: Yes / No
- **AdSense Setup**: Yes / No
- **Analytics Setup**: Yes / No

---

**Ready to Deploy?** ✨  
Follow the steps above and your JSON Formatter will be live!
