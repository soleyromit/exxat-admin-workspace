import React from "react";
import { motion } from "motion/react";

export const Cohere2026Slide = () => {
  return (
    <div className="relative w-full h-full">
      {/* Content */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 px-10 pt-[8%] max-w-[560px]"
      >
        <div className="flex flex-col gap-4">
          <h3 className="text-[14px] font-semibold text-black tracking-wide">
            COHERE 2026
          </h3>
          
          <h2 className="text-[48px] leading-[52px] text-[#004B87] tracking-tight">
            <span className="font-serif">From the First Cohere </span>
            <br />
            <span className="font-serif">to the Tenth - Returning </span>
            <br />
            <span className="font-serif">to </span>
            <span className="font-serif italic">Baltimore</span>
          </h2>
          
          <p className="text-[18px] leading-[26px] text-black">
            A decade of connection
            <br />
            and growth
          </p>
          
          <p className="text-[16px] leading-[24px] text-[#E31C79]">
            <strong>September 23-25, 2026</strong>
            <br />
            <strong>Baltimore, MD</strong>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
