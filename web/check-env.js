// Diagnostic script to check environment variables
console.log('\n========================================');
console.log('🔍 Environment Variables Diagnostic');
console.log('========================================\n');

const requiredVars = [
    'NEXT_PUBLIC_API_BASE',
];

console.log('Checking required environment variables:\n');

requiredVars.forEach((varName) => {
    const value = process.env[varName];
    const status = value ? '✅ SET' : '❌ MISSING';
    const preview = value ? `${value.substring(0, 50)}...` : 'undefined';
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
