/**
 * Validates that all required environment variables are set on application
 * startup. Throws an error with a summary of any missing variables so the
 * process exits immediately rather than failing at runtime.
 */
export function validateEnv(): void {
  const requiredVars: string[] = ['DATABASE_URL', 'JWT_SECRET'];

  const missing: string[] = requiredVars.filter(
    (varName) => !process.env[varName] || process.env[varName]!.trim() === '',
  );

  if (missing.length > 0) {
    const message = [
      '',
      '========================================',
      ' MISSING ENVIRONMENT VARIABLES',
      '========================================',
      '',
      ...missing.map((v) => `  - ${v}`),
      '',
      'Please set these variables in your .env file or environment.',
      'See .env.example for reference.',
      '========================================',
      '',
    ].join('\n');

    throw new Error(message);
  }

  // Optional: warn about variables that should be changed from defaults
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.JWT_SECRET === 'your-super-secret-jwt-key-change-in-production'
  ) {
    console.warn(
      '[WARNING] JWT_SECRET is set to the default placeholder value. ' +
        'This is insecure for production use. Please set a strong random secret.',
    );
  }
}
