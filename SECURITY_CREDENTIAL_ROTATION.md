# 🔐 Security: Credential Rotation Guide

## ⚠️ URGENT ACTION REQUIRED

Your Supabase credentials were **publicly exposed** in the git repository. You must rotate them immediately.

---

## Step 1: Rotate Supabase Keys (Do This NOW)

### 1.1 Access Supabase Dashboard
1. Go to: https://supabase.com/dashboard
2. Select your project: `hvfbibsjabcuqjmrdmtd`
3. Navigate to: **Settings** → **API**

### 1.2 Generate New Anonymous Key
1. In the "Project API keys" section, find the **anon/public** key
2. Click the **"Reset"** or **"Regenerate"** button
3. **IMPORTANT**: Copy the new key immediately (it won't be shown again)
4. Keep the old key active for 24-48 hours for graceful migration

### 1.3 Update Your Local Environment
1. Open `.env` file in this directory
2. Replace `VITE_SUPABASE_ANON_KEY` with the new key
3. Save the file

```bash
# Example .env update
VITE_SUPABASE_ANON_KEY=eyJhbGc...your-new-key-here
```

### 1.4 Test Locally
```bash
# If using a dev server with hot reload
npm run dev

# Or open index.html directly in browser
# Check browser console for "Supabase client initialized successfully"
```

### 1.5 Revoke Old Key (After Testing)
Once you confirm the new key works:
1. Return to Supabase Dashboard → Settings → API
2. Find the old key in "Previous keys" section
3. Click **"Revoke"**

---

## Step 2: Clean Git History (Optional but Recommended)

The old credentials are still in your git history. Here are options:

### Option A: Simple - Just Move Forward
- The old key is now revoked, so it's useless to attackers
- Add a commit noting the security fix
- Future commits won't contain credentials

```bash
git add .
git commit -m "security: move Supabase credentials to environment variables"
git push
```

### Option B: Advanced - Rewrite History (Nuclear Option)
⚠️ **WARNING**: This rewrites git history. Only do this if:
- You're the sole contributor
- You haven't shared this repo widely
- You understand the risks

```bash
# Use BFG Repo-Cleaner or git-filter-repo
# Instructions: https://github.com/newren/git-filter-repo

# Example using git-filter-repo:
git filter-repo --invert-paths --path script.js --force
```

---

## Step 3: Set Up Production Deployment

### For GitHub Pages (Current Setup)
Since you're using GitHub Pages, you need a build step to inject environment variables.

#### 3.1 Install Vite (Recommended)
```bash
npm init -y
npm install --save-dev vite
```

#### 3.2 Create `vite.config.js`
```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/learningnuggetpreviewer/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html'
      }
    }
  }
});
```

#### 3.3 Update `package.json`
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

#### 3.4 Set GitHub Secrets
1. Go to: https://github.com/sebastianvauth/learningnuggetpreviewer/settings/secrets/actions
2. Click **"New repository secret"**
3. Add:
   - Name: `VITE_SUPABASE_URL`
   - Value: `https://hvfbibsjabcuqjmrdmtd.supabase.co`
4. Add another:
   - Name: `VITE_SUPABASE_ANON_KEY`
   - Value: `your-new-anon-key-here`

#### 3.5 Create GitHub Actions Workflow
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main, master]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build with environment variables
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          VITE_ENVIRONMENT: production
        run: npm run build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

## Step 4: Verify Security

### 4.1 Check .gitignore
Ensure `.env` is in `.gitignore`:
```bash
git check-ignore .env
# Should output: .env
```

### 4.2 Check Git Status
```bash
git status
# .env should NOT appear in the list
```

### 4.3 Scan for Secrets
```bash
# Install truffleHog (optional)
pip install truffleHog

# Scan repo
trufflehog filesystem . --only-verified
```

---

## Step 5: Ongoing Security Best Practices

### 5.1 Never Commit Credentials
- Always use `.env` files for secrets
- Use `.env.example` as a template (safe to commit)
- Review git diffs before committing

### 5.2 Rotate Keys Regularly
- Set a calendar reminder to rotate keys every 6 months
- Rotate immediately if:
  - A team member leaves
  - You suspect a breach
  - Keys are accidentally exposed

### 5.3 Use Environment-Specific Keys
- Development: Use separate Supabase project or keys
- Production: Use production keys only in CI/CD

### 5.4 Enable Supabase Security Features
1. **Row Level Security (RLS)**: Already enabled in your schema ✓
2. **Rate Limiting**: Configure in Supabase dashboard
3. **Email Rate Limiting**: Prevent abuse
4. **API Key Restrictions** (if available):
   - Limit to specific domains
   - Set usage quotas

---

## Step 6: Monitor for Abuse

### 6.1 Check Supabase Logs
- Dashboard → Logs
- Look for unusual activity:
  - Spikes in requests
  - Failed auth attempts
  - Unusual IP addresses

### 6.2 Set Up Alerts
- Configure email alerts for:
  - High database usage
  - Failed auth attempts
  - API errors

---

## Emergency: Key Compromised Again?

If credentials are exposed again:

1. **Immediately revoke** in Supabase dashboard
2. Generate new keys
3. Update `.env` and GitHub Secrets
4. Redeploy application
5. Monitor logs for 24 hours

---

## Checklist

Use this checklist to track your progress:

- [ ] Generated new Supabase anon key
- [ ] Updated local `.env` file
- [ ] Tested locally (auth works)
- [ ] Revoked old Supabase key
- [ ] Verified `.env` is in `.gitignore`
- [ ] Committed changes (without .env)
- [ ] Set up GitHub Secrets
- [ ] Created GitHub Actions workflow
- [ ] Deployed and tested production
- [ ] Set calendar reminder for next rotation (6 months)

---

## Questions?

If you run into issues:
1. Check Supabase dashboard for error logs
2. Check browser console for JavaScript errors
3. Verify environment variables are loaded: `console.log(config)`

## Resources

- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/going-into-prod#security)
- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [OWASP API Security](https://owasp.org/www-project-api-security/)
