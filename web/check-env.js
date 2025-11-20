// Diagnostic script to check environment variables
console.log('\n========================================');
console.log('🔍 Environment Variables Diagnostic');
console.log('========================================\n');

const requiredVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
];

console.log('Checking Firebase environment variables:\n');

requiredVars.forEach((varName) => {
    const value = process.env[varName];
    const status = value ? '✅ SET' : '❌ MISSING';
    const preview = value ? `${value.substring(0, 20)}...` : 'undefined';
    console.log(`${status} ${varName}`);
    console.log(`  Value: ${preview}\n`);
});

console.log('\n========================================');
console.log('All environment variables starting with NEXT_PUBLIC_:');
console.log('========================================\n');

Object.keys(process.env)
    .filter((key) => key.startsWith('NEXT_PUBLIC_'))
    .forEach((key) => {
        const value = process.env[key] || '';
        console.log(`${key}: ${value.substring(0, 30)}...`);
    });

console.log('\n========================================\n');
