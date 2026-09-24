import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function PageHeader({ title, subtitle, crumbs = [] }) {
  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-[22px] font-bold tracking-tight text-[#101828] sm:text-[26px]">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-[#667085]">{subtitle}</p> : null}
      </div>
      {crumbs.length ? (
        <nav aria-label="Breadcrumb" className="hidden items-center gap-1 text-xs text-[#98a2b3] lg:flex">
          {crumbs.map((crumb, index) => (
            <span key={crumb.label} className="flex items-center gap-1">
              {index > 0 ? <ChevronRight size={12} /> : null}
              {crumb.to ? (
                <Link to={crumb.to} className="hover:text-[#e10600]">
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-medium text-[#475467]">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
