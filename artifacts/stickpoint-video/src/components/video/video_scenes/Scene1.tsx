import { motion } from 'framer-motion';

export const Scene1 = () => {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg-light)] z-10"
      initial={{ clipPath: 'circle(100% at 50% 50%)' }}
      exit={{ clipPath: 'circle(0% at 50% 50%)' }}
      transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
    >
      <div className="flex flex-col items-center gap-6 z-20">
        <div className="overflow-hidden">
          <motion.h1
            className="text-[6vw] font-display text-[var(--color-ink)] uppercase brutal-border brutal-shadow-lg bg-white px-8 py-4 leading-none"
            initial={{ y: '100%', rotate: -5 }}
            animate={{ y: 0, rotate: -2 }}
            exit={{ y: '-100%', rotate: -5, opacity: 0, transition: { duration: 0.4 } }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
          >
            STOP
          </motion.h1>
        </div>

        <div className="overflow-hidden">
          <motion.h1
            className="text-[4.5vw] font-display text-[var(--color-error)] uppercase leading-none"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%', opacity: 0, transition: { duration: 0.4 } }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.5 }}
          >
            RE-READING
          </motion.h1>
        </div>

        <div className="mt-8 overflow-hidden">
          <motion.h1
            className="text-[6vw] font-display text-white brutal-border brutal-shadow-xl bg-[var(--color-primary)] px-8 py-4 uppercase leading-none"
            initial={{ scale: 0, rotate: 10 }}
            animate={{ scale: 1, rotate: 2 }}
            exit={{ scale: 1.5, opacity: 0, transition: { duration: 0.5, ease: 'easeIn' } }}
            transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 1.2 }}
          >
            START REMEMBERING.
          </motion.h1>
        </div>
      </div>

      <motion.div
        className="absolute top-[20%] left-[10%] w-[10vw] h-[10vw] rounded-full bg-[var(--color-accent)] brutal-border brutal-shadow-lg z-0"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        transition={{ delay: 0.4, type: 'spring' }}
      />
      <motion.div
        className="absolute bottom-[20%] right-[15%] w-[8vw] h-[8vw] bg-[var(--color-error)] brutal-border brutal-shadow-lg z-0"
        initial={{ scale: 0, rotate: 0 }}
        animate={{ scale: 1, rotate: 45 }}
        exit={{ scale: 0 }}
        transition={{ delay: 1.4, type: 'spring' }}
      />
    </motion.div>
  );
};
