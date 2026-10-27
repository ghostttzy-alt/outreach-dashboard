export default function HqLayout({ children }: { children: React.ReactNode }) {
  return <div className="hq-theme -mx-4 -my-6 min-h-[calc(100dvh-3.5rem)] px-4 py-6 sm:-mx-6 sm:-my-8 sm:px-6 sm:py-8">{children}</div>;
}
