import { useThemeDark } from "@/components/common/ThemeToggle";

const LIGHT_LOGO = "/Glossy%20ADD%20FLIX%203D%20Logo.png";
const DARK_LOGO = "/Glossy%20Add%20Flix%203D%20Logo%20Banner.png";

export default function Logo({ light = true, compact = false, className = "" }) {
  const dark = useThemeDark();
  const src = light || dark ? DARK_LOGO : LIGHT_LOGO;
  const size = className || (compact ? "h-10" : "h-16");
  return (
    <span className="inline-flex max-w-full items-center justify-center">
      <img
        src={src}
        alt="ADD FLIX"
        className={`${size} w-auto max-w-full object-contain`}
      />
    </span>
  );
}

export function BrandLockup({ caption = "" }) {
  return (
    <div className="relative px-4 pb-3 pt-5">
      <div aria-hidden className="pointer-events-none absolute left-2 top-2 h-16 w-36 rounded-full bg-[#e10600]/30 blur-2xl" />
      <Logo className="relative h-[4.25rem]" />
      {caption ? (
        <p className="relative mt-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">{caption}</p>
      ) : null}
    </div>
  );
}
