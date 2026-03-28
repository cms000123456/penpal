# GitHub Setup Guide

## Deploy Key Configuration

A deploy key has been generated for this repository.

### Step 1: Add Deploy Key to GitHub

1. Go to: https://github.com/cms000123456/penpal/settings/keys
2. Click **"Add deploy key"**
3. Paste this public key:

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJSCvSGUd7wyMl6q/ZjWLTNV+cJRkIBAmYq5zvy1K8kb deploy@penpal
```

4. Title: `Local Deploy Key`
5. Check **"Allow write access"**
6. Click **"Add key"**

### Step 2: Configure Git to Use Deploy Key

Run this command in the project directory:

```bash
git config core.sshCommand "ssh -i ~/.ssh/deploy_key -F /dev/null"
```

On Windows PowerShell:
```powershell
$keyPath = (Resolve-Path .\.ssh\deploy_key).Path
git config core.sshCommand "ssh -i `"$keyPath`" -F NUL"
```

### Step 3: Add Remote and Push

```bash
# Add the remote
git remote add origin git@github.com:cms000123456/penpal.git

# Add all files
git add .

# Commit
git commit -m "Initial commit: PenPal Draw app"

# Push to GitHub
git push -u origin main
```

If your default branch is `master` instead of `main`:
```bash
git push -u origin master
```

### Alternative: Use the Setup Script

Run this PowerShell script to configure everything:

```powershell
.\.github-setup.ps1
```

## Troubleshooting

### Permission Denied
If you get "Permission denied (publickey)":
1. Make sure the deploy key was added to GitHub with write access
2. Verify the SSH key path is correct in git config

### Wrong Remote URL
If you used HTTPS instead of SSH:
```bash
git remote set-url origin git@github.com:cms000123456/penpal.git
```

### Windows SSH Issues
If SSH is not recognized on Windows:
1. Install Git for Windows: https://git-scm.com/download/win
2. Use Git Bash instead of PowerShell
