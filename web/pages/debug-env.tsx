import { useEffect, useState } from 'react';
import Head from 'next/head';

export default function DebugEnvPage() {
  const [envVars, setEnvVars] = useState<Record<string, string>>({});

  useEffect(() => {
    // Get all NEXT_PUBLIC_ environment variables
    const vars: Record<string, string> = {};
    
    // Check the specific variable we care about
    vars['NEXT_PUBLIC_API_BASE'] = process.env.NEXT_PUBLIC_API_BASE || 'NOT SET';
    vars['NEXT_PUBLIC_API_URL'] = process.env.NEXT_PUBLIC_API_URL || 'NOT SET';
    vars['NEXT_PUBLIC_APP_URL'] = process.env.NEXT_PUBLIC_APP_URL || 'NOT SET';
    
    setEnvVars(vars);
  }, []);

  const testConnection = async () => {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'https://api.carryofy.com/api/v1';
    try {
      const response = await fetch(`${apiBase.replace('/api/v1', '')}/health`);
      return { success: true, status: response.status };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  return (
    <>
      <Head>
        <title>Environment Variables Debug - Carryofy</title>
      </Head>
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-6">Environment Variables Debug</h1>
          
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Current Environment Variables</h2>
            <div className="space-y-2">
              {Object.entries(envVars).map(([key, value]) => (
                <div key={key} className="flex items-start gap-4">
                  <span className="text-gray-400 font-mono text-sm w-64">{key}:</span>
                  <span className={`font-mono text-sm ${value.includes('localhost') && value.includes('https') ? 'text-red-400' : value === 'NOT SET' ? 'text-yellow-400' : 'text-green-400'}`}>
                    {value}
                  </span>
                  {value.includes('localhost') && value.includes('https') && (
                    <span className="text-red-400 text-xs">⚠️ Should be http:// not https://</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Troubleshooting Steps</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-300">
              <li className="mb-2">
                <strong className="text-white">Check .env file location:</strong>
                <div className="ml-6 mt-1 font-mono text-sm text-gray-400">
                  File should be at: CF/web/.env
                </div>
              </li>
              <li className="mb-2">
                <strong className="text-white">Verify NEXT_PUBLIC_API_BASE value:</strong>
                <div className="ml-6 mt-1 font-mono text-sm text-gray-400">
                  Should be: NEXT_PUBLIC_API_BASE=http://localhost:3000/api/v1
                </div>
                <div className="ml-6 mt-1 text-red-400 text-sm">
                  ❌ NOT: NEXT_PUBLIC_API_BASE=https://localhost:3000/api/v1
                </div>
              </li>
              <li className="mb-2">
                <strong className="text-white">Restart Next.js dev server:</strong>
                <div className="ml-6 mt-1 font-mono text-sm text-gray-400">
                  Stop the server (Ctrl+C) and restart: npm run dev
                </div>
                <div className="ml-6 mt-1 text-yellow-400 text-sm">
                  ⚠️ Environment variables are only loaded when Next.js starts!
                </div>
              </li>
              <li className="mb-2">
                <strong className="text-white">Check browser console:</strong>
                <div className="ml-6 mt-1 text-gray-400 text-sm">
                  Open browser DevTools (F12) and look for: "🔗 API Base URL: ..."
                </div>
              </li>
              <li className="mb-2">
                <strong className="text-white">Verify backend is running:</strong>
                <div className="ml-6 mt-1 font-mono text-sm text-gray-400">
                  Backend should be running on: http://localhost:3000
                </div>
                <div className="ml-6 mt-1 text-gray-400 text-sm">
                  Test: Open http://localhost:3000/api/v1/health in browser
                </div>
              </li>
            </ol>
          </div>

          <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-blue-400 mb-4">Quick Fix</h2>
            <div className="text-gray-300 space-y-2">
              <p>1. Open <code className="bg-gray-800 px-2 py-1 rounded">CF/web/.env</code></p>
              <p>2. Make sure you have this line:</p>
              <pre className="bg-gray-900 p-4 rounded mt-2 text-green-400">
{`NEXT_PUBLIC_API_BASE=http://localhost:3000/api/v1`}
              </pre>
              <p className="text-red-400 mt-4">❌ NOT: <code>https://localhost:3000/api/v1</code></p>
              <p className="mt-4">3. Save the file</p>
              <p>4. <strong className="text-yellow-400">Restart your Next.js dev server</strong></p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
