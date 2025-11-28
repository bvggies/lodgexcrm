/**
 * Environment variable validation
 * Validates required environment variables at startup
 */

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
];

const optionalEnvVars = [
  'PORT',
  'NODE_ENV',
  'CORS_ORIGIN',
  'ENCRYPTION_KEY',
  'REDIS_URL',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_REGION',
  'AWS_BUCKET',
  'S3_ENDPOINT',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER',
  'TWILIO_API_KEY',
  'TWILIO_API_SECRET',
  'TWILIO_TWIML_APP_SID',
  'API_URL',
];

export function validateEnv(): void {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  requiredEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  // Check encryption key length if provided
  if (process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length !== 32) {
    warnings.push('ENCRYPTION_KEY should be exactly 32 characters for AES-256-CBC');
  }

  // Check JWT secrets strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    warnings.push('JWT_SECRET should be at least 32 characters for security');
  }

  if (process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET.length < 32) {
    warnings.push('JWT_REFRESH_SECRET should be at least 32 characters for security');
  }

  // Throw error if required vars are missing
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }

  // Log warnings
  if (warnings.length > 0) {
    console.warn('⚠️  Environment variable warnings:');
    warnings.forEach((warning) => console.warn(`   - ${warning}`));
  }

  // Log success
  if (process.env.NODE_ENV !== 'test') {
    console.log('✅ Environment variables validated successfully');
  }
}

export function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${name} is not set and no default value provided`);
  }
  return value || defaultValue!;
}

