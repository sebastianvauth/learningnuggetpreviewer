// Configuration loader
// This file loads environment variables at build time or runtime

/**
 * Get environment variable with fallback
 * Supports Vite (import.meta.env), runtime injection (window.ENV), and hardcoded fallbacks
 */
function getEnvVar(key, fallback = '') {
    // Try Vite environment variables first (build time)
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
        return import.meta.env[key];
    }

    // Try window environment variables (runtime injection)
    if (typeof window !== 'undefined' && window.ENV && window.ENV[key]) {
        return window.ENV[key];
    }

    // Development fallback - use provided fallback value
    if (fallback) {
        console.warn(`Environment variable ${key} not found, using fallback. In production, set this via build process.`);
        return fallback;
    }

    throw new Error(`Missing required environment variable: ${key}. Please set up your .env file or use a build tool like Vite.`);
}

// Export configuration object
export const config = {
    supabase: {
        // IMPORTANT: In development without a build tool, you need to manually set these
        // Option 1: Use window.ENV (see index.html for example)
        // Option 2: Use a build tool like Vite to inject from .env file
        url: getEnvVar('VITE_SUPABASE_URL', 'https://hvfbibsjabcuqjmrdmtd.supabase.co'),
        anonKey: getEnvVar('VITE_SUPABASE_ANON_KEY', 'sb_publishable_A7gRfKBZZt0k_GPuLVWa_A_SwvWuq5b')
    },

    features: {
        alphaLoginOnly: getEnvVar('VITE_ALPHA_LOGIN_ONLY', 'true') === 'true', // Login required
        autoCompleteOnLoad: getEnvVar('VITE_AUTO_COMPLETE_ON_LOAD', 'false') === 'true'
    },

    environment: getEnvVar('VITE_ENVIRONMENT', 'development'),

    // Helper to check if we're in development
    isDev() {
        return this.environment === 'development';
    },

    // Helper to check if we're in production
    isProd() {
        return this.environment === 'production';
    }
};

// Validate required configuration
export function validateConfig() {
    const required = [
        'supabase.url',
        'supabase.anonKey'
    ];

    const missing = [];

    required.forEach(path => {
        const parts = path.split('.');
        let value = config;

        for (const part of parts) {
            value = value?.[part];
        }

        if (!value) {
            missing.push(path);
        }
    });

    if (missing.length > 0) {
        throw new Error(
            `Missing required configuration: ${missing.join(', ')}\n` +
            'Please check your .env file or environment variables.'
        );
    }

    return true;
}

// Log configuration status (without exposing secrets)
if (config.isDev()) {
    console.log('Configuration loaded:', {
        supabaseUrl: config.supabase.url ? '✓ Set' : '✗ Missing',
        supabaseKey: config.supabase.anonKey ? '✓ Set' : '✗ Missing',
        environment: config.environment,
        features: config.features
    });
}
