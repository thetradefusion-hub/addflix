import { Inbox } from "lucide-react";

export default function EmptyState({ title = "Nothing here yet", body = "Try a different filter or check back later." }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
        <Inbox size={22} />
      </div>
      <p className="font-semibold text-[#101828]">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-[#667085]">{body}</p>
    </div>
  );
}

export function LoadingState({ label = "Loading" }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-[#667085]" role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-200 border-t-[#e10600]" />
      {label}
    </div>
  );
}
