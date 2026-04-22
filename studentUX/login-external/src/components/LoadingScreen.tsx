import { motion } from 'motion/react';
import { FontAwesomeIcon } from './font-awesome-icon';
import ExxatPrismLogo from '../imports/ExxatPrismLogo';

interface LoadingScreenProps {
  userName?: string;
}

export default function LoadingScreen({ userName }: LoadingScreenProps) {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-white flex items-center justify-center">
      <div className="flex flex-col gap-8 items-center max-w-[420px] w-full px-6">
        {/* Prism Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-[144px] h-[32px]"
        >
          <ExxatPrismLogo />
        </motion.div>

        {/* Animated Loading Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="relative"
        >
          <div className="w-24 h-24 rounded-full bg-[#3F51B5]/10 flex items-center justify-center relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 border-4 border-transparent border-t-[#3F51B5] rounded-full"
            />
            <FontAwesomeIcon name="cloudArrowDown" className="text-[32px] text-[#3F51B5]" />
          </div>
        </motion.div>

        {/* Loading Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="flex flex-col gap-2 items-center text-center"
        >
          <h2 className="font-bold text-[28px] leading-[36px] text-foreground tracking-[-0.08px]">
            Connecting to Prism
          </h2>
          <p className="text-[14px] leading-[20px] text-muted-foreground">
            {userName ? `${userName}, we're` : "We're"} setting up your profile...
          </p>
        </motion.div>

        {/* Animated dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex gap-2"
        >
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="w-2 h-2 rounded-full bg-[#3F51B5]"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.2,
              }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
