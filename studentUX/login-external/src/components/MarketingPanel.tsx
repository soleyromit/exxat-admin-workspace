import React from "react";
import { motion } from "motion/react";
import svgPaths from "../imports/svg-7tk9wzyq5l";

interface MarketingPanelProps {
  headline: React.ReactNode;
  imageSrc: string;
  imageAlt?: string;
  imageClassName?: string; // Allow overriding image positioning/sizing
  footerContent: React.ReactNode;
  showContent?: boolean;
}

export const MarketingPanel = ({
  headline,
  imageSrc,
  imageAlt = "Marketing Image",
  imageClassName,
  footerContent,
  showContent = true,
}: MarketingPanelProps) => {
  return (
    <div className="relative hidden lg:flex flex-1 h-full flex-col overflow-hidden bg-transparent transition-all duration-700 ease-in-out">
      {/* Logo */}
      <div className="relative z-10 px-10 pt-10">
        <div className="h-[18px] w-[100px] relative">
          <svg className="block w-full h-full" fill="none" viewBox="0 0 99 17">
            <g id="Group 18">
              <path d={svgPaths.p37fdfe80} fill="#E31C79" />
              <path d={svgPaths.pb8da600} fill="#E31C79" />
              <path d={svgPaths.p3d13d80} fill="#E31C79" />
              <path d={svgPaths.p369ebb80} fill="#263340" />
              <path d={svgPaths.p200fbc00} fill="#263340" />
              <path d={svgPaths.p1a0c9000} fill="#263340" />
              <path d={svgPaths.p17ce7380} fill="#263340" />
              <path d={svgPaths.p22673700} fill="#263340" />
            </g>
          </svg>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="flex-1 relative w-full h-full">
        {/* Headline */}
        <motion.div 
          initial={false}
          animate={{ opacity: showContent ? 1 : 0, x: showContent ? 0 : -20 }}
          transition={{ duration: 0.5 }}
          className="absolute top-[8%] left-[10%] z-10 max-w-[560px]"
        >
          {headline}
        </motion.div>

        {/* Professional Image */}
        <motion.div 
          className="absolute right-0 bottom-0 h-[96%] w-auto z-0 flex items-end justify-end pointer-events-none"
          animate={{ x: showContent ? 0 : 0, scale: showContent ? 1 : 1.05 }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={imageSrc}
            alt={imageAlt}
            className={`h-full w-auto object-contain object-bottom ${imageClassName || ""}`}
          />
        </motion.div>

        {/* Stats & Logos - positioned absolute at bottom left */}
        <motion.div 
          initial={false}
          animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
          transition={{ duration: 0.5 }}
          className="absolute bottom-[8%] left-[10%] z-10 flex flex-col gap-12"
        >
          {footerContent}
        </motion.div>
      </div>
    </div>
  );
};
