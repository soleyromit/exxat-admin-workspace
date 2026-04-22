import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, CheckCircle2, TrendingUp, Award } from 'lucide-react';

interface CelebrationTransitionProps {
  onComplete: () => void;
  userName?: string;
}

export default function CelebrationTransition({ onComplete, userName }: CelebrationTransitionProps) {
  const [step, setStep] = useState<'confetti' | 'stats' | 'ready'>('confetti');

  useEffect(() => {
    const timer1 = setTimeout(() => setStep('stats'), 1500);
    const timer2 = setTimeout(() => setStep('ready'), 3000);
    const timer3 = setTimeout(() => onComplete(), 4500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-[#fc52a1] via-[#f3d45b] to-[#a4d2f4]">
      {/* Animated Gradient Background */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            'radial-gradient(circle at 0% 0%, #fc52a1 0%, #f3d45b 50%, #a4d2f4 100%)',
            'radial-gradient(circle at 100% 100%, #fc52a1 0%, #f3d45b 50%, #a4d2f4 100%)',
            'radial-gradient(circle at 0% 100%, #fc52a1 0%, #f3d45b 50%, #a4d2f4 100%)',
            'radial-gradient(circle at 100% 0%, #fc52a1 0%, #f3d45b 50%, #a4d2f4 100%)',
          ],
        }}
        transition={{ duration: 4, ease: 'easeInOut' }}
      />

      {/* Floating Confetti Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-[10px] h-[10px] rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-10%`,
              backgroundColor: ['#fc52a1', '#f3d45b', '#a4d2f4', '#ffffff'][Math.floor(Math.random() * 4)],
            }}
            animate={{
              y: ['0vh', '110vh'],
              x: [0, Math.random() * 100 - 50],
              rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
              opacity: [1, 0.8, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              delay: Math.random() * 0.5,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center h-full">
        {step === 'confetti' && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="text-center"
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 0.6,
                repeat: 2,
              }}
            >
              <Sparkles className="w-[120px] h-[120px] text-white mx-auto mb-[24px]" />
            </motion.div>
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="font-['Crimson_Pro'] font-extrabold text-[64px] text-white leading-[1.2] mb-[16px]"
            >
              Congratulations!
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="font-['Inter'] text-[24px] text-white/90"
            >
              Your profile is ready, {userName || 'champion'}! 🎉
            </motion.p>
          </motion.div>
        )}

        {step === 'stats' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center max-w-[600px]"
          >
            <CheckCircle2 className="w-[80px] h-[80px] text-white mx-auto mb-[32px]" />
            <h2 className="font-['Crimson_Pro'] font-extrabold text-[48px] text-white leading-[1.2] mb-[40px]">
              You're all set!
            </h2>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-[24px]">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white/20 backdrop-blur-sm rounded-[16px] p-[24px]"
              >
                <TrendingUp className="w-[32px] h-[32px] text-white mx-auto mb-[12px]" />
                <div className="font-['Inter'] font-bold text-[32px] text-white mb-[4px]">127</div>
                <div className="font-['Inter'] text-[14px] text-white/80">Matching Jobs</div>
              </motion.div>
              
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-white/20 backdrop-blur-sm rounded-[16px] p-[24px]"
              >
                <Award className="w-[32px] h-[32px] text-white mx-auto mb-[12px]" />
                <div className="font-['Inter'] font-bold text-[32px] text-white mb-[4px]">75%</div>
                <div className="font-['Inter'] text-[14px] text-white/80">Profile Complete</div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {step === 'ready' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <h2 className="font-['Crimson_Pro'] font-extrabold text-[72px] text-white leading-[1.2] mb-[24px]">
                Let's explore
              </h2>
              <p className="font-['Inter'] text-[24px] text-white/90">
                Taking you to your dashboard...
              </p>
            </motion.div>
            
            {/* Loading dots */}
            <div className="flex items-center justify-center gap-[12px] mt-[40px]">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-[12px] h-[12px] bg-white rounded-full"
                  animate={{
                    y: [0, -20, 0],
                    opacity: [1, 0.5, 1],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
