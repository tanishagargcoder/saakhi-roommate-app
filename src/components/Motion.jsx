import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useSpring, useMotionValue, useTransform } from 'framer-motion';

/* Thin progress bar that fills as the page scrolls */
export const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const width = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });
  return (
    <motion.div
      style={{ scaleX: width }}
      className="fixed top-0 left-0 right-0 h-1 z-50 origin-left bg-gradient-to-r from-[#c5cae9] via-white to-[#7986cb]"
    />
  );
};

/* Soft light that follows the cursor inside its parent section */
export const CursorGlow = () => {
  const ref = useRef(null);
  const [pos, setPos] = useState({ x: -400, y: -400 });

  useEffect(() => {
    const parent = ref.current?.parentElement;
    if (!parent) return;
    const move = (e) => {
      const r = parent.getBoundingClientRect();
      setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
    };
    const leave = () => setPos({ x: -400, y: -400 });
    parent.addEventListener('mousemove', move);
    parent.addEventListener('mouseleave', leave);
    return () => {
      parent.removeEventListener('mousemove', move);
      parent.removeEventListener('mouseleave', leave);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
      style={{
        background: `radial-gradient(340px circle at ${pos.x}px ${pos.y}px, rgba(197,202,233,0.14), transparent 70%)`,
      }}
    />
  );
};

/* Card that tilts in 3D toward the cursor */
export const TiltCard = ({ children, className = '', ...rest }) => {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-0.5, 0.5], ['9deg', '-9deg']);
  const rotateY = useTransform(x, [-0.5, 0.5], ['-9deg', '9deg']);

  const handleMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top) / r.height - 0.5);
  };
  const reset = () => { x.set(0); y.set(0); };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', transformPerspective: 900 }}
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

/* Button that leans toward the cursor */
export const MagneticButton = ({ children, className = '', onClick, ...rest }) => {
  const ref = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    setOffset({
      x: (e.clientX - (r.left + r.width / 2)) * 0.25,
      y: (e.clientY - (r.top + r.height / 2)) * 0.35,
    });
  };

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={() => setOffset({ x: 0, y: 0 })}
      onClick={onClick}
      animate={{ x: offset.x, y: offset.y }}
      transition={{ type: 'spring', stiffness: 220, damping: 16 }}
      whileTap={{ scale: 0.96 }}
      className={className}
      {...rest}
    >
      {children}
    </motion.button>
  );
};

/* Number that counts up the first time it scrolls into view */
export const CountUp = ({ to, suffix = '', prefix = '', duration = 1400 }) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') { setInView(true); return; }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setInView(true); observer.disconnect(); }
      },
      { threshold: 0.2 }
    );
    observer.observe(node);
    // Never leave the number stuck at 0 if the observer never reports
    const fallback = setTimeout(() => setInView(true), 2500);
    return () => { observer.disconnect(); clearTimeout(fallback); };
  }, []);

  useEffect(() => {
    if (!inView) return;
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      // ease-out so it settles gently
      setValue(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    // Safety net: if rAF is throttled (background tab), still land on the final number
    const settle = setTimeout(() => setValue(to), duration + 100);
    return () => { cancelAnimationFrame(frame); clearTimeout(settle); };
  }, [inView, to, duration]);

  return <span ref={ref}>{prefix}{value}{suffix}</span>;
};

/* Headline that reveals word by word */
export const RevealWords = ({ text, className = '', delay = 0 }) => (
  <span className={className}>
    {text.split(' ').map((word, i) => (
      <React.Fragment key={`${word}-${i}`}>
        <motion.span
          initial={{ opacity: 0, y: 22, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.5, delay: delay + i * 0.08, ease: 'easeOut' }}
          className="inline-block"
        >
          {word}
        </motion.span>
        {i < text.split(' ').length - 1 && ' '}
      </React.Fragment>
    ))}
  </span>
);

/* Circular progress ring — used for compatibility scores and profile completeness */
export const ScoreRing = ({ value = 0, size = 56, stroke = 5, label, className = '' }) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = value >= 75 ? '#34d399' : value >= 50 ? '#60a5fa' : '#94a3b8';

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (value / 100) * circumference }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="font-bold" style={{ color, fontSize: size * 0.28 }}>{value}%</span>
        {label && <span className="text-[9px] text-blue-200 mt-0.5">{label}</span>}
      </span>
    </div>
  );
};

/* Word that swaps every couple of seconds */
export const RotatingWord = ({ words, className = '' }) => {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % words.length), 2200);
    return () => clearInterval(t);
  }, [words.length]);

  return (
    <span className={`inline-block relative ${className}`}>
      <motion.span
        key={i}
        initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -14 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="inline-block"
      >
        {words[i]}
      </motion.span>
    </span>
  );
};
