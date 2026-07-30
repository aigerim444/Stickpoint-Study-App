import { motion } from 'framer-motion';

export const Scene3 = () => {
  const methods = [
    { name: 'FEYNMAN', color: 'var(--color-primary)' },
    { name: 'QUIZ', color: 'var(--color-accent)' },
    { name: 'RECALL', color: 'var(--color-success)' },
  ];

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg-light)] z-10"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ scale: 1.2, opacity: 0 }}
      transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
    >
      <div className="flex w-full max-w-[80vw] gap-12 items-center z-20">
        <div className="flex-1 flex flex-col gap-6">
          <motion.div
            className="inline-block bg-[var(--color-ink)] text-white font-display px-4 py-2 brutal-border self-start"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.5, type: 'spring' }}
          >
            PERSONALIZED
          </motion.div>
          <motion.h2
            className="text-[5vw] font-display text-[var(--color-ink)] leading-none"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.7, type: 'spring' }}
          >
            FOR YOU.
          </motion.h2>

          <div className="flex flex-col gap-4 mt-8">
            {methods.map((method, i) => (
              <motion.div
                key={method.name}
                className="flex items-center gap-4 bg-white brutal-border brutal-shadow p-4 w-full"
                initial={{ opacity: 0, x: -100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -60 }}
                transition={{ delay: 1.2 + i * 0.2, type: 'spring', stiffness: 300, damping: 20 }}
              >
                <div className="w-8 h-8 rounded-full brutal-border" style={{ backgroundColor: method.color }} />
                <span className="font-display text-xl">{method.name}</span>
                <motion.div
                  className="ml-auto w-6 h-6 border-4 border-[var(--color-ink)] rounded-full flex items-center justify-center bg-[var(--color-primary)] text-white text-xs font-bold"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1.6 + i * 0.2, type: 'spring' }}
                >
                  ✓
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          className="flex-1 relative flex justify-center items-center h-[30vw]"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 0.8, type: 'spring' }}
        >
          <div className="absolute top-0 right-[20%] bg-white brutal-border brutal-shadow px-6 py-4 z-30 rounded-tl-3xl rounded-tr-3xl rounded-bl-3xl">
            <p className="font-body font-black text-2xl">Chop's got your back!</p>
          </div>
          <svg viewBox="0 0 100 100" className="w-[20vw] h-[20vw] drop-shadow-[6px_6px_0_var(--color-ink)] z-20 mt-16" stroke="var(--color-ink)" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="50" cy="30" r="15" fill="white" />
            <path d="M50 45 L50 75 M50 55 L30 30 M50 55 L70 30 M50 75 L35 95 M50 75 L65 95" />
            <circle cx="45" cy="28" r="2" fill="var(--color-ink)" stroke="none" />
            <circle cx="55" cy="28" r="2" fill="var(--color-ink)" stroke="none" />
            <path d="M42 35 Q50 42 58 35" strokeWidth="4" />
          </svg>
          <motion.div
            className="absolute inset-0 bg-[var(--color-accent)] brutal-border rounded-full -z-10"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1, type: 'spring', duration: 1 }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
};
