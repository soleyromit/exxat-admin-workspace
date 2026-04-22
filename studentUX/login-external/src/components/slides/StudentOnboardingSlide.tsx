import React from "react";
import { motion } from "motion/react";

export const StudentOnboardingSlide = () => {
  return (
    <div className="relative w-full h-full flex items-center justify-start pl-[10%] pr-[5%]">
      <div className="flex flex-col gap-6 max-w-[500px]">
        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-[48px] leading-[56px] font-bold text-[#002A3A] tracking-tight"
        >
          Welcome to Your
          <br />
          Clinical Journey
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-[18px] leading-[28px] text-[#002A3A]/70"
        >
          Join thousands of healthcare students connecting with clinical placement opportunities across the country.
        </motion.p>

        {/* Feature List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col gap-4 mt-2"
        >
          {[
            { title: "Find Clinical Placements", desc: "Access hundreds of verified placement sites" },
            { title: "Track Your Progress", desc: "Monitor hours, evaluations, and competencies" },
            { title: "Connect with Preceptors", desc: "Build relationships with industry professionals" },
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
              className="flex items-start gap-3"
            >
              <div className="w-6 h-6 rounded-full bg-[#E31C79] flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  width="12"
                  height="10"
                  viewBox="0 0 12 10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1 5L4.5 8.5L11 1.5"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[16px] font-semibold text-[#002A3A]">
                  {feature.title}
                </span>
                <span className="text-[14px] text-[#002A3A]/60">
                  {feature.desc}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};