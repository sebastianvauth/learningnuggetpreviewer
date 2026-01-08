# 🚀 Quick Start: Get Your New Supabase Publishable Key

## Visual Guide (Step-by-Step)

### 1️⃣ Go to Your Supabase Project Settings

Open this URL in your browser:
```
https://supabase.com/dashboard/project/hvfbibsjabcuqjmrdmtd/settings/api-keys
```

### 2️⃣ What You'll See

You should see **3 tabs**:

```
┌─────────────────────────────────────────────────────────┐
│  [Publishable Key]  [Secret Keys]  [Legacy API Keys]   │
│                                                           │
│  ← Click this first!                                      │
└─────────────────────────────────────────────────────────┘
```

### 3️⃣ Option A: You Already Have a Publishable Key

If you see something like this:

```
Publishable Key Tab:
┌─────────────────────────────────────────────────────────┐
│                                                           │
│  Publishable Key                                          │
│  sb_publishable_aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890      │
│                                              [Copy] 📋    │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

**Action**: Click the **[Copy]** button and skip to Step 4!

### 3️⃣ Option B: No Publishable Key Yet

If you see this instead:

```
Publishable Key Tab:
┌─────────────────────────────────────────────────────────┐
│                                                           │
│  You don't have any publishable keys yet.                │
│                                                           │
│              [Create new API Keys] 🔑                     │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

**Action**:
1. Click **[Create new API Keys]** button
2. Wait a few seconds
3. Your new keys will appear
4. Copy the **Publishable Key** (starts with `sb_publishable_`)

### 4️⃣ Update Your .env File

Open the `.env` file in this directory and update it:

**BEFORE:**
```bash
VITE_SUPABASE_URL=https://hvfbibsjabcuqjmrdmtd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....
```

**AFTER:**
```bash
VITE_SUPABASE_URL=https://hvfbibsjabcuqjmrdmtd.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890
```

### 5️⃣ Test It Works

```bash
# Start local server
npx http-server -p 8000

# Open http://localhost:8000 in your browser
# Check the browser console (F12) - you should see:
# ✓ "Supabase client initialized successfully"
```

Try logging in or signing up to verify everything works!

### 6️⃣ Disable Old Legacy Keys (Optional)

Once you've tested and confirmed the new key works:

1. Go back to Supabase Dashboard
2. Click the **[Legacy API Keys]** tab
3. Toggle **"Disable legacy API keys"** to OFF position
4. Your old exposed JWT keys are now useless! 🎉

---

## 📝 What If I Only See "Legacy API Keys" Tab?

If you **ONLY** see the "Legacy API Keys" tab and don't see "Publishable Key" or "Secret Keys" tabs, you have two options:

### Option 1: Your Project Needs to Opt-In

Look for a banner or button that says:
- "Opt in to new API keys"
- "Try the new API key system"
- "Upgrade to new keys"

Click it to enable the new key system for your project.

### Option 2: Create a New Supabase Project (If Needed)

If your project is very old and doesn't support the new key system:
1. All projects created after November 2025 automatically use new keys
2. You may need to contact Supabase support to enable the feature

---

## 🔍 How to Tell Keys Apart

| Key Type | Starts With | Length | Example |
|----------|-------------|--------|---------|
| **Legacy JWT (OLD)** | `eyJ` | ~200 chars | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3...` |
| **Publishable (NEW)** | `sb_publishable_` | ~50 chars | `sb_publishable_aBcDeFgHiJkLmNoPqRsTuVwXyZ123` |
| **Secret (NEW)** | `sb_secret_` | ~50 chars | `sb_secret_xYzAbCdEfGhIjKlMnOpQrStUvWxYz987` |

---

## ✅ Success Checklist

- [ ] Opened Supabase Dashboard → Settings → API Keys
- [ ] Found the "Publishable Key" tab (or clicked "Create new API Keys")
- [ ] Copied the key starting with `sb_publishable_`
- [ ] Updated `.env` file with new key
- [ ] Tested locally (http://localhost:8000)
- [ ] Confirmed "Supabase client initialized successfully" in console
- [ ] Tested login/signup functionality
- [ ] (Optional) Disabled legacy API keys

---

## 🆘 Still Can't Find It?

**Screenshot your dashboard** showing what tabs you see and what the page looks like. The key locations might vary slightly depending on your Supabase project version.

**Need more details?** See [SUPABASE_NEW_API_KEYS_2025.md](SUPABASE_NEW_API_KEYS_2025.md) for comprehensive documentation.

---

## 💡 Key Takeaway

**Old System (2024 and earlier):**
- Tab called "API" or "Project API keys"
- Shows `anon` key (JWT format, starts with `eyJ`)
- Click "Generate new JWT Secret" to rotate

**New System (2025+):**
- Tab called "Publishable Key"
- Shows `sb_publishable_...` key
- Click "Create new API Keys" to generate
- Much easier to manage and rotate!

You want the **new system** - it's more secure and easier to use!
