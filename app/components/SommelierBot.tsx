'use client';

import { useState, useRef, useEffect } from 'react';

// 1. Time-Stamps Configuration for the Single Video
// EDIT THESE TIMES (in seconds) to match the exact start/end of each phrase in your video.
const FUNNEL_CLIPS = [
    { id: 1, startTime: 0, endTime: 7, title: "Welcome & Hook" },
    { id: 2, startTime: 7.5, endTime: 14.5, title: "Gender Selection" },
    { id: 3, startTime: 15, endTime: 21, title: "Final Stretch Transition" },
    { id: 4, startTime: 21.5, endTime: 28, title: "Neutral Acknowledgment" },
    { id: 5, startTime: 28.5, endTime: 34, title: "Searching Options" },
    { id: 6, startTime: 34.5, endTime: 40, title: "Closing CTA" }
];

export default function SommelierBot() {
    const [currentStep, setCurrentStep] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    // 2. Background Audio Engine (Starts on mount, low volume)
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = 0.15; // 15% volume so it doesn't drown the voice

            // Attempt to play background music. Will log a soft warning if the browser blocks autoplay.
            audioRef.current.play().catch(() => {
                console.warn("Autoplay blocked by browser. Interaction required.");
            });
        }
    }, []);

    // 3. Smart Video Playback Engine
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const currentClip = FUNNEL_CLIPS[currentStep];
        video.currentTime = currentClip.startTime;
        video.play();

        // Listener to pause exactly when the current phrase ends
        const handleTimeUpdate = () => {
            if (video.currentTime >= currentClip.endTime) {
                video.pause();
                video.removeEventListener('timeupdate', handleTimeUpdate);
            }
        };

        video.addEventListener('timeupdate', handleTimeUpdate);

        // Cleanup listener on unmount or step change
        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
        };
    }, [currentStep]);

    // 4. Progression Handler (Triggered by user choice)
    const handleNextStep = () => {
        if (currentStep < FUNNEL_CLIPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto bg-black p-4 rounded-xl">

            {/* INVISIBLE AUDIO PLAYER FOR MAFIA SONG */}
            <audio
                ref={audioRef}
                src="/audio/mafia-song.wav"
                loop
                className="hidden"
            />

            {/* THE LUXURY SOMMELIER VIDEO INTERFACE */}
            <div className="w-full rounded-lg overflow-hidden border-2 border-yellow-600 shadow-2xl shadow-yellow-900/20 relative">
                <video
                    ref={videoRef}
                    className="w-full h-auto object-cover"
                    playsInline
                    controls={false} // Hide default controls for a clean app feel
                >
                    <source src="/videos/bot-introduccion.mov" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            </div>

            {/* INTERACTIVE UI (Temporary button to test the flow) */}
            <div className="mt-6 w-full">
                <button
                    onClick={handleNextStep}
                    className="w-full py-3 bg-purple-900 text-white font-bold rounded-md hover:bg-purple-800 transition-colors uppercase tracking-widest text-sm"
                >
                    {currentStep === 5 ? "Agendar Asesoría" : "Continuar / Siguiente Paso"}
                </button>
            </div>

        </div>
    );
}