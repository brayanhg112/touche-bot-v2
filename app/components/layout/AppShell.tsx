'use client';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-[#050505] text-white font-body selection:bg-primary selection:text-white w-full overflow-x-hidden">
      {children}
    </div>
  );
}
