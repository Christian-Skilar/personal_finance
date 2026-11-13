import { Component, type ReactNode } from 'react'

interface State {
  failed: boolean
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.error(error)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="main" role="alert">
        <h1 className="h1">Noe gikk galt</h1>
        <p className="lbl">Dataene dine er ikke påvirket.</p>
        <button className="btn" onClick={() => window.location.reload()}>
          Last inn på nytt
        </button>
      </div>
    )
  }
}
