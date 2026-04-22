import React from "react";
import { motion } from "motion/react";
import PlacementChaosIllustration from "../../imports/Group66425";

export const PlacementChaosSlide = () => {
  return (
    <div className="relative w-full h-full">
      {/* Headline */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute top-[8%] left-[10%] z-10 max-w-[600px]"
      >
        <h1 className="text-[72px] font-bold leading-[64px] tracking-[-0.08px]">
          <span className="text-black block">
            Placement Chaos?
          </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E31C79] to-[#F78DA7] block mt-2">
            Problem Solved.
          </span>
        </h1>
      </motion.div>

      {/* Illustration */}
      <motion.div 
        className="absolute left-[10%] top-[35%] h-auto w-[60%] aspect-[4/3] z-0 flex items-start justify-start pointer-events-none"
        initial={{ scale: 1.05, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <PlacementChaosIllustration className="w-full h-full" />
      </motion.div>

      {/* Footer Text */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute bottom-[15%] left-[10%] z-10 flex flex-col gap-12"
      >
        <div className="flex flex-col gap-6">
          <p className="text-black font-semibold text-[20px] leading-[28px] max-w-[480px]">
            Streamline Placements. Track Compliance. Launch Careers.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
