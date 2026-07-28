import React, { useEffect, useState } from 'react';
import { Download, RefreshCw, X } from 'lucide-react';

const shell = {
  position: 'fixed',
  bottom: 20,
  left: 20,
  zIndex: 60,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 14px',
  borderRadius: 14,
  color: '#ffe3ef',
  background: 'linear-gradient(140deg, rgba(42,6,32,0.96), rgba(26,4,24,0.96))',
  border: '1px solid rgba(255,122,176,0.35)',
  boxShadow: '0 14px 34px -14px rgba(255,45,107,0.75)',
  backdropFilter: 'blur(10px)',
  fontSize: '0.9rem',
  maxWidth: 'calc(100vw - 40px)',
};

const action = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '7px 13px',
  borderRadius: 10,
  border: 'none',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '0.85rem',
  color: '#fff',
  background: 'linear-gradient(135deg, #ff2d6b, #a01844)',
  boxShadow: '0 6px 16px -6px rgba(255,45,107,0.8)',
};

const dismiss = {
  background: 'transparent',
  border: 'none',
  color: '#ffb3d0',
  cursor: 'pointer',
  display: 'inline-flex',
  padding: 2,
};

/** Storm-themed "install this app" and "new version ready" prompts. */
const PwaPrompt = () => {
  const [installEvent, setInstallEvent] = useState(null);
  const [installHidden, setInstallHidden] = useState(
    () => typeof sessionStorage !== 'undefined' && sessionStorage.getItem('saakhi_install_dismissed') === '1'
  );
  const [updateReady, setUpdateReady] = useState(false);

  // Install prompt
  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setInstallEvent(e);
    };
    const onInstalled = () => setInstallEvent(null);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  // New service worker took over → a fresh build is available
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    let cancelled = false;

    const onControllerChange = () => {
      if (!cancelled) setUpdateReady(true);
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg || cancelled) return;
      if (reg.waiting) setUpdateReady(true);
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller && !cancelled) {
            setUpdateReady(true);
          }
        });
      });
    });

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  const handleInstall = async () => {
    if (!installEvent) return;
    installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  };

  const hideInstall = () => {
    setInstallHidden(true);
    try { sessionStorage.setItem('saakhi_install_dismissed', '1'); } catch { /* private mode */ }
  };

  if (updateReady) {
    return (
      <div style={shell} role="status">
        <span>✨ A new version of Saakhi is ready.</span>
        <button style={action} onClick={() => window.location.reload()}>
          <RefreshCw size={14} /> Reload
        </button>
        <button style={dismiss} onClick={() => setUpdateReady(false)} aria-label="Dismiss update notice">
          <X size={15} />
        </button>
      </div>
    );
  }

  if (!installEvent || installHidden) return null;

  return (
    <div style={shell} role="status">
      <span>📲 Install Saakhi as an app</span>
      <button style={action} onClick={handleInstall}>
        <Download size={14} /> Install
      </button>
      <button style={dismiss} onClick={hideInstall} aria-label="Dismiss install prompt">
        <X size={15} />
      </button>
    </div>
  );
};

export default PwaPrompt;
