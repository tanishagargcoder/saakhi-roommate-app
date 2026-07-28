import { useEffect, useRef, useState } from 'react';
import { Mic, X } from 'lucide-react';

// Small floating launcher; the ElevenLabs widget mounts only when opened
const VoiceAssistant = () => {
  const [open, setOpen] = useState(false);
  const scriptLoaded = useRef(false);

  // Load the widget script once, on first open
  useEffect(() => {
    if (!open || scriptLoaded.current) return;
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
    script.async = true;
    script.type = 'text/javascript';
    document.body.appendChild(script);
    scriptLoaded.current = true;
  }, [open]);

  // Mount/unmount the assistant with the toggle
  useEffect(() => {
    if (!open) return;
    const assistant = document.createElement('elevenlabs-convai');
    assistant.setAttribute('agent-id', 'agent_8101k1mkp2agedsskfb6djxev09e');
    // keep it clear of the launcher button
    assistant.style.cssText = 'position:fixed;bottom:88px;right:16px;z-index:55;';
    document.body.appendChild(assistant);
    return () => assistant.remove();
  }, [open]);

  return (
    <button
      onClick={() => setOpen((o) => !o)}
      title={open ? 'Close assistant' : 'Saakhi Voice Assistant'}
      aria-label={open ? 'Close voice assistant' : 'Open voice assistant'}
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 60,
        width: 48,
        height: 48,
        borderRadius: '50%',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        background: open
          ? 'rgba(42, 6, 32, 0.95)'
          : 'linear-gradient(135deg, #ff2d6b, #6a0a2a)',
        border: '1px solid rgba(255, 211, 107, 0.35)',
        boxShadow: '0 8px 22px -6px rgba(255, 45, 107, 0.7)',
        transition: 'transform 0.2s ease, background 0.2s ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {open ? <X size={20} /> : <Mic size={20} />}
    </button>
  );
};

export default VoiceAssistant;
