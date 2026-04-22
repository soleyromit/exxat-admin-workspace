import { motion } from 'motion/react';
import { useState } from 'react';
import ExxatPrismLogo from '../imports/ExxatPrismLogo';
import { FontAwesomeIcon } from './font-awesome-icon';

interface PrismProfileExtractProps {
  onComplete: () => void;
  userName?: string;
}

export default function PrismProfileExtract({ onComplete, userName }: PrismProfileExtractProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleConnect = async () => {
    setIsConnecting(true);
    
    // Simulate connection process
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsConnecting(false);
    setIsExtracting(true);
    
    // Simulate data extraction with progress
    const duration = 3000;
    const steps = 50;
    const stepDuration = duration / steps;
    
    for (let i = 0; i <= steps; i++) {
      await new Promise(resolve => setTimeout(resolve, stepDuration));
      setProgress((i / steps) * 100);
    }
    
    // Small delay before completing
    await new Promise(resolve => setTimeout(resolve, 500));
    onComplete();
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-white">
      {/* Top Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1280px] h-[56px] px-[40px] flex items-center"
      >
        <div className="w-[100px] h-[18px]">
          <ExxatPrismLogo />
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px]">
        <div className="flex flex-col gap-[32px] items-center">
          {!isExtracting ? (
            <>
              {/* Prism Logo */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="w-[144px] h-[32px] mb-2"
              >
                <ExxatPrismLogo />
              </motion.div>

              {/* Heading */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="flex flex-col gap-2 items-center text-center"
              >
                <h1 className="font-bold text-[28px] leading-[36px] text-foreground tracking-[-0.08px]">
                  Connect Your Prism Profile
                </h1>
                <p className="text-[14px] leading-[20px] text-muted-foreground">
                  We'll securely import your profile data from Exxat Prism to save you time and ensure accuracy.
                </p>
              </motion.div>

              {/* Features */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="flex flex-col gap-3 w-full mt-2"
              >
                {[
                  { icon: 'user', text: 'Personal information & credentials' },
                  { icon: 'graduationCap', text: 'Education history & certifications' },
                  { icon: 'briefcase', text: 'Clinical experience & placements' },
                  { icon: 'shieldCheck', text: 'Secure & encrypted transfer' },
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
                    className="flex items-center gap-3 p-4 border border-border rounded-xl bg-card"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#3F51B5]/10 flex items-center justify-center shrink-0">
                      <FontAwesomeIcon name={feature.icon} className="text-base text-[#3F51B5]" />
                    </div>
                    <span className="text-[14px] text-foreground leading-tight">
                      {feature.text}
                    </span>
                  </motion.div>
                ))}
              </motion.div>

              {/* Connect Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1, duration: 0.6 }}
                className="w-full mt-2"
              >
                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="w-full h-[48px] rounded-xl flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-70 bg-[#3F51B5] text-white font-medium text-[16px]"
                >
                  {isConnecting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <FontAwesomeIcon name="spinner" className="text-base" />
                      </motion.div>
                      <span>Connecting to Prism...</span>
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon name="link" className="text-base" />
                      <span>Connect to Exxat Prism</span>
                    </>
                  )}
                </button>
              </motion.div>
            </>
          ) : (
            <>
              {/* Extracting State */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col gap-6 items-center w-full"
              >
                {/* Animated Icon */}
                <div className="w-24 h-24 rounded-full bg-[#3F51B5]/10 flex items-center justify-center relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 border-4 border-transparent border-t-[#3F51B5] rounded-full"
                  />
                  <FontAwesomeIcon name="cloudArrowDown" className="text-[32px] text-[#3F51B5]" />
                </div>

                {/* Progress Text */}
                <div className="flex flex-col gap-2 items-center text-center">
                  <h2 className="font-bold text-[28px] leading-[36px] text-foreground tracking-[-0.08px]">
                    Importing Your Profile
                  </h2>
                  <p className="text-[14px] leading-[20px] text-muted-foreground">
                    Securely transferring your data from Exxat Prism...
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="w-full">
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-[#3F51B5] rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="text-[13px] text-muted-foreground text-center mt-2">
                    {Math.round(progress)}% complete
                  </p>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.05, scale: 1 }}
          transition={{ delay: 0.5, duration: 1.5 }}
          className="absolute -top-[200px] -right-[200px] w-[600px] h-[600px] bg-[#3F51B5] rounded-full blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.05, scale: 1 }}
          transition={{ delay: 0.7, duration: 1.5 }}
          className="absolute -bottom-[200px] -left-[200px] w-[600px] h-[600px] bg-[#3F51B5] rounded-full blur-3xl"
        />
      </div>
    </div>
  );
}