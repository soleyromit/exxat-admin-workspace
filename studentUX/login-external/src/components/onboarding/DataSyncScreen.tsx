import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Database, Zap, Target, CheckCircle2 } from 'lucide-react';

interface DataSyncScreenProps {
  onComplete: () => void;
  userName?: string;
}

interface SyncStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  duration: number;
  stat?: string;
}

export default function DataSyncScreen({ onComplete, userName }: DataSyncScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const syncSteps: SyncStep[] = [
    {
      id: 'profile',
      label: 'Analyzing your profile',
      icon: <Database className="w-[20px] h-[20px]" />,
      duration: 800,
    },
    {
      id: 'matching',
      label: 'Finding matching opportunities',
      icon: <Target className="w-[20px] h-[20px]" />,
      duration: 900,
      stat: '127 jobs found',
    },
    {
      id: 'preferences',
      label: 'Syncing your preferences',
      icon: <Zap className="w-[20px] h-[20px]" />,
      duration: 700,
    },
    {
      id: 'workspace',
      label: 'Setting up your workspace',
      icon: <CheckCircle2 className="w-[20px] h-[20px]" />,
      duration: 600,
    },
  ];

  useEffect(() => {
    if (currentStep < syncSteps.length) {
      const timer = setTimeout(() => {
        setCompletedSteps(prev => [...prev, syncSteps[currentStep].id]);
        setCurrentStep(prev => prev + 1);
      }, syncSteps[currentStep].duration);

      return () => clearTimeout(timer);
    } else {
      // All steps complete, wait a bit then move on
      const timer = setTimeout(() => {
        onComplete();
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-white">
      {/* Animated gradient background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-[#fc52a1]/5 via-[#f3d45b]/5 to-[#a4d2f4]/5"
          animate={{
            background: [
              'linear-gradient(135deg, rgba(252,82,161,0.05) 0%, rgba(243,212,91,0.05) 50%, rgba(164,210,244,0.05) 100%)',
              'linear-gradient(135deg, rgba(164,210,244,0.05) 0%, rgba(252,82,161,0.05) 50%, rgba(243,212,91,0.05) 100%)',
              'linear-gradient(135deg, rgba(243,212,91,0.05) 0%, rgba(164,210,244,0.05) 50%, rgba(252,82,161,0.05) 100%)',
              'linear-gradient(135deg, rgba(252,82,161,0.05) 0%, rgba(243,212,91,0.05) 50%, rgba(164,210,244,0.05) 100%)',
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Main Content */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px]">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-[48px]"
        >
          <h2 className="font-['Inter'] font-semibold text-[24px] text-[#101828] mb-[8px]">
            Preparing your experience
          </h2>
          <p className="font-['Inter'] text-[14px] text-[#6b7280]">
            We're personalizing everything just for you
          </p>
        </motion.div>

        {/* Sync Steps */}
        <div className="space-y-[16px]">
          {syncSteps.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = index === currentStep;
            const isPending = index > currentStep;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-[16px] p-[16px] rounded-[12px] transition-all ${
                  isCurrent
                    ? 'bg-white shadow-md border border-gray-200'
                    : isCompleted
                    ? 'bg-white/50'
                    : 'bg-white/30'
                }`}
              >
                {/* Icon */}
                <div
                  className={`w-[40px] h-[40px] rounded-[8px] flex items-center justify-center shrink-0 transition-all ${
                    isCompleted
                      ? 'bg-gradient-to-br from-[#fc52a1] to-[#f3d45b] text-white'
                      : isCurrent
                      ? 'bg-[#f3f4f6] text-[#39393c]'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-[20px] h-[20px]" />
                  ) : (
                    step.icon
                  )}
                </div>

                {/* Label */}
                <div className="flex-1">
                  <p
                    className={`font-['Inter'] text-[14px] ${
                      isCompleted || isCurrent
                        ? 'text-[#101828] font-medium'
                        : 'text-[#9ca3af] font-normal'
                    }`}
                  >
                    {step.label}
                  </p>
                  {step.stat && isCompleted && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="font-['Inter'] text-[12px] text-[#6b7280] mt-[4px]"
                    >
                      {step.stat}
                    </motion.p>
                  )}
                </div>

                {/* Loading Indicator */}
                {isCurrent && (
                  <motion.div
                    className="flex gap-[4px]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-[6px] h-[6px] bg-[#39393c] rounded-full"
                        animate={{
                          scale: [1, 1.3, 1],
                          opacity: [0.3, 1, 0.3],
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: i * 0.15,
                        }}
                      />
                    ))}
                  </motion.div>
                )}

                {/* Check mark */}
                {isCompleted && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  >
                    <CheckCircle2 className="w-[20px] h-[20px] text-[#10b981]" />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-[32px]"
        >
          <div className="bg-gray-200 h-[6px] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#fc52a1] to-[#f3d45b]"
              initial={{ width: '0%' }}
              animate={{
                width: `${(completedSteps.length / syncSteps.length) * 100}%`,
              }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="flex justify-between mt-[8px]">
            <p className="font-['Inter'] text-[12px] text-[#6b7280]">
              {completedSteps.length} of {syncSteps.length} complete
            </p>
            <p className="font-['Inter'] text-[12px] font-medium text-[#39393c]">
              {Math.round((completedSteps.length / syncSteps.length) * 100)}%
            </p>
          </div>
        </motion.div>
      </div>

      {/* Ambient particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-[3px] h-[3px] bg-gradient-to-r from-[#fc52a1] to-[#f3d45b] rounded-full"
            style={{
              left: `${15 + Math.random() * 70}%`,
              top: `${15 + Math.random() * 70}%`,
            }}
            animate={{
              y: [0, -40, 0],
              opacity: [0, 0.6, 0],
              scale: [0, 1.2, 0],
            }}
            transition={{
              duration: 2.5 + Math.random() * 1.5,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
    </div>
  );
}
