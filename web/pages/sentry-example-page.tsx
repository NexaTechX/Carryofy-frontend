import Head from "next/head";

function triggerTestError() {
  // Intentional undefined function call for Sentry verification.
  (window as any).myUndefinedFunction();
}

export default function SentryExamplePage() {
  return (
    <>
      <Head>
        <title>Sentry Example Page</title>
      </Head>
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "1rem",
          padding: "2rem",
        }}
      >
        <h1>Sentry Test Page</h1>
        <p>Click the button to trigger a sample client-side error.</p>
        <button
          onClick={triggerTestError}
          style={{
            backgroundColor: "#111827",
            color: "#fff",
            border: "none",
            borderRadius: "0.5rem",
            padding: "0.75rem 1.25rem",
            cursor: "pointer",
          }}
        >
          Break the world
        </button>
      </main>
    </>
  );
}
