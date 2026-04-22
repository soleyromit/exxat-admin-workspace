import React from "react";
import { motion } from "motion/react";

// Images
import {
  classroomImage8 as imgImage8,
  classroomImage9 as imgImage9,
  classroomImage10 as imgImage10,
  classroomImage11 as imgImage11,
  healthcareProfessional as imgFriendlyHealthcareProfessional1,
} from "../../assets/images";

export const ClassroomToClinicSlide = () => {
  return (
    <div className="relative w-full h-full">
      {/* Headline */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute top-[8%] left-[10%] z-10 max-w-[560px]"
      >
        <h1 className="text-[72px] font-bold leading-[64px] tracking-[-0.08px]">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E31C79] to-[#F78DA7]">
            Classroom to Clinic with
          </span>{" "}
          <span className="text-black block">every step guided</span>
        </h1>
      </motion.div>

      {/* Professional Image */}
      <motion.div 
        className="absolute right-0 bottom-0 h-[96%] w-auto z-0 flex items-end justify-end pointer-events-none"
        initial={{ scale: 1.05 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.8 }}
      >
        <img
          src={imgFriendlyHealthcareProfessional1}
          alt="Healthcare Professional"
          className="h-full w-auto object-contain object-bottom translate-x-[14%]"
        />
      </motion.div>

      {/* Stats & Logos */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute bottom-[15%] left-[10%] z-10 flex flex-col gap-12"
      >
        <div className="flex flex-col gap-6">
          <p className="text-black font-semibold text-[16px] leading-[24px]">
            300K+ Students exploring and discovering opportunities
          </p>
          
          <div className="flex items-center gap-6">
            <img src={imgImage8} className="h-[21px] w-auto object-contain" alt="Logo 1" />
            <img src={imgImage9} className="h-[15px] w-auto object-contain" alt="Cleveland Clinic" />
            <div className="relative h-[17px] w-[56px] overflow-hidden">
               <img src={imgImage10} className="w-[116%] max-w-none relative -left-[8%] -top-[40%]" alt="MedStar" />
            </div>
            <img src={imgImage11} className="h-[16px] w-auto object-contain" alt="ATI" />
            <p className="font-black text-[16px] leading-[24px] text-black whitespace-nowrap">400+ Hospitals</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};