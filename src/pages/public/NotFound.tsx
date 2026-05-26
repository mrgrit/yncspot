import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
        <Compass className="h-8 w-8" />
      </div>
      <div>
        <p className="text-3xl font-bold text-slate-900">404</p>
        <p className="mt-1 text-sm text-slate-500">요청하신 페이지를 찾을 수 없습니다.</p>
      </div>
      <Link to="/">
        <Button>홈으로</Button>
      </Link>
    </div>
  );
}
