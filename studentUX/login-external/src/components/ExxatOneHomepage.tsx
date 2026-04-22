import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import FtuHomepage from './FtuHomepage';

interface ExxatOneHomepageProps {
  isFirstTimeUser?: boolean;
  userName?: string;
}

export default function ExxatOneHomepage({ isFirstTimeUser = false, userName }: ExxatOneHomepageProps) {
  const [showWelcome, setShowWelcome] = useState(isFirstTimeUser);
  const [showContent, setShowContent] = useState(!isFirstTimeUser);

  useEffect(() => {
    if (isFirstTimeUser) {
      // Show welcome message for 3 seconds, then fade to content
      const timer = setTimeout(() => {
        setShowWelcome(false);
        setTimeout(() => setShowContent(true), 500);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isFirstTimeUser]);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <AnimatePresence mode="wait">
        {showWelcome && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#fc52a1]/10 via-white to-[#f3d45b]/10 z-50"
          >
            <div className="text-center max-w-[600px] px-[32px]">
              {/* Animated Welcome */}
              <motion.div
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                <motion.div
                  animate={{
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="text-[80px] mb-[24px]"
                >
                  👋
                </motion.div>
                
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="font-['Crimson_Pro'] font-extrabold text-[48px] text-[#101828] leading-[1.2] mb-[16px]"
                >
                  Welcome to Exxat One{userName ? `, ${userName}` : ''}!
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="font-['Inter'] text-[20px] text-[#6b7280] mb-[32px]"
                >
                  Your journey to finding the perfect clinical opportunity starts here
                </motion.p>

                {/* Animated Feature Pills */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="flex flex-wrap items-center justify-center gap-[12px]"
                >
                  {['12000+ Jobs', '3300+ Placements', 'Smart Matching', 'Career Dashboard'].map((feature, index) => (
                    <motion.div
                      key={feature}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.9 + index * 0.1, type: 'spring' }}
                      className="bg-white px-[16px] py-[8px] rounded-full shadow-sm border border-gray-200"
                    >
                      <span className="font-['Inter'] text-[14px] text-[#6b7280]">{feature}</span>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Pulsing Dots - Loading Indicator */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  className="flex items-center justify-center gap-[8px] mt-[48px]"
                >
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-[8px] h-[8px] bg-[#fc52a1] rounded-full"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [1, 0.5, 1],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {showContent && (
          <motion.div
            key="content"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute inset-0"
          >
            {/* Sparkle Effects on Entry */}
            {isFirstTimeUser && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-[4px] h-[4px] bg-[#fc52a1] rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                      scale: [0, 1, 0],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      delay: Math.random() * 0.5,
                      ease: 'easeOut',
                    }}
                  />
                ))}
              </div>
            )}
            
            <FtuHomepage />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}