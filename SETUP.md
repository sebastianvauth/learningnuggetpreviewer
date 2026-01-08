# 🚀 Setup Guide - Learning Nugget Platform

## Quick Start (Development)

### Prerequisites
- Web browser (Chrome, Firefox, Edge recommended)
- Text editor (VS Code, Sublime, etc.)
- Git installed
- Node.js 16+ (optional, for build tools)

---

## Step 1: Clone Repository

```bash
git clone https://github.com/sebastianvauth/learningnuggetpreviewer.git
cd learningnuggetpreviewer
```

---

## Step 2: Configure Environment Variables

### 2.1 Copy Environment Template
```bash
cp .env.example .env
```

### 2.2 Get Supabase Credentials

1. Go to https://supabase.com/dashboard
2. Select or create your project
3. Navigate to **Settings** → **API**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

### 2.3 Edit `.env` File

Open `.env` and replace placeholders:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
VITE_ENVIRONMENT=development
```

**⚠️ NEVER commit `.env` to git!** (It's already in `.gitignore`)

---

## Step 3: Run Locally

### Option A: Simple HTTP Server (No Build)

Since this uses ES6 modules, you need an HTTP server (not file://).

**Using Python:**
```bash
python -m http.server 8000
# Open http://localhost:8000
```

**Using Node.js:**
```bash
npx http-server -p 8000
# Open http://localhost:8000
```

**Using VS Code:**
- Install "Live Server" extension
- Right-click `index.html` → "Open with Live Server"

### Option B: Use Vite (Recommended for Development)

```bash
# Install dependencies
npm install

# Start dev server with hot reload
npm run dev
```

---

## Step 4: Verify Setup

1. Open browser to http://localhost:8000 (or Vite's URL)
2. Open browser console (F12)
3. Look for:
   ```
   ✓ Configuration loaded
   ✓ Supabase client initialized successfully
   ```
4. Try signing up/logging in

---

## Step 5: Database Setup (First Time Only)

### 5.1 Run SQL Schema

1. Go to Supabase Dashboard → **SQL Editor**
2. Copy contents from `supabase_schema_fixed.sql`
3. Paste and run the SQL
4. Verify tables created:
   - `profiles`
   - `course_progress`
   - `achievements`
   - `user_settings`

### 5.2 Enable Row Level Security

The schema includes RLS policies, but verify:
1. Dashboard → **Authentication** → **Policies**
2. Check that policies exist for all tables

---

## Production Deployment

See [SECURITY_CREDENTIAL_ROTATION.md](SECURITY_CREDENTIAL_ROTATION.md) for production setup with GitHub Actions.

### Quick Production Checklist:
- [ ] Set `VITE_ENVIRONMENT=production` in deployment
- [ ] Use GitHub Secrets for credentials (never commit)
- [ ] Enable HTTPS
- [ ] Configure CSP headers
- [ ] Test authentication flow
- [ ] Monitor Supabase usage

---

## Troubleshooting

### "Configuration error: Missing required environment variable"
- Check `.env` file exists
- Verify all `VITE_*` variables are set
- Try restarting dev server

### "Supabase not available - running in offline mode"
- Check browser console for errors
- Verify Supabase CDN loaded: `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2`
- Check internet connection

### "Failed to load progress from Supabase"
- Check credentials in `.env` are correct
- Verify database schema is set up
- Check Supabase dashboard for errors

### CORS Errors
- Make sure you're using HTTP server (not file://)
- Check Supabase dashboard → **Authentication** → **URL Configuration**
- Add `http://localhost:8000` to allowed URLs

### ES6 Module Errors
- Verify `<script type="module">` in index.html
- Use HTTP server (modules don't work with file://)
- Check import paths are correct

---

## Development Workflow

### Making Changes

1. Create feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make changes and test locally

3. Commit (verify no credentials):
   ```bash
   git status  # Should NOT show .env
   git add .
   git commit -m "feat: your feature description"
   ```

4. Push and create PR:
   ```bash
   git push origin feature/your-feature-name
   ```

### Running Tests

```bash
# Open test runner in browser
open tests/test_runner.html

# Or navigate to http://localhost:8000/tests/test_runner.html
```

---

## File Structure

```
learning-nugget/
├── .env                    # Your credentials (NOT in git)
├── .env.example            # Template (safe to commit)
├── .gitignore              # Excludes .env
├── config.js               # Configuration loader
├── script.js               # Main application
├── style.css               # Global styles
├── index.html              # Entry point
├── content.json            # Course catalog
├── course_content/         # Lesson HTML files
│   └── 03-computer-vision/
│       ├── styles/
│       │   └── lesson.css  # Shared lesson styles
│       └── cv-ch*/         # Chapter folders
├── tests/                  # Test suite
├── supabase_schema*.sql    # Database schemas
├── SETUP.md                # This file
└── SECURITY_*.md           # Security docs
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous/public key |
| `VITE_ENVIRONMENT` | ❌ | `development` or `production` (default: production) |
| `VITE_ALPHA_LOGIN_ONLY` | ❌ | Require login to view content (default: true) |
| `VITE_AUTO_COMPLETE_ON_LOAD` | ❌ | Auto-mark lessons complete (default: false) |

---

## Next Steps

- [ ] Complete setup checklist above
- [ ] Read [SECURITY_CREDENTIAL_ROTATION.md](SECURITY_CREDENTIAL_ROTATION.md)
- [ ] Review [BEST_PRACTICES_FOR_LESSON_HTML.md](BEST_PRACTICES_FOR_LESSON_HTML.md)
- [ ] Explore course content in `course_content/`
- [ ] Customize feature flags in `.env`

---

## Need Help?

- Check [GitHub Issues](https://github.com/sebastianvauth/learningnuggetpreviewer/issues)
- Review Supabase docs: https://supabase.com/docs
- Contact: [your-email@example.com]
