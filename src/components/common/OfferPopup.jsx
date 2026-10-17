import { useEffect, useState } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "addflix_offer_dismissed";

export default function OfferPopup({ offer }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!offer?.enabled || !offer?.image) {
      setOpen(false);
      return;
    }
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY) || "";
      setOpen(dismissed !== String(offer.key || offer.image));
    } catch {
      setOpen(true);
    }
  }, [offer?.enabled, offer?.image, offer?.key]);

  const close = () => {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, String(offer.key || offer.image || ""));
    } catch {
      /* ignore */
    }
  };

  if (!open || !offer?.image) return null;

  const image = (
    <img
      src={offer.image}
      alt="Special offer"
      className="max-h-[min(78vh,640px)] w-full max-w-[min(92vw,420px)] rounded-2xl object-contain shadow-2xl"
    />
  );

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Offer">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close offer" onClick={close} />
      <div className="relative z-10">
        <button
          type="button"
          onClick={close}
          className="absolute -right-2 -top-2 z-20 grid h-9 w-9 place-items-center rounded-full bg-white text-[#111827] shadow-lg hover:bg-slate-100"
          aria-label="Close"
        >
          <X size={18} />
        </button>
        {offer.link ? (
          <a href={offer.link} target="_blank" rel="noopener noreferrer" className="block" onClick={close}>
            {image}
          </a>
        ) : (
          image
        )}
      </div>
    </div>
  );
}
