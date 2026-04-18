# 📋 GitHub Pages - Step by Step (Commands)

This is a quick reference guide with all the exact commands you need to deploy to GitHub Pages.

## Step 1: Verify Git is Set Up

```bash
# Navigate to your project
cd "c:\Users\DELL\Documents\learning\New folder\my project\json-formatter"

# Check if git is initialized
git status
# Expected: "On branch main" (or master)
```

**If git is NOT initialized:**
```bash
git init
```

## Step 2: Add GitHub Remote

```bash
# Check current remote
git remote -v
# If empty, add GitHub remote (replace YOUR_USERNAME)

git remote add origin https://github.com/YOUR_USERNAME/json-formatter.git

# Verify it was added
git remote -v
```

If you need to change the remote URL:
```bash
git remote set-url origin https://github.com/YOUR_USERNAME/json-formatter.git
```

## Step 3: Commit All Files

```bash
# Check what will be committed
git status

# Stage all files
git add .

# Commit with a message
git commit -m "Initial commit: JSON Formatter - Format, validate, and minify JSON online"

# Verify commit
git log --oneline -3
```

## Step 4: Set Default Branch to Main

```bash
# Rename branch to main (if it's not already)
git branch -M main

# Verify you're on main branch
git branch
# Expected: * main
```

## Step 5: Push to GitHub

```bash
# Push to GitHub (first time with -u flag)
git push -u origin main

# For future pushes, just use:
git push origin main
```

**Expected Output:**
```
Enumerating objects: XX, done.
Counting objects: 100% (XX/XX), done.
Delta compression using up to X threads
Compressing objects: 100% (XX/XX), done.
Writing objects: 100% (XX/XX)
...
To https://github.com/YOUR_USERNAME/json-formatter.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

## Step 6: Monitor GitHub Actions Deployment

```bash
# Check if there are any uncommitted changes
git status
# Should show: "nothing to commit, working tree clean"

# View recent commits
git log --oneline -5

# List all branches
git branch -a
```

## Step 7: Verify GitHub Pages is Enabled

Once pushed, verify in GitHub:
1. Go to: `https://github.com/YOUR_USERNAME/json-formatter`
2. Click **Settings** ⚙️
3. Click **Pages** in left sidebar
4. Verify:
   - Source: Branch `main`, Folder `/ (root)`
   - URL: Shows your GitHub Pages URL

## Step 8: Access Your Site

```
Visit: https://YOUR_USERNAME.github.io/json-formatter/
```

Give it 1-2 minutes after pushing for GitHub to deploy.

---

## Future Updates

After initial deployment, to update your site:

```bash
# Make changes to files locally

# Check what changed
git status

# Stage changes
git add .

# Commit changes
git commit -m "Description of changes made"

# Push to GitHub
git push origin main

# Site automatically updates within 1-2 minutes
```

## Useful Git Commands

### View Logs
```bash
# See recent commits
git log --oneline

# See commits from last 7 days
git log --oneline --since="7 days ago"

# See who changed what
git log --name-status
```

### Check Changes
```bash
# Show what files changed
git status

# Show exact changes
git diff

# Show staged changes
git diff --staged
```

### Undo Changes
```bash
# Undo uncommitted changes to a file
git checkout -- filename.txt

# Undo all uncommitted changes
git reset --hard

# Undo last commit (keep changes)
git reset --soft HEAD~1
```

### Sync with GitHub
```bash
# Pull latest changes from GitHub
git pull origin main

# Fetch without merging
git fetch origin

# See differences between local and remote
git log --oneline main..origin/main
```

---

## Troubleshooting Commands

### Check Remote URL
```bash
git remote -v
# Should show your GitHub URL
```

### Fix Wrong Remote
```bash
# Remove wrong remote
git remote remove origin

# Add correct remote
git remote add origin https://github.com/YOUR_USERNAME/json-formatter.git

# Verify
git remote -v
```

### Check Branch
```bash
# List all branches
git branch -a

# Current branch should be: * main

# Switch to main if needed
git checkout main
```

### Force Push (if needed)
```bash
# Only use if you know what you're doing!
git push origin main --force
```

### Reset to Remote
```bash
# Reset local branch to match remote
git reset --hard origin/main
```

---

## CI/CD Status

Check deployment status:
```bash
# In the future, you can check from command line too
# For now, visit GitHub > Actions tab to see status

# Green checkmark ✅ = Successfully deployed
# Red X ❌ = Failed deployment (check logs)
```

## Next Steps

1. ✅ **Push code** (follow steps above)
2. ✅ **Enable GitHub Pages** (Settings → Pages)
3. ⏳ **Wait 1-2 minutes** for deployment
4. ✅ **Visit your site** at `https://YOUR_USERNAME.github.io/json-formatter/`
5. ✅ **(Optional) Add custom domain**
6. ✅ **(Optional) Set up Google Analytics**
7. ✅ **(Optional) Set up Google AdSense**

---

**Questions?** See [GITHUB_PAGES_DEPLOYMENT.md](GITHUB_PAGES_DEPLOYMENT.md) for full guide.
