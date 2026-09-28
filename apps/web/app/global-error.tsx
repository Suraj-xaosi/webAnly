"use client"

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: 24,
            background: "#f8fafc",
            color: "#172033",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <section
            role="alert"
            style={{
              width: "min(100%, 480px)",
              padding: 24,
              border: "1px solid #d7dde7",
              borderRadius: 8,
              background: "white",
            }}
          >
            <h1 style={{ margin: "0 0 12px", fontSize: 22 }}>
              The application encountered an error
            </h1>
            <p
              style={{ margin: "0 0 20px", color: "#526078", lineHeight: 1.5 }}
            >
              Reload this page content and try again.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                padding: "9px 14px",
                border: 0,
                borderRadius: 6,
                background: "#172033",
                color: "white",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </section>
        </main>
      </body>
    </html>
  )
}
