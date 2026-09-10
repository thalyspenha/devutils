import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Quando muda, reseta o boundary (ex.: a rota atual). */
  resetKey?: string;
}

interface State {
  error: Error | null;
}

/**
 * Envolve as rotas: se uma ferramenta lançar durante o render, mostra uma tela
 * de recuperação em vez de apagar o app inteiro (tela branca). Reseta sozinho
 * ao trocar de rota e tem botão de "tentar de novo".
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary capturou um erro na ferramenta:', error, info.componentStack);
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error-boundary">
          <AlertTriangle size={40} className="error-boundary-icon" />
          <h2>Essa ferramenta quebrou</h2>
          <p>
            Ocorreu um erro inesperado ao renderizar esta ferramenta. As outras continuam
            funcionando normalmente.
          </p>
          <pre className="error-boundary-detail">{this.state.error.message}</pre>
          <button onClick={() => this.setState({ error: null })}>Tentar de novo</button>
        </div>
      );
    }
    return this.props.children;
  }
}
