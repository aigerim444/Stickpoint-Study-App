import { motion } from 'framer-motion';

export const Scene6 = () => {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--color-bg-light)] z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ scale: 1.1, opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="flex flex-col items-center gap-8 z-20"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 20 }}
      >
        <div className="relative w-[15vw] h-[15vw]">
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[6px_6px_0_var(--color-ink)]" stroke="var(--color-ink)" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M50 45 L50 70" />
            <path d="M50 50 L30 20" />
            <path d="M50 50 L70 20" />
            <path d="M50 70 L35 90" />
            <path d="M50 70 L65 90" />
            <circle cx="50" cy="30" r="15" fill="white" />
            <path d="M42 28 Q45 25 47 28" strokeWidth="3" />
            <path d="M53 28 Q56 25 58 28" strokeWidth="3" />
            <path d="M42 35 Q50 45 58 35" strokeWidth="4" />
          </svg>

          <motion.div
            className="absolute -top-4 -right-8"
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <span className="text-4xl">✨</span>
          </motion.div>
        </div>

        <div className="overflow-hidden p-4">
          <motion.h1
            className="text-[8vw] font-display text-[var(--color-ink)] brutal-shadow-xl"
            initial={{ y: '100%', rotate: 5 }}
            animate={{ y: 0, rotate: 0 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ delay: 0.8, type: 'spring', stiffness: 300, damping: 15 }}
          >
            STICKPOINT
          </motion.h1>
        </div>

        <motion.div
          className="bg-[var(--color-primary)] text-white px-8 py-4 brutal-border brutal-shadow font-body font-black text-2xl uppercase tracking-widest"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ delay: 1.5, type: 'spring' }}
        >
          YOUR NOTES. YOUR METHODS.
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
