import { motion } from 'framer-motion';

export const Scene5 = () => {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center bg-[var(--color-primary)] z-10"
      initial={{ clipPath: 'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)' }}
      animate={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
    >
      <div className="flex w-full px-[10vw] gap-12 items-center z-20">
        
        {/* Floating Window UI */}
        <motion.div
          className="flex-1 relative h-[35vw]"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.6, type: 'spring' }}
        >
          {/* Background Window (Notes) */}
          <div className="absolute inset-0 bg-white brutal-border brutal-shadow-lg opacity-50 p-4 pt-10">
            <div className="absolute top-0 left-0 w-full h-8 bg-[var(--color-ink)] flex items-center px-2 gap-2">
              <div className="w-3 h-3 rounded-full bg-[var(--color-error)]" />
              <div className="w-3 h-3 rounded-full bg-[var(--color-warning)]" />
              <div className="w-3 h-3 rounded-full bg-[var(--color-success)]" />
            </div>
            <div className="w-full h-4 bg-gray-300 mb-4 mt-4" />
            <div className="w-3/4 h-4 bg-gray-300 mb-4" />
            <div className="w-5/6 h-4 bg-gray-300 mb-4" />
          </div>

          {/* Floating Stickpoint Window */}
          <motion.div
            className="absolute top-[20%] right-[-10%] w-[25vw] bg-[var(--color-bg-light)] brutal-border brutal-shadow-xl p-4 z-30"
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 5 }}
            transition={{ delay: 1, type: 'spring', stiffness: 200, damping: 15 }}
          >
            <div className="flex justify-between items-center mb-4 border-b-4 border-[var(--color-ink)] pb-2">
              <span className="font-display text-xs">⧉ MINI</span>
              <div className="w-6 h-6 rounded-full bg-[var(--color-primary)] brutal-border flex items-center justify-center">
                <span className="text-[10px] text-white font-bold">C</span>
              </div>
            </div>
            <p className="font-body font-black text-sm mb-2">Grade my answer:</p>
            <div className="w-full h-12 bg-white brutal-border mb-2 p-2 font-mono text-xs text-gray-500">Mitochondria is...</div>
            <motion.div
              className="bg-[var(--color-success)] text-white font-display text-xs p-2 brutal-border mt-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2 }}
            >
              100% CORRECT!
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Text content */}
        <motion.div
          className="flex-1 flex flex-col gap-6 items-start"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.8, type: 'spring' }}
        >
          <motion.h2
            className="text-[4vw] font-display text-white leading-none brutal-shadow-lg"
            style={{ textShadow: '4px 4px 0 var(--color-ink)' }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            FLOAT IT.
          </motion.h2>
          <motion.h2
            className="text-[4vw] font-display text-[var(--color-ink)] leading-none"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.4 }}
          >
            GRADE IT.
          </motion.h2>
        </motion.div>
      </div>
    </motion.div>
  );
};