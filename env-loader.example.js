// Environment loader for development without build tools
//
// SETUP INSTRUCTIONS:
// 1. Copy this file to env-loader.js
// 2. Update the values with your actual credentials from .env
// 3. NEVER commit env-loader.js to git (it's in .gitignore)

window.ENV = {
    VITE_SUPABASE_URL: 'https://your-project-id.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'sb_publishable_your-key-here',
    VITE_ENVIRONMENT: 'development',
    VITE_ALPHA_LOGIN_ONLY: 'true',
    VITE_AUTO_COMPLETE_ON_LOAD: 'false'
};

console.log('✓ Environment variables loaded from env-loader.js');
console.log('  - Supabase URL:', window.ENV.VITE_SUPABASE_URL ? '✓ Set' : '✗ Missing');
console.log('  - Supabase Key:', window.ENV.VITE_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing');
