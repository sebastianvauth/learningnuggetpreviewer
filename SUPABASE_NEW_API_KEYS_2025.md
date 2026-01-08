# 🔑 Supabase New API Keys (2025 System)

## ⚠️ Important: Supabase Changed Their Entire Key System

Supabase migrated from **legacy JWT-based keys** (`anon`, `service_role`) to a **new API key system** (`sb_publishable_...`, `sb_secret_...`) starting in 2025.

---

## 📊 What Changed?

### Old System (Legacy - Being Deprecated)
- **anon key**: JWT token with 10-year expiration, used for client-side
- **service_role key**: JWT token with full privileges
- **Problem**: Couldn't rotate keys without downtime; long expiration = security risk

### New System (Current - Recommended)
- **Publishable Key** (`sb_publishable_...`): Replaces `anon` key
- **Secret Key** (`sb_secret_...`): Replaces `service_role` key
- **Benefits**:
  - Easy rotation without downtime
  - Better security (can create multiple keys, revoke individually)
  - Clearer separation between client/server usage

---

## 🗓️ Timeline

| Date | What Happens |
|------|--------------|
| **June 2025** | New key system early preview launched |
| **July 2025** | Full feature release; legacy keys still work |
| **November 2025** | New projects won't get legacy keys; monthly migration reminders |
| **Late 2026** | **DEADLINE**: Legacy keys deleted; apps break if not migrated |

**Current Date**: January 2026 - You have until late 2026 to migrate!

---

## 🔍 Finding Your Keys in Dashboard

### For New Projects (After November 2025)
1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api-keys
2. You'll see:
   - **Publishable Key** tab (default)
   - **Secret Keys** tab
   - **Legacy API Keys** tab (if your project was created before November 2025)

### For Existing Projects (Created Before November 2025)
1. Same URL as above
2. You'll see all three tabs:
   - **Legacy API Keys**: Your old `anon` and `service_role` keys (still work)
   - **Publishable Key**: Click "Create new API Keys" if not generated yet
   - **Secret Keys**: Manage backend API keys

---

## 🚀 How to Migrate (Step-by-Step)

### Step 1: Generate New Keys

1. **Go to Dashboard**:
   ```
   https://supabase.com/dashboard/project/hvfbibsjabcuqjmrdmtd/settings/api-keys
   ```

2. **Check if you have new keys**:
   - Look for **"Publishable Key"** tab
   - If you see a key starting with `sb_publishable_...`, you already have one!
   - If not, click **"Create new API Keys"**

3. **Copy your Publishable Key**:
   ```
   sb_publishable_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### Step 2: Update Your .env File

Replace the old `VITE_SUPABASE_ANON_KEY` with the new publishable key:

**Old (.env before migration):**
```bash
VITE_SUPABASE_URL=https://hvfbibsjabcuqjmrdmtd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...  # Old JWT token
```

**New (.env after migration):**
```bash
VITE_SUPABASE_URL=https://hvfbibsjabcuqjmrdmtd.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Note**: We're keeping the variable name `VITE_SUPABASE_ANON_KEY` for backward compatibility, but it now contains the publishable key.

### Step 3: Test Locally

```bash
# Start local server
npx http-server -p 8000

# Open http://localhost:8000
# Check browser console for "Supabase client initialized successfully"
# Try signing in/signing up
```

### Step 4: Disable Legacy Keys (Optional - After Testing)

Once you confirm the new key works:

1. Go to Dashboard → Settings → API Keys → **Legacy API Keys** tab
2. Toggle **"Disable legacy API keys"**
3. Your old `anon` and `service_role` keys will stop working
4. Monitor for any errors; you can re-enable if needed

### Step 5: Update Production (GitHub Secrets)

If using GitHub Actions:

1. Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions
2. Update `VITE_SUPABASE_ANON_KEY` secret with the new publishable key
3. Redeploy your application

---

## 🔐 Security: What to Do About Exposed Keys

### If Your Legacy Keys Were Exposed (Your Case)

**Good News**: Legacy keys will be deprecated by late 2026 anyway, so:

**Option A: Migrate to New Keys (Recommended)**
1. Generate new publishable key (as shown above)
2. Update your `.env` file
3. Test thoroughly
4. Disable legacy keys in dashboard
5. Commit the security fix (config files, not the .env)
6. The exposed legacy keys will automatically become useless when you disable them

