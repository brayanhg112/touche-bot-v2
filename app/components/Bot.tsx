'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatBubble from './ui/ChatBubble';
import QuestionCard from './QuestionCard';
import PerfumeCard from './PerfumeCard';
import WhatsAppCTA from './WhatsAppCTA';
import { recommend, type ScoredPerfume } from '../lib/recommender';
import type { Gender, Occasion, Feel, BotAnswers } from '../lib/types';

type Step = 'greeting' | 'name' | 'gender' | 'reference' | 'occasion' | 'feel' | 'avoid' | 'results';

interface Message {
  id: string;
  role: 'bot' | 'user';
  text: string;
}

const occasionOptions = [
  { value: 'diario', label: 'Día a día', emoji: '☀️' },
  { value: 'trabajo', label: 'Trabajo / oficina', emoji: '💼' },
  { value: 'cita', label: 'Cita romántica', emoji: '🌹' },
  { value: 'noche', label: 'Salida nocturna', emoji: '🌙' },
  { value: 'evento', label: 'Evento especial', emoji: '✨' },
  { value: 'verano', label: 'Playa / verano', emoji: '🌊' },
  { value: 'invierno', label: 'Temporada fría', emoji: '❄️' },
];

const feelOptions = [
  { value: 'fresco', label: 'Fresco & limpio', emoji: '🍃' },
  { value: 'dulce', label: 'Dulce & gourmand', emoji: '🍯' },
  { value: 'floral', label: 'Floral', emoji: '🌸' },
  { value: 'amaderado', label: 'Amaderado', emoji: '🪵' },
  { value: 'especiado', label: 'Especiado', emoji: '🌶️' },
  { value: 'citrico', label: 'Cítrico', emoji: '🍋' },
  { value: 'frutal', label: 'Frutal', emoji: '🍓' },
  { value: 'oud', label: 'Oud / oriental', emoji: '🕌' },
  { value: 'acuatico', label: 'Acuático', emoji: '🌊' },
  { value: 'gourmand', label: 'Gourmand / comida', emoji: '🍫' },
];

const avoidOptions = [
  { value: 'oud', label: 'Oud muy intenso', emoji: '🚫' },
  { value: 'dulce-intenso', label: 'Demasiado dulce', emoji: '🚫' },
  { value: 'especias', label: 'Especias fuertes', emoji: '🚫' },
  { value: 'pesado', label: 'Muy pesado', emoji: '🚫' },
  { value: 'vetiver', label: 'Vetiver / tierra', emoji: '🚫' },
  { value: 'polvo', label: 'Empolvado / retro', emoji: '🚫' },
  { value: 'cuero', label: 'Cuero', emoji: '🚫' },
];

function uid() { return Math.random().toString(36).slice(2); }

