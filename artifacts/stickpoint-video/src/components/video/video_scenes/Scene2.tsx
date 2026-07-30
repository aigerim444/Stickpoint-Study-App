import { motion } from 'framer-motion';

export const Scene2 = () => {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--color-ink)] z-10 overflow-hidden"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ y: '-100%' }}
      transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
    >
      <motion.div
        className="absolute top-16 text-center z-30"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        transition={{ delay: 0.4, type: 'spring' }}
      >
        <h2 className="text-[3vw] font-display text-white mb-4 leading-normal">
          Drop your notes.
          <br />
          <span className="text-[var(--color-primary)]">Chop does the rest.</span>
        </h2>
      </motion.div>

      {/* Mockup UI */}
      <motion.div
        className="relative w-[50vw] h-[30vw] bg-white brutal-border brutal-shadow-xl p-6 flex flex-col mt-12 z-20"
        initial={{ y: 100, opacity: 0, rotate: -2 }}
        animate={{ y: 0, opacity: 1, rotate: -2 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ delay: 0.6, type: 'spring', stiffness: 300, damping: 25 }}
      >
        <div className="flex gap-2 mb-4 border-b-4 border-[var(--color-ink)] pb-4">
          <div className="w-4 h-4 rounded-full bg-[var(--color-error)] brutal-border" />
          <div className="w-4 h-4 rounded-full bg-[var(--color-warning)] brutal-border" />
          <div className="w-4 h-4 rounded-full bg-[var(--color-success)] brutal-border" />
        </div>

        <div className="flex-1 relative overflow-hidden">
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            <div className="w-full h-4 bg-gray-200 mb-4 brutal-border" />
            <div className="w-[80%] h-4 bg-gray-200 mb-4 brutal-border" />
            <div className="w-[90%] h-4 bg-gray-200 mb-4 brutal-border" />
            <div className="w-[60%] h-4 bg-gray-200 mb-4 brutal-border" />
            <div className="w-full h-4 bg-gray-200 mb-4 brutal-border" />
          </motion.div>

          {['FLASHCARD', 'CONCEPT', 'QUIZ'].map((text, i) => (
            <motion.div
              key={i}
              className="absolute top-1/2 left-1/2 w-48 h-32 bg-[var(--color-accent)] brutal-border flex items-center justify-center -translate-x-1/2 -translate-y-1/2 z-40"
              initial={{ scale: 0, x: '-50%', y: '-50%', rotate: 0 }}
              animate={{
                scale: 1,
                x: `calc(-50% + ${(i - 1) * 200}px)`,
                y: `calc(-50% - 150px)`,
                rotate: (i - 1) * 15,
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ delay: 2.2 + i * 0.1, type: 'spring', stiffness: 400, damping: 20 }}
            >
              <span className="font-display text-white text-sm">{text}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Chop mascot */}
      <motion.div
        className="absolute bottom-0 right-[15%] w-[18vw] h-[18vw] z-30"
        initial={{ y: '100%', rotate: 20 }}
        animate={{ y: 0, rotate: 0 }}
        exit={{ y: '100%' }}
        transition={{ delay: 1.8, type: 'spring', stiffness: 300, damping: 20 }}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/chop.png`}
          alt="Chop Mascot"
          className="w-full h-full object-contain filter drop-shadow-[4px_4px_0_var(--color-ink)]"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            const next = e.currentTarget.nextElementSibling as HTMLElement;
            if (next) next.style.display = 'block';
          }}
        />
        <svg viewBox="0 0 100 100" className="w-full h-full hidden drop-shadow-[4px_4px_0_var(--color-ink)]" stroke="var(--color-ink)" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="50" cy="30" r="15" fill="white" />
          <path d="M50 45 L50 75 M50 55 L30 40 M50 55 L70 40 M50 75 L35 95 M50 75 L65 95" />
          <circle cx="45" cy="28" r="2" fill="var(--color-ink)" stroke="none" />
          <circle cx="55" cy="28" r="2" fill="var(--color-ink)" stroke="none" />
          <path d="M45 35 Q50 40 55 35" strokeWidth="4" />
        </svg>
      </motion.div>
    </motion.div>
  );
};
