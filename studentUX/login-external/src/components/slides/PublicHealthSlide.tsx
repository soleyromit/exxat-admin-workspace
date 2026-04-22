import React from "react";
import { motion } from "motion/react";

export const PublicHealthSlide = () => {
  return (
    <div className="relative w-full h-full">
      {/* Content */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 px-10 pt-[8%] max-w-[560px]"
      >
        <div className="flex flex-col gap-6 text-left">
          <p className="text-[16px] leading-[24px]" style={{ color: '#041C2C' }}>
            <span className="font-light">Exxat </span>
            <span className="font-light italic">for </span>
            <span className="font-light">Public Health</span>
          </p>
          
          <h2 className="text-[48px] leading-[56px] tracking-tight" style={{ color: '#004B87' }}>
            <span className="font-serif">The All-in-one</span>
            <br />
            <span className="font-serif">Solution for Every</span>
            <br />
            <span className="font-serif">Public Health</span>
            <br />
            <span className="font-serif">Education Program</span>
          </h2>

          <p className="text-[18px] leading-[26px] text-black">
            Connecting and advancing public
            <br />
            health education
          </p>
        </div>
      </motion.div>
    </div>
  );
};