**Option B: Rotate Legacy Keys (Old Method - Not Recommended)**
1. Dashboard → Settings → API → Generate new JWT secret
2. **WARNING**: This invalidates ALL current keys immediately (downtime!)
3. All users get logged out
4. Not recommended; just migrate to new keys instead

**We Recommend Option A**: Migrate to the new key system, which is more secure and easier to manage.

---

## 📋 Key Comparison

| Feature | Legacy Anon Key | New Publishable Key |
|---------|-----------------|---------------------|
| **Format** | `eyJhbGc...` (JWT) | `sb_publishable_...` |
| **Length** | ~200 characters | ~50 characters |
| **Expiration** | 10 years | No expiration (manually revoke) |
| **Rotation** | Requires downtime | Zero-downtime rotation |
| **Multiple Keys** | No (single anon key) | Yes (create multiple) |
| **Revocation** | Rotate entire JWT secret | Revoke individual keys |
| **Usage** | Client-side | Client-side |
| **Privilege Level** | Low (authenticated users) | Low (authenticated users) |

---

## 🛠️ Updated Configuration

Your current setup already supports both old and new keys! No code changes needed.

### config.js (Already Works)
```javascript
// This works with BOTH legacy JWT keys AND new publishable keys
export const config = {
    supabase: {
        url: getEnvVar('VITE_SUPABASE_URL'),
        anonKey: getEnvVar('VITE_SUPABASE_ANON_KEY') // Works with both formats!
    }
};
```

### Supabase Client Initialization (Already Works)
```javascript
// The Supabase client library automatically detects the key format
supabase = window.supabase.createClient(config.supabase.url, config.supabase.anonKey);
```

**No library upgrades needed** - all Supabase client versions support both key formats!

---

## ✅ Migration Checklist

- [ ] Access Supabase Dashboard → Settings → API Keys
- [ ] Check if you have a **Publishable Key** tab
- [ ] If not, click "Create new API Keys"
- [ ] Copy the new `sb_publishable_...` key
- [ ] Update local `.env` file with new key
- [ ] Test locally (auth, database access, progress tracking)
- [ ] Verify browser console shows no errors
- [ ] (Optional) Disable legacy keys in dashboard
- [ ] Update production secrets (GitHub Actions)
- [ ] Monitor application for 24-48 hours
- [ ] Celebrate! Your keys are now more secure 🎉

---

## 🆘 Troubleshooting

### "I don't see a Publishable Key tab"
- Your project might be very old
- Click "Opt in to new API keys" or "Create new API Keys" button
- Contact Supabase support if the option isn't available

### "My app broke after switching keys"
- Check browser console for error messages
- Verify the key starts with `sb_publishable_`
- Make sure you copied the FULL key (they're long!)
- Try re-enabling legacy keys temporarily to diagnose

### "Legacy API keys are disabled" error
- You disabled legacy keys but still have old keys in `.env`
- Update to the new publishable key
- Or re-enable legacy keys temporarily while migrating

### "Edge function environment variables not updated"
- Known Supabase bug (as of Jan 2026)
- Manually update edge function environment variables
- See: https://github.com/supabase/supabase/issues/37648

---

## 📚 Official Documentation

- [Understanding API Keys](https://supabase.com/docs/guides/api/api-keys)
- [Migration Discussion](https://github.com/orgs/supabase/discussions/29260)
- [Rotating Keys Guide](https://supabase.com/docs/guides/troubleshooting/rotating-anon-service-and-jwt-secrets-1Jq6yd)

---

## 🎯 Quick Answer to Your Question

**You asked**: "I can only find a tab for legacy anon keys in the dashboard"

**Answer**:
1. That's the **OLD system** (being deprecated by late 2026)
2. Look for a **"Publishable Key"** tab instead
3. If you don't see it, click **"Create new API Keys"** or **"Opt in to new API keys"**
4. Use the new `sb_publishable_...` key instead of the legacy JWT `anon` key
5. No need to "rotate" the old key - just migrate to the new system and disable legacy keys when ready

**The exposed legacy key is less critical now** because:
- It will be deprecated anyway by late 2026
- You can simply migrate to new keys and disable the old ones
- The new system is much more secure

---

## Sources

- [Understanding API keys | Supabase Docs](https://supabase.com/docs/guides/api/api-keys)
- [Upcoming changes to Supabase API Keys · Discussion #29260](https://github.com/orgs/supabase/discussions/29260)
- [Rotating Anon, Service, and JWT Secrets](https://supabase.com/docs/guides/troubleshooting/rotating-anon-service-and-jwt-secrets-1Jq6yd)
