import React from "react";
import {
  classroomImage8 as imgImage8,
  classroomImage9 as imgImage9,
  classroomImage10 as imgImage10,
  classroomImage11 as imgImage11,
  healthcareProfessional as imgFriendlyHealthcareProfessional1,
} from "../assets/images";
import svgPaths from "../imports/svg-7tk9wzyq5l";

export const MarketingSide = () => {
  return (
    <div className="relative hidden lg:flex flex-1 h-full flex-col overflow-hidden bg-transparent">
      {/* Background Texture/Gradient */}
      {/* <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "url('data:image/svg+xml;utf8,<svg viewBox=\"0 0 1280 812\" xmlns=\"http://www.w3.org/2000/svg\" preserveAspectRatio=\"none\"><rect x=\"0\" y=\"0\" height=\"100%\" width=\"100%\" fill=\"url(%23grad)\" opacity=\"1\"/><defs><radialGradient id=\"grad\" gradientUnits=\"userSpaceOnUse\" cx=\"0\" cy=\"0\" r=\"10\" gradientTransform=\"matrix(-10.05 -352.22 2691.9 -183.85 651.5 3451)\"><stop stop-color=\"rgba(247,247,247,0)\" offset=\"0.57941\"/><stop stop-color=\"rgba(247,247,247,1)\" offset=\"1\"/></radialGradient></defs></svg>')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      /> */}
      
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
        <div className="absolute top-[8%] left-[10%] z-10 max-w-[560px]">
           <h1 className="text-[72px] font-bold leading-[64px] tracking-[-0.08px]">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E31C79] to-[#F78DA7]">
              Classroom to Clinic with
            </span>{" "}
            <span className="text-black block">every step guided</span>
          </h1>
        </div>

        {/* Professional Image */}
        <div className="absolute right-0 bottom-0 h-[96%] w-auto z-0 flex items-end justify-end pointer-events-none">
             <img
                src={imgFriendlyHealthcareProfessional1}
                alt="Healthcare Professional"
                className="h-full w-auto object-contain object-bottom translate-x-[14%]" 
              />
        </div>

        {/* Stats & Logos - positioned absolute at bottom left */}
        <div className="absolute bottom-[8%] left-[10%] z-10 flex flex-col gap-12">
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

           {/* Carousel Indicators */}
          <div className="flex gap-1 items-center">
             <div className="w-[6px] h-[6px] rounded-full border border-black box-border"></div>
             <div className="w-[24px] h-[6px] rounded-full bg-black"></div>
             <div className="w-[6px] h-[6px] rounded-full border border-black box-border"></div>
             <div className="w-[6px] h-[6px] rounded-full border border-black box-border"></div>
          </div>
        </div>
      </div>
    </div>
  );
};