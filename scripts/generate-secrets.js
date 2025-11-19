#!/usr/bin/env node

/**
 * Generate secrets for deployment
 * Run: node scripts/generate-secrets.js
 */

const crypto = require('crypto');

console.log('\n🔐 Generating Secrets for Lodgex CRM Deployment\n');
console.log('=' .repeat(60));

// JWT Secret (32+ characters)
const jwtSecret = crypto.randomBytes(32).toString('hex');
console.log('\n📝 JWT_SECRET (32+ characters):');
console.log(jwtSecret);

// JWT Refresh Secret (32+ characters)
const jwtRefreshSecret = crypto.randomBytes(32).toString('hex');
console.log('\n📝 JWT_REFRESH_SECRET (32+ characters):');
console.log(jwtRefreshSecret);

// Encryption Key (exactly 32 characters)
const encryptionKey = crypto.randomBytes(16).toString('hex');
console.log('\n📝 ENCRYPTION_KEY (exactly 32 characters):');
console.log(encryptionKey);

console.log('\n' + '='.repeat(60));
console.log('\n✅ Copy these values to Vercel Environment Variables');
console.log('\n⚠️  IMPORTANT: Save these secrets securely!');
console.log('   You will need them for future deployments.\n');

