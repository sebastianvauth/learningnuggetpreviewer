// Configuration loader
// This file loads environment variables at build time or runtime

/**
 * Get environment variable with fallback
 * Supports both Vite (import.meta.env) and plain environments
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

    // Development fallback (only in dev mode)
    if (fallback && (!import.meta.env || import.meta.env.DEV)) {
        console.warn(`Environment variable ${key} not found, using fallback`);
        return fallback;
    }

    throw new Error(`Missing required environment variable: ${key}`);
}

// Export configuration object
export const config = {
    supabase: {
        url: getEnvVar('VITE_SUPABASE_URL'),
        anonKey: getEnvVar('VITE_SUPABASE_ANON_KEY')
    },

    features: {
        alphaLoginOnly: getEnvVar('VITE_ALPHA_LOGIN_ONLY', 'true') === 'true',
        autoCompleteOnLoad: getEnvVar('VITE_AUTO_COMPLETE_ON_LOAD', 'false') === 'true'
    },

    environment: getEnvVar('VITE_ENVIRONMENT', 'production'),

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
