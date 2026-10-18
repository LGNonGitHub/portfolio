'use client';

/**
 * Last-resort boundary for failures in the root layout itself, where
 * error.tsx cannot help because the layout it renders inside is what broke.
 * It replaces <html>, so it carries its own minimal styling.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en" data-theme="dark">
      <body
        style={{
          margin: 0,
          minHeight: '100svh',
          display: 'grid',
          placeItems: 'center',
          background: '#08060e',
          color: '#ece9f5',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
          padding: 20,
        }}
      >
        <div>
          <p style={{ fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.6 }}>
            The spell misfired
          </p>
          <h1 style={{ fontSize: 40, margin: '16px 0' }}>Something broke mid-cast.</h1>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 16,
              padding: '12px 24px',
              borderRadius: 999,
              border: 0,
              background: '#ece9f5',
              color: '#08060e',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >Recast</button>
        </div>
      </body>
    </html>
  );
}
