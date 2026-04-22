import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FontAwesomeIcon } from "./font-awesome-icon";
import svgPaths from "../imports/svg-hw8ipk0zte";
import { Cohere2026Slide } from "./slides/Cohere2026Slide";
import { PublicHealthSlide } from "./slides/PublicHealthSlide";
import { StudentOnboardingSlide } from "./slides/StudentOnboardingSlide";
import { ClassroomToClinicSlide } from "./slides/ClassroomToClinicSlide";
import { RecruitingSolvedSlide } from "./slides/RecruitingSolvedSlide";
import { PlacementChaosSlide } from "./slides/PlacementChaosSlide";
import cohereBackgroundImage from "figma:asset/ab2278fbb115104abe74e0ddc9356c4b722a182a.png";
import publicHealthBackgroundImage from "figma:asset/3339914084a6b91e68687f62e49f07b07fa3484a.png";

interface MarketingCarouselProps {
  visible?: boolean;
  isStudentOnboarding?: boolean;
}

export const MarketingCarousel = ({ visible = true, isStudentOnboarding = false }: MarketingCarouselProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  const [autoplayPaused, setAutoplayPaused] = useState(false);
  
  // Define slides based on whether it's student onboarding
  const slides = isStudentOnboarding 
    ? [
        { id: 0, component: StudentOnboardingSlide, background: null },
        { id: 1, component: PublicHealthSlide, background: publicHealthBackgroundImage },
      ]
    : [
        { id: 0, component: Cohere2026Slide, background: cohereBackgroundImage },
        { id: 1, component: PublicHealthSlide, background: publicHealthBackgroundImage },
      ];

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setProgress(0);
  };

  const goToPrev = () => {
    goToSlide((currentSlide - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    goToSlide((currentSlide + 1) % slides.length);
  };

  useEffect(() => {
    if (!visible || autoplayPaused) return;
    setProgress(0);
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [visible, slides.length, autoplayPaused]);

  useEffect(() => {
    if (!visible || autoplayPaused) return;
    setProgress(0);
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / 8000) * 100, 100);
      setProgress(newProgress);
      if (newProgress >= 100) {
        clearInterval(progressInterval);
      }
    }, 16); // ~60fps
    return () => clearInterval(progressInterval);
  }, [currentSlide, visible, autoplayPaused]);

  return (
    <div 
      className="relative hidden lg:flex flex-1 h-full flex-col overflow-hidden transition-all duration-700 ease-in-out bg-cover bg-center" 
      style={{ 
        backgroundImage: slides[currentSlide].background ? `url(${slides[currentSlide].background})` : 'none',
        backgroundColor: slides[currentSlide].background ? 'transparent' : 'transparent'
      }}
    >
      {/* Logo */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-20 px-10 pt-10"
      >
        <div className="h-[21.6px] w-[120px] relative">
          <svg className="block w-full h-full" fill="none" viewBox="0 0 112 28" preserveAspectRatio="xMinYMin meet">
            <g id="Group">
              <path d={svgPaths.p3442880} fill="#E31C79" id="Vector" />
              <path d={svgPaths.p2b6cab00} fill="#E31C79" id="Vector_2" />
              <path d={svgPaths.p2ea51d40} fill="#E31C79" id="Vector_3" />
              <path d={svgPaths.p1a32a200} fill="#E31C79" id="Vector_4" />
              <path d={svgPaths.p1782dc00} fill="#E31C79" id="Vector_5" />
              <path d={svgPaths.p18c33400} fill="#002A3A" id="Vector_6" />
              <path d={svgPaths.p232f45f0} fill="#002A3A" id="Vector_7" />
              <path d={svgPaths.p3fa91980} fill="#002A3A" id="Vector_8" />
              <path d={svgPaths.p1dbe6500} fill="#002A3A" id="Vector_9" />
              <path d={svgPaths.p3c494b00} fill="#002A3A" id="Vector_10" />
            </g>
          </svg>
        </div>
      </motion.div>

      {/* Slides Container */}
      <div className="flex-1 relative w-full h-full">
        <AnimatePresence mode="wait">
          {visible && (
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 w-full h-full"
            >
              {React.createElement(slides[currentSlide].component)}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Arrows */}
        {slides.length > 1 && (
          <div className="absolute bottom-[8%] right-[10%] z-20 flex gap-2 items-center">
            <button
              onClick={goToPrev}
              className="w-[32px] h-[32px] rounded-full border border-black/20 bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors duration-200"
              aria-label="Previous slide"
            >
              <FontAwesomeIcon name="chevronLeft" className="text-xs text-black" />
            </button>
            <button
              onClick={goToNext}
              className="w-[32px] h-[32px] rounded-full border border-black/20 bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors duration-200"
              aria-label="Next slide"
            >
              <FontAwesomeIcon name="chevronRight" className="text-xs text-black" />
            </button>
          </div>
        )}

        {/* Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 20 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="absolute bottom-[8%] left-[10%] z-20 flex gap-2 items-center"
        >
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => setCurrentSlide(index)}
              className={`relative overflow-hidden transition-all duration-300 ${
                currentSlide === index
                  ? "w-[24px] h-[6px] rounded-full border border-black box-border bg-transparent"
                  : "w-[6px] h-[6px] rounded-full border border-black box-border bg-transparent"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            >
              {currentSlide === index && (
                <div
                  className="absolute inset-0 bg-black rounded-full transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              )}
            </button>
          ))}
        </motion.div>
      </div>
    </div>
  );
};