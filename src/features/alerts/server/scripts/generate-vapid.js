#!/usr/bin/env node
/**
 * Generate VAPID Keys for Web Push
 *
 * Run once:
 *   node scripts/generate-vapid.js
 *
 * Copy the output into your .env file.
 *
 * IMPORTANT:
 *  - VAPID_PRIVATE_KEY must NEVER be committed to source control.
 *  - VAPID_PRIVATE_KEY must NEVER be sent to the browser.
 *  - Only VAPID_PUBLIC_KEY is safe to share with the browser (via /api/push/vapid-public-key).
 *  - Generate keys ONCE and reuse them. Changing keys invalidates all existing subscriptions.
 */

import webpush from 'web-push';

const keys = webpush.generateVAPIDKeys();

console.log('\n✅ VAPID Keys generated successfully\n');
console.log('Add these to your .env file:\n');
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log('\n⚠️  Keep VAPID_PRIVATE_KEY secret. Never commit it or send it to the browser.\n');
console.log('After adding to .env, restart the server and test push with:');
console.log('  curl http://localhost:3001/api/push/vapid-public-key\n');
