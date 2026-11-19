import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Melophile component tree:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen bg-[#080808] text-white flex flex-col items-center justify-center p-6 text-center select-none font-sans">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 flex items-center justify-center shadow-[0_0_25px_rgba(250,204,21,0.5)] mb-4">
            <span className="font-display font-black text-black text-2xl tracking-tighter">M</span>
          </div>
          <h1 className="text-xl font-black text-white tracking-tight mb-2">Something interrupted Melophile</h1>
          <p className="text-xs text-white/60 max-w-sm mb-6 leading-relaxed">
            {this.state.error?.message || 'A visual render glitch occurred. Clearing cached local state and reloading.'}
          </p>
          <button
            onClick={() => {
              try {
                localStorage.clear();
              } catch {}
              window.location.reload();
            }}
            className="px-6 py-2.5 rounded-full bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold text-xs tracking-wider uppercase shadow-[0_0_15px_rgba(250,204,21,0.4)] cursor-pointer active:scale-95 transition-all"
          >
            Reset & Reload Melophile
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
