import { Component, StrictMode, type ReactNode, type ErrorInfo } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// ── Error boundary: surfaces crashes on-screen instead of blank page ──
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App crashed:", error, info);
  }
  render() {
    if (this.state.error) {
      const err = this.state.error as Error;
      return (
        <div style={{ fontFamily: "monospace", padding: 32, background: "#0f172a", color: "#f8fafc", minHeight: "100vh" }}>
          <h1 style={{ color: "#f87171", marginBottom: 16 }}>⚠️ Application Error</h1>
          <p style={{ color: "#94a3b8", marginBottom: 8 }}>The app crashed on startup. Error details:</p>
          <pre style={{ background: "#1e293b", padding: 16, borderRadius: 8, color: "#fbbf24", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
            {err.message}
            {"\n\n"}
            {err.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
