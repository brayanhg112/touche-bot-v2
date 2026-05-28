import Bot from '../components/Bot';
import Header from '../components/layout/Header';
import BottomNav from '../components/layout/BottomNav';

export default function Home() {
  return (
    <>
      <Header />
      
      {/* Background Monogram Watermark */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20vw] font-headline text-primary opacity-[0.03] pointer-events-none select-none z-0">
        TE
      </div>

      {/* Main Bot Container */}
      <main className="pt-24 pb-32 min-h-screen flex flex-col max-w-2xl mx-auto px-4 relative z-10">
        <div className="mb-4 mt-2 text-center">
          <h2 className="text-3xl font-headline font-bold text-primary mb-1">Sommelier Digital</h2>
          <p className="text-[10px] font-body text-on-surface/60 tracking-[0.2em] uppercase">Encuentra tu esencia perfecta</p>
        </div>
        
        <Bot />
      </main>

      <BottomNav />
    </>
  );
}
