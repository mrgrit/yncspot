import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    // 데모 환경: 콘솔에만 기록
    console.error("[ErrorBoundary]", error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-warning">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">
              화면을 표시하는 중 오류가 발생했습니다
            </p>
            <p className="mt-1 max-w-md text-sm text-slate-500">
              {this.state.error.message}
            </p>
          </div>
          <Button onClick={() => this.setState({ error: null })}>다시 시도</Button>
        </div>
      );
    }
    return this.props.children;
  }
}
