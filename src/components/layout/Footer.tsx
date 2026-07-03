export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-surface-container-low border-t border-outline-variant py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <div>
          <h3 className="font-headline-md text-primary text-base mb-1">
            Sahabat Misdinar Indonesia
          </h3>
          <p className="font-body-md text-sm text-on-surface-variant">
            Menghubungkan &amp; Menginspirasi Putra-Putri Altar Nusantara.
          </p>
        </div>
        <div className="flex flex-col items-center md:items-end gap-1">
          <p className="font-label-sm text-xs text-on-surface-variant">
            &copy; {currentYear} Sahabat Misdinar Indonesia.
          </p>
          <div className="flex gap-4 mt-2">
            <span className="material-symbols-outlined text-on-surface-variant hover:text-primary cursor-pointer text-lg">
              share
            </span>
            <span className="material-symbols-outlined text-on-surface-variant hover:text-primary cursor-pointer text-lg">
              mail
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
