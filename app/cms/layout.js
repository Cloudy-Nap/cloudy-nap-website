export default function CmsLayout({ children }) {
  return (
    <div className="relative isolate min-h-screen overflow-x-hidden text-slate-900 antialiased">
      <div className="absolute inset-0 z-0 bg-slate-50" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
        aria-hidden
      >
        <div className="absolute -top-28 -right-24 h-[28rem] w-[28rem] rounded-full bg-linear-to-br from-blue-200/55 via-sky-200/30 to-transparent blur-3xl" />
        <div className="absolute top-[18%] -left-36 h-96 w-96 rounded-full bg-linear-to-tr from-sky-200/50 to-blue-100/10 blur-3xl" />
        <div className="absolute top-[40%] right-[8%] h-72 w-72 rounded-full bg-[radial-gradient(circle_at_40%_40%,rgba(191,219,254,0.5),rgba(255,255,255,0),65%)] blur-2xl" />
        <div className="absolute bottom-16 right-[20%] h-80 w-80 rounded-full bg-linear-to-tl from-indigo-200/40 via-blue-200/20 to-transparent blur-3xl" />
        <div className="absolute bottom-32 left-8 h-56 w-56 rounded-full bg-linear-to-b from-blue-300/30 to-transparent blur-3xl" />
        <div className="absolute top-1/2 left-1/3 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(186,230,253,0.4),rgba(255,255,255,0),70%)] blur-3xl" />
      </div>
      <div className="relative z-[2] min-h-screen">{children}</div>
    </div>
  );
}
