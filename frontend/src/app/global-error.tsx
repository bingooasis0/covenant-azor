// frontend/src/app/global-error.tsx
"use client";
export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body>
        <div className="p-6 max-w-xl mx-auto">
          <h1 className="text-xl font-semibold text-rose-700">Application error</h1>
          <pre className="mt-3 text-xs bg-rose-50 p-3 rounded">{error?.message}</pre>
          <button className="mt-4 inline-flex px-3 py-2 rounded bg-sky-500 text-white" onClick={reset}>Reload</button>
        </div>
      </body>
    </html>
  );
}