export default function Bot() {
  const [step, setStep] = useState<Step>('greeting');
  const [messages, setMessages] = useState<Message[]>([]);
  const [nameInput, setNameInput] = useState('');
  const [answers, setAnswers] = useState<BotAnswers>({ name: '', gender: '', occasion: '', projection: '', feel: [], avoid: [] });
  const [tempFeel, setTempFeel] = useState<Feel[]>([]);
  const [tempAvoid, setTempAvoid] = useState<string[]>([]);
  const [referenceInput, setReferenceInput] = useState('');
  const [top3, setTop3] = useState<ScoredPerfume[]>([]);
  const [stockMap, setStockMap] = useState<Record<string, boolean> | undefined>(undefined);

  const bottomRef = useRef<HTMLDivElement>(null);

  const addBot = (text: string) =>
    setMessages((m) => [...m, { id: uid(), role: 'bot', text }]);

  const addUser = (text: string) =>
    setMessages((m) => [...m, { id: uid(), role: 'user', text }]);

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
  }, [messages, step]);

  useEffect(() => {
    fetch('/api/stock')
      .then((res) => res.json())
      .then((data) => {
        if (data.stock) setStockMap(data.stock);
      })
      .catch((err) => console.error('Failed to load live stock', err));
  }, []);

  useEffect(() => {
    addBot('Bienvenido al atelier digital de Touche Essencielle. Soy Aria — su sommelier de fragancias de lujo. 🌹');
    addBot('Cada esencia que selecciono para usted es el resultado de años de estudio olfativo. Para comenzar esta alquimia… ¿con quién tengo el placer de hablar?');
    setStep('name');
  }, []);

  const handleNameSubmit = () => {
    const name = nameInput.trim();
    if (!name) return;
    addUser(name);
    setAnswers((a) => ({ ...a, name }));
    setNameInput('');
    addBot(`Encantada, ${name}. Es un placer recibirte en nuestro atelier. 🌹`);
    addBot('Cuéntame, ¿buscas una fragancia para caballero, para dama, o algo que trascienda las fronteras del género?');
    setStep('gender');
  };

  const handleGender = (g: string) => {
    addUser(g === 'M' ? '♂ Masculino' : '♀ Femenino');
    setAnswers((a) => ({ ...a, gender: g as Gender }));
    addBot(`Perfecto. Una elección con personalidad. ✨ Para afinar mi recomendación, cuéntame: ¿hay algún perfume que hayas usado antes y te encante? (O si prefieres empezar de cero, dale a Omitir)`);
    setStep('reference');
  };

  const handleReferenceSubmit = () => {
    const ref = referenceInput.trim();
    if (!ref) return;
    addUser(ref);
    setAnswers((a) => ({ ...a, referencePerfume: ref }));
    setReferenceInput('');
    addBot(`¡Excelente gusto! Conozco ${ref} muy bien. Lo tendré en cuenta para encontrar tu match ideal. 🎯 ¿Para qué momento de tu vida estamos creando esta firma olfativa?`);
    setStep('occasion');
  };

  const handleReferenceSkip = () => {
    addUser('Omitir — empezar de cero');
    setAnswers((a) => ({ ...a, referencePerfume: undefined }));
    setReferenceInput('');
    addBot(`¡Perfecto! Empezamos desde cero. ✨ ¿Para qué momento de tu vida estamos creando esta firma olfativa?`);
    setStep('occasion');
  };

  const handleOccasion = (occ: string) => {
    const label = occasionOptions.find((o) => o.value === occ)?.label ?? occ;
    addUser(label);
    setAnswers((a) => ({ ...a, occasion: occ as Occasion }));
    addBot(`${label} — una ocasión que merece una fragancia a la altura. 🌟 Ahora dime, ¿qué sensación olfativa te define? Puedes elegir varias.`);
    setStep('feel');
  };

  const handleFeelToggle = (f: string) => {
    setTempFeel((prev) =>
      prev.includes(f as Feel) ? prev.filter((x) => x !== f) : [...prev, f as Feel]
    );
  };

  const handleFeelConfirm = () => {
    const labels = tempFeel.map((f) => feelOptions.find((o) => o.value === f)?.label ?? f);
    addUser(labels.join(', '));
    setAnswers((a) => ({ ...a, feel: tempFeel }));
    addBot(`Comprendo la dirección de tu instinto. 🎯 Por último, ¿hay alguna nota que definitivamente desees omitir en esta composición?`);
    setStep('avoid');
  };

  const handleAvoidToggle = (a: string) => {
    setTempAvoid((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  };

  const handleAvoidConfirm = () => {
    const labels = tempAvoid.length > 0
      ? tempAvoid.map((a) => avoidOptions.find((o) => o.value === a)?.label ?? a).join(', ')
      : 'Ninguna omisión';
    addUser(labels);

    const finalAnswers: BotAnswers = { ...answers, avoid: tempAvoid };
    setAnswers(finalAnswers);

    addBot(`Excelente, ${answers.name || 'mi distinguido cliente'}. Estoy consultando nuestra colección privada… 🔮`);
    const results = recommend(finalAnswers, stockMap);
    setTop3(results);
    const hasNicho = results.some(r => r.isNicho);
    if (hasNicho) {
      addBot(`Has revelado un perfil de sabor excepcional. La alquimia está completa — aquí están las tres joyas olfativas que resuenan con tu firma:`);
    } else {
      addBot(`La alquimia está completa, ${answers.name}. Aquí están las tres esencias perfectas para ti:`);
    }
    setStep('results');
  };

  const handleRestart = () => {
    setMessages([]);
    setStep('greeting');
    setAnswers({ name: '', gender: '', occasion: '', projection: '', feel: [], avoid: [], referencePerfume: undefined });
    setTempFeel([]);
    setTempAvoid([]);
    setTop3([]);
    setNameInput('');
    setReferenceInput('');

    addBot('Bienvenido de nuevo al atelier. 🌸 Soy Aria.');
    addBot('¿Con quién hablo esta vez?');
    setStep('name');
  };

  return (
    <div className="flex-1 flex flex-col relative w-full">
      <div className="flex-1 overflow-y-auto flex flex-col gap-6 custom-scrollbar pb-32 pt-2">
        {messages.map((m) => (
          <ChatBubble key={m.id} role={m.role} text={m.text} />
        ))}

        <AnimatePresence>
          {step === 'gender' && (
            <QuestionCard
              key="gender"
              options={[
                { value: 'M', label: 'Masculino', emoji: '♂' },
                { value: 'F', label: 'Femenino', emoji: '♀' },
              ]}
              selected={answers.gender ? [answers.gender] : []}
              onSelect={handleGender}
            />
          )}

          {step === 'occasion' && (
            <QuestionCard
              key="occasion"
              options={occasionOptions}
              selected={answers.occasion ? [answers.occasion] : []}
              onSelect={handleOccasion}
            />
          )}

          {step === 'feel' && (
            <QuestionCard
              key="feel"
              options={feelOptions}
              selected={tempFeel}
              multi
              onSelect={handleFeelToggle}
              onConfirm={handleFeelConfirm}
            />
          )}

          {step === 'avoid' && (
            <div key="avoid">
              <QuestionCard
                options={avoidOptions}
                selected={tempAvoid}
                multi
                alwaysShowConfirm
                onSelect={handleAvoidToggle}
                onConfirm={handleAvoidConfirm}
              />
            </div>
          )}

          {step === 'results' && top3.length > 0 && (
            <motion.div key="results" className="flex flex-col gap-2 mt-4 w-full max-w-[420px] self-center">
              {top3.map((r, i) => (
                <PerfumeCard key={r.perfume.id} result={r} rank={i + 1} answers={answers} />
              ))}
              
              <div className="mt-4 mb-4">
                <WhatsAppCTA userName={answers.name} top3={top3} />
              </div>

              <div className="flex flex-col items-center mt-6 mb-8 text-center glass-card p-6 rounded-2xl obsidian-glow">
                <p className="font-body text-sm font-semibold mb-4 text-primary">¿Deseas intentar otra combinación?</p>
                <button
                  id="btn-restart"
                  onClick={handleRestart}
                  className="px-6 py-3 rounded-full bg-surface-container hover:bg-primary/10 text-primary text-xs font-bold tracking-widest uppercase transition-colors"
                >
                  Consultar nuevamente
                </button>
              </div>
            </motion.div>
          )}

          {step === 'results' && top3.length === 0 && (
            <motion.div>
              <ChatBubble role="bot" text="No he podido encontrar una fragancia que coincida exactamente con tus solicitudes y que se encuentre disponible ahora mismo. Te invito a intentar otra cata:" />
              <button onClick={handleRestart} className="mt-4 w-full py-4 rounded-full bg-surface-container hover:bg-primary/10 text-primary text-xs font-bold tracking-widest uppercase transition-colors">Empezar de nuevo</button>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} className="h-1" />
      </div>

      {/* ── Reference perfume text input ── */}
      {step === 'reference' && (
        <div className="fixed bottom-[110px] w-full max-w-2xl left-1/2 -translate-x-1/2 px-4 z-40">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative group"
          >
            <input
              id="reference-input"
              className="w-full bg-surface-container-high/90 backdrop-blur-xl border-none focus:outline-none focus:ring-1 focus:ring-primary/50 text-on-surface py-5 px-6 rounded-t-2xl transition-all duration-500 placeholder:text-on-surface/30 font-body text-sm"
              placeholder="Ej: Sauvage, 212 VIP, Libre..."
              value={referenceInput}
              onChange={(e) => setReferenceInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleReferenceSubmit()}
              autoFocus
            />
            <div className="flex gap-2 absolute right-3 top-1/2 -translate-y-1/2">
              <button
                onClick={handleReferenceSkip}
                className="px-4 py-2 rounded-full bg-surface-container text-on-surface/60 text-[11px] font-bold uppercase tracking-wider hover:bg-surface-container-high transition-colors duration-300"
              >
                Omitir
              </button>
              <button
                onClick={handleReferenceSubmit}
                className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center text-[#3c2f00] shadow-lg hover:scale-105 transition-transform duration-300"
              >
                <span className="material-symbols-outlined font-bold text-[18px]">send</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {step === 'name' && (
        <div className="fixed bottom-[110px] w-full max-w-2xl left-1/2 -translate-x-1/2 px-4 z-40">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative group"
          >
            <input
              id="name-input"
              className="w-full bg-surface-container-high/90 backdrop-blur-xl border-none focus:outline-none focus:ring-1 focus:ring-primary/50 text-on-surface py-5 px-6 rounded-t-2xl transition-all duration-500 placeholder:text-on-surface/30 font-body text-sm"
              placeholder="Escribe tu respuesta..."
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
              autoFocus
            />
            <button 
              onClick={handleNameSubmit}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full gold-gradient flex items-center justify-center text-[#3c2f00] shadow-lg hover:scale-105 transition-transform duration-300"
            >
              <span className="material-symbols-outlined font-bold text-[18px]">send</span>
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
