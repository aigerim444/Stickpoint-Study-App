import { motion } from 'framer-motion';

export const Scene4 = () => {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--color-accent)] z-10"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
    >
      <motion.div
        className="text-center z-30 mb-12"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ delay: 0.4, type: 'spring' }}
      >
        <h2 className="text-[3vw] font-display text-white brutal-border brutal-shadow-lg bg-[var(--color-ink)] px-8 py-4 uppercase leading-none">
          BUILT FOR THE ALL-NIGHTER CROWD.
        </h2>
      </motion.div>

      <div className="flex gap-12 w-[70vw] h-[25vw] relative z-20">
        {/* Streak */}
        <motion.div
          className="flex-1 bg-white brutal-border brutal-shadow-xl p-8 flex flex-col items-center justify-center relative overflow-hidden"
          initial={{ rotate: -5, x: -100, opacity: 0 }}
          animate={{ rotate: -2, x: 0, opacity: 1 }}
          exit={{ x: -80, opacity: 0 }}
          transition={{ delay: 0.8, type: 'spring' }}
        >
          <motion.div
            className="text-[8vw] mb-4"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ delay: 1.5, duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
          >
            🔥
          </motion.div>
          <h3 className="font-display text-2xl text-[var(--color-ink)] mb-2">DAY STREAK</h3>
          <motion.div
            className="font-display text-[6vw] text-[var(--color-error)] leading-none"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
          >
            14
          </motion.div>
        </motion.div>

        {/* Countdown */}
        <motion.div
          className="flex-1 bg-[var(--color-bg-light)] brutal-border brutal-shadow-xl p-8 flex flex-col items-center justify-center relative overflow-hidden"
          initial={{ rotate: 5, x: 100, opacity: 0 }}
          animate={{ rotate: 2, x: 0, opacity: 1 }}
          exit={{ x: 80, opacity: 0 }}
          transition={{ delay: 1.0, type: 'spring' }}
        >
          <div className="text-[6vw] mb-4">📅</div>
          <h3 className="font-display text-2xl text-[var(--color-ink)] mb-2">MIDTERM IN</h3>
          <div className="flex gap-4 items-end mt-4">
            <motion.div
              className="bg-white brutal-border px-6 py-4 font-display text-[4vw] text-[var(--color-ink)]"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.6, type: 'spring' }}
            >
              03
            </motion.div>
            <span className="font-body font-black text-3xl pb-2">DAYS</span>
          </div>
        </motion.div>
      </div>

      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="absolute w-[120vw] h-4 bg-[var(--color-ink)] opacity-10 -z-10"
          style={{ top: `${20 + i * 15}%`, left: '-10%', transform: 'rotate(-5deg)' }}
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ delay: i * 0.1, duration: 1, ease: 'easeOut' }}
        />
      ))}
    </motion.div>
  );
};
