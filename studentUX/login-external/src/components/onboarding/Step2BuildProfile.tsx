import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, FileText, User, Mail, MapPin, GraduationCap, Building2, Stethoscope, ChevronDown, Info } from 'lucide-react';
import type { OnboardingData } from '../OnboardingFlow';
import ExxatPrismLogo from '../../imports/ExxatPrismLogo';
import svgPaths from '../../imports/svg-q8kyfz1snj';

interface Step2Props {
  onNext: (data: Partial<OnboardingData>) => void;
  onBack: () => void;
  initialData: OnboardingData;
}

type ProfileSource = 'prism' | 'upload' | 'later';
type FlowState = 'selection' | 'permission' | 'importing' | 'complete';

export default function Step2BuildProfile({ onNext, onBack, initialData }: Step2Props) {
  const [selectedSource, setSelectedSource] = useState<ProfileSource | null>(initialData.profileSource || null);
  const [flowState, setFlowState] = useState<FlowState>('selection');
  const [importProgress, setImportProgress] = useState(0);
  const [prismAccount] = useState('sarah.chen@school.edu');

  // Simulate import progress
  useEffect(() => {
    if (flowState === 'importing') {
      const interval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              // Move to next step after import completes
              onNext({ profileSource: selectedSource || 'prism' });
            }, 500);
            return 100;
          }
          return prev + 2;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [flowState, selectedSource, onNext]);

  const handleSourceSelect = (source: ProfileSource) => {
    setSelectedSource(source);
    if (source === 'prism') {
      setFlowState('permission');
    }
  };

  const handleAllowAccess = () => {
    setFlowState('importing');
    setImportProgress(0);
  };

  const handleCancelPermission = () => {
    setFlowState('selection');
    setSelectedSource(null);
  };

  const handleNext = () => {
    if (selectedSource && selectedSource !== 'prism') {
      onNext({ profileSource: selectedSource });
    }
  };

  const dataCategories = [
    { icon: User, label: 'Personal Information', sublabel: 'Name, pronouns, profile photo' },
    { icon: Mail, label: 'Contact Details', sublabel: 'Email address, phone number' },
    { icon: MapPin, label: 'Address Information', sublabel: 'Current address, permanent address' },
    { icon: GraduationCap, label: 'Education History', sublabel: 'Schools, degrees, graduation dates, GPA' },
    { icon: Building2, label: 'Clinical Experience', sublabel: 'Hospital affiliations, clinical rotations, hours' },
    { icon: Stethoscope, label: 'Professional Summary', sublabel: 'Skills, certifications, career preferences' },
  ];

  const progressWidth = flowState === 'importing' ? `${33 + (importProgress / 100) * 33}%` : '66%';

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{
      backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 1280 812\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'1\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(129.45 97.4 -80.275 106.69 367 220)\\'><stop stop-color=\\'rgba(255,255,255,1)\\' offset=\\'0.052885\\'/><stop stop-color=\\'rgba(253,249,241,1)\\' offset=\\'1\\'/></radialGradient></defs></svg>')"
    }}>
      {/* Background texture */}
      <div className="absolute bg-[rgba(247,247,247,0.2)] inset-0" />

      {/* Gradient line effect */}
      <div className="absolute h-0 left-[calc(25%+80px)] top-[267px] w-[480px]">
        <div className="absolute inset-[-184px_-13.33%_-64px_-13.33%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 608 248">
            <g filter="url(#filter0_f)" id="Line 5">
              <line stroke="url(#paint0_linear)" strokeOpacity="0.2" strokeWidth="120" x1="64" x2="544" y1="124" y2="124" />
            </g>
            <defs>
              <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="248" id="filter0_f" width="608" x="0" y="0">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
                <feGaussianBlur result="effect1_foregroundBlur" stdDeviation="32" />
              </filter>
              <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear" x1="64" x2="544" y1="184.5" y2="184.5">
                <stop stopColor="#F93C94" />
                <stop offset="0.5" stopColor="#FFDA46" />
                <stop offset="1" stopColor="#37AAFF" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Progress Header */}
      <div className="absolute left-1/2 top-[24px] -translate-x-1/2 w-[768px] flex flex-col gap-[12px]">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-['Inter'] font-semibold text-[16px] leading-[24px] text-[#101828] tracking-[-0.3125px]">
              Step 2 of 3
            </p>
            <p className="font-['Inter'] font-normal text-[14px] leading-[20px] text-[#4a5565] tracking-[-0.1504px]">
              Build Your Profile
            </p>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="bg-gray-200 h-[8px] rounded-full relative overflow-hidden">
          <motion.div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#fc52a1] to-[#f3d45b] rounded-full"
            initial={{ width: '33%' }}
            animate={{ width: progressWidth }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Title */}
      <p className="absolute font-['Inter'] font-bold leading-[1.2] left-[calc(16.67%+42.67px)] text-[#101828] text-[20px] top-[112px] tracking-[-0.2px] w-[768px]">
        ⚡ Nice work! Now choose the fastest way to complete your profile
      </p>

      {/* Main Content Area */}
      <div className="absolute h-[564px] left-[calc(16.67%+42.67px)] overflow-clip top-[160px] w-[768px]">
        <AnimatePresence mode="wait">
          {flowState === 'selection' && (
            <motion.div
              key="selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute left-1/2 top-[50%] -translate-x-1/2 -translate-y-1/2 w-[640px]"
            >
              {/* Choice Cards */}
              <div className="flex flex-col gap-[16px]">
                {/* Prism Import */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  onClick={() => handleSourceSelect('prism')}
                  className="bg-white/98 shadow-sm rounded-[16px] text-left transition-all relative hover:shadow-lg hover:scale-[1.02] hover:bg-white cursor-pointer"
                >
                  {selectedSource === 'prism' && (
                    <div className="absolute border-2 border-[#39393c] border-solid inset-0 pointer-events-none rounded-[16px]" />
                  )}
                  <div className="flex flex-col justify-center size-full">
                    <div className="flex flex-col items-start justify-center p-[16px] w-full">
                      {/* Top Part - Badge */}
                      <div className="flex items-start justify-end w-full">
                        <div className="bg-[#00a63e] flex items-center px-[6px] py-[3px] rounded-[4px]">
                          <p className="font-['Inter'] font-medium leading-[1.2] text-[10px] text-white">Recommended</p>
                        </div>
                      </div>
                      
                      {/* Prism Intro */}
                      <div className="flex gap-[40px] items-center w-full">
                        {/* Prism Logo */}
                        <div className="relative shrink-0 w-[120px] h-[80px]">
                          <div className="absolute h-[32px] left-1/2 top-[calc(50%-0.5px)] translate-x-[-50%] translate-y-[-50%] w-[110px]">
                            <ExxatPrismLogo />
                          </div>
                        </div>
                        
                        {/* Text Content */}
                        <div className="flex flex-col gap-[16px] items-start text-black flex-1">
                          <p className="font-['Inter'] font-semibold leading-[0.6] text-[16px]">PRISM Knows Me Best</p>
                          <p className="font-['Inter'] font-normal leading-[20px] text-[12px]">Let your Prism profile fill in the details Super quick, super accurate</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.button>

                {/* Resume Upload */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  onClick={() => handleSourceSelect('upload')}
                  className="bg-white/98 shadow-sm h-[130px] rounded-[16px] text-left transition-all relative hover:shadow-lg hover:scale-[1.02] hover:bg-white cursor-pointer"
                >
                  {selectedSource === 'upload' && (
                    <div className="absolute border-2 border-[#39393c] border-solid inset-0 pointer-events-none rounded-[16px]" />
                  )}
                  <div className="flex flex-col justify-center size-full">
                    <div className="flex flex-col h-[130px] items-start justify-center p-[16px] w-full">
                      {/* Top Part - Badge */}
                      <div className="flex items-start justify-end w-full">
                        <div className="bg-[#9ba600] flex items-center px-[6px] py-[3px] rounded-[4px]">
                          <p className="font-['Inter'] font-medium leading-[1.2] text-[10px] text-white">For Early Adopters</p>
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="flex gap-[40px] items-center w-full">
                        {/* Icon */}
                        <div className="relative shrink-0 w-[120px] h-[80px]">
                          <div className="absolute left-1/2 size-[48px] top-1/2 translate-x-[-50%] translate-y-[-50%]">
                            <FileText className="w-[48px] h-[48px] text-black" strokeWidth={1.9} />
                          </div>
                        </div>
                        
                        {/* Text Content */}
                        <div className="flex flex-col gap-[16px] items-start text-black flex-1">
                          <div className="font-['Inter'] font-semibold leading-[0.6] text-[16px]">
                            <p className="mb-[16px]">Autofill from your resume or</p>
                            <p>LinkedIn profile PDF!</p>
                          </div>
                          <p className="font-['Inter'] font-normal leading-[20px] text-[12px]">Upload your info from your resume or LinkedIn PDF export</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.button>

                {/* Do Later */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  onClick={() => handleSourceSelect('later')}
                  className="bg-white/98 shadow-sm h-[130px] rounded-[16px] text-left transition-all relative hover:shadow-lg hover:scale-[1.02] hover:bg-white cursor-pointer"
                >
                  {selectedSource === 'later' && (
                    <div className="absolute border-2 border-[#39393c] border-solid inset-0 pointer-events-none rounded-[16px]" />
                  )}
                  <div className="flex flex-col justify-center size-full">
                    <div className="flex flex-col h-[130px] items-start justify-center p-[16px] w-full">
                      {/* Top Part - Empty for this card */}
                      <div className="flex items-start justify-end" />
                      
                      {/* Content */}
                      <div className="flex gap-[40px] items-center w-full">
                        {/* Icon */}
                        <div className="relative shrink-0 w-[120px] h-[80px]">
                          <div className="absolute left-1/2 size-[48px] top-1/2 translate-x-[-50%] translate-y-[-50%]">
                            <span className="text-[48px]">😰</span>
                          </div>
                        </div>
                        
                        {/* Text Content */}
                        <div className="flex flex-col gap-[16px] items-start text-black flex-1">
                          <p className="font-['Inter'] font-semibold leading-[0.6] text-[16px]">I'll do later</p>
                          <p className="font-['Inter'] font-normal leading-[20px] text-[12px]">You could totally miss 3,490 job opportunities!</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          )}

          {flowState === 'permission' && (
            <motion.div
              key="permission"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute bg-[rgba(253,253,253,0.4)] flex flex-col gap-[32px] items-start left-1/2 p-[16px] rounded-[16px] top-[calc(50%+12px)] translate-x-[-50%] translate-y-[-50%] w-[480px]"
            >
              {/* Header with logo */}
              <div className="flex gap-[24px] items-center w-full">
                <div className="overflow-clip shrink-0 size-[80px]">
                  <div className="h-[32px] relative left-1/2 top-[calc(50%-0.5px)] translate-x-[-50%] translate-y-[-50%] w-[74px]">
                    <ExxatPrismLogo />
                  </div>
                </div>
                <div className="basis-0 flex flex-col gap-[4px] grow items-start min-h-px min-w-px text-black">
                  <p className="font-['Inter'] font-semibold leading-[24px] text-[16px] w-full">PRISM Knows Me Best</p>
                  <p className="font-['Inter'] font-normal leading-[20px] text-[14px] w-full">Let your Prism profile fill in the details Super quick, super accurate</p>
                </div>
              </div>

              {/* Import Details Card */}
              <div className="flex flex-col items-start w-full">
                <div className="bg-white relative rounded-[8px] shrink-0 w-full border border-[#eaeaeb]">
                  <div className="flex flex-col gap-[24px] items-start p-[16px] w-full">
                    {/* Product Logos */}
                    <div className="flex gap-[12px] items-center">
                      <div className="bg-zinc-100 h-[24px] overflow-clip rounded-[4px] shrink-0 w-[64px]">
                        <div className="h-[12.541px] relative left-1/2 top-[calc(50%+0.27px)] translate-x-[-50%] translate-y-[-50%] w-[58px]">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 58 13">
                            <g>
                              <path d={svgPaths.p1c3ed400} fill="#263340" />
                              <path d={svgPaths.p17622400} fill="#263340" />
                              <path d={svgPaths.p373a7a00} fill="#263340" />
                              <path d={svgPaths.p9e6a180} fill="#263340" />
                              <path d={svgPaths.p19557340} fill="#263340" />
                              <path d={svgPaths.p185180} fill="#E31C79" />
                              <path d={svgPaths.p31ae9f00} fill="#E31C79" />
                              <path d={svgPaths.p14a5ed00} fill="#E31C79" />
                              <path d={svgPaths.p2e885000} fill="#E31C79" />
                              <path d={svgPaths.p181ebb00} fill="#E31C79" />
                              <path d={svgPaths.p2a8cdb00} fill="#E31C79" />
                            </g>
                          </svg>
                        </div>
                      </div>
                      <div className="shrink-0 size-[16px]">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11 12">
                          <g clipPath="url(#clip0_arrow)">
                            <path d={svgPaths.p2c317b80} fill="black" />
                          </g>
                          <defs>
                            <clipPath id="clip0_arrow">
                              <rect fill="white" height="12" width="10.5" />
                            </clipPath>
                          </defs>
                        </svg>
                      </div>
                      <div className="bg-zinc-100 h-[24px] overflow-clip rounded-[4px] shrink-0 w-[64px]">
                        <div className="h-[14px] relative left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] w-[56px]">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 56 14">
                            <g>
                              <path d={svgPaths.p1ad193f2} fill="#E31C79" />
                              <path d={svgPaths.p134c1680} fill="#E31C79" />
                              <path d={svgPaths.p2eea3600} fill="#E31C79" />
                              <path d={svgPaths.p9f84880} fill="#263340" />
                              <path d={svgPaths.p3629c700} fill="#263340" />
                              <path d={svgPaths.p31962580} fill="#263340" />
                              <path d={svgPaths.pda59780} fill="#263340" />
                              <path d={svgPaths.p396c3000} fill="#263340" />
                            </g>
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Title */}
                    <div className="flex flex-col gap-[4px] items-start text-black text-center text-nowrap w-full whitespace-pre">
                      <p className="font-['Inter'] font-semibold leading-[24px] text-[16px]">Import from Prism</p>
                      <p className="font-['Inter'] font-normal leading-[20px] text-[14px]">Exxat One wants to access your PRISM account</p>
                    </div>

                    {/* Data categories icons */}
                    <div className="flex flex-col gap-[8px] items-start w-full">
                      <div className="flex gap-[12px] items-center">
                        {dataCategories.map((category, idx) => (
                          <category.icon key={idx} className="w-[24px] h-[24px] text-[#8C8C92]" />
                        ))}
                      </div>
                      <div className="font-['Inter'] font-normal leading-[16px] text-[12px] text-black w-full">
                        <p>Personal Information, Contact Details, Address Information, Education History, Clinical Experience and Professional Summary</p>
                        <p className="underline cursor-pointer">View full list</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Banner */}
                <div className="bg-[#dcf2fc] min-h-[40px] rounded-[8px] mt-[12px] w-full">
                  <div className="flex items-start gap-[12px] p-[12px]">
                    <Info className="w-[16px] h-[16px] text-[#1086bd] shrink-0" />
                    <p className="font-['Inter'] font-normal leading-[16px] text-[#074c6b] text-[12px]">
                      By proceeding, you consent to the transfer of your data from PRISM to Exxat One, ensuring a seamless integration of your information into our platform.
                    </p>
                  </div>
                </div>

                {/* Connected Account Dropdown */}
                <div className="bg-zinc-100 rounded-[8px] mt-[12px] w-full">
                  <div className="flex gap-[4px] items-center px-[16px] py-[12px]">
                    <div className="basis-0 flex flex-col gap-[4px] grow items-start leading-[16px] text-center">
                      <p className="font-['Inter'] font-normal text-[#545454] text-[12px] tracking-[0.18px] w-full">Connected Account</p>
                      <p className="font-['Inter'] font-medium text-[14px] text-black w-full">{prismAccount}</p>
                    </div>
                    <ChevronDown className="w-[16px] h-[16px] text-black shrink-0" />
                  </div>
                </div>
              </div>

              {/* Green checkmark positioned absolutely */}
              <div className="absolute left-[448px] size-[24px] top-[8px]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                  <g>
                    <path d={svgPaths.pd88e880} fill="#088A48" />
                  </g>
                </svg>
              </div>
            </motion.div>
          )}

          {flowState === 'importing' && (
            <motion.div
              key="importing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute bg-[rgba(253,253,253,0.4)] flex flex-col gap-[32px] items-start left-1/2 p-[16px] rounded-[16px] top-1/2 translate-x-[-50%] translate-y-[-50%] w-[480px]"
            >
              {/* Header with logo */}
              <div className="flex gap-[24px] items-center w-full">
                <div className="overflow-clip shrink-0 size-[80px]">
                  <div className="h-[32px] relative left-1/2 top-[calc(50%-0.5px)] translate-x-[-50%] translate-y-[-50%] w-[74px]">
                    <ExxatPrismLogo />
                  </div>
                </div>
                <div className="basis-0 flex flex-col gap-[4px] grow items-start min-h-px min-w-px text-black">
                  <p className="font-['Inter'] font-semibold leading-[24px] text-[16px] w-full">PRISM Knows Me Best</p>
                  <p className="font-['Inter'] font-normal leading-[20px] text-[14px] w-full">Let your Prism profile fill in the details Super quick, super accurate</p>
                </div>
              </div>

              {/* Import Progress Card */}
              <div className="flex flex-col items-start w-full">
                <div className="bg-white relative rounded-[8px] shrink-0 w-full border border-[#eaeaeb]">
                  <div className="flex flex-col gap-[24px] items-start p-[16px] w-full">
                    {/* Loader */}
                    <div className="overflow-clip shrink-0 size-[48px]">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="size-full relative"
                      >
                        <div className="absolute bg-[#2d63eb] inset-[8.33%_45.83%_66.67%_45.83%] rounded-[100px]" />
                        <div className="absolute bg-[#dae4fb] inset-[66.67%_45.83%_8.33%_45.83%] rounded-[100px]" />
                        <div className="absolute flex inset-[17.59%_17.59%_58.84%_58.84%] items-center justify-center">
                          <div className="flex-none h-[12px] rotate-[45deg] w-[4px]">
                            <div className="bg-[#b1c5f7] rounded-[100px] size-full" />
                          </div>
                        </div>
                        <div className="absolute flex inset-[58.84%_58.84%_17.59%_17.59%] items-center justify-center">
                          <div className="flex-none h-[12px] rotate-[45deg] w-[4px]">
                            <div className="bg-[#dae4fb] rounded-[100px] size-full" />
                          </div>
                        </div>
                        <div className="absolute flex inset-[45.83%_66.67%_45.83%_8.33%] items-center justify-center">
                          <div className="flex-none h-[12px] rotate-[270deg] w-[4px]">
                            <div className="bg-[#b1c5f7] rounded-[100px] size-full" />
                          </div>
                        </div>
                        <div className="absolute flex inset-[45.83%_8.33%_45.83%_66.67%] items-center justify-center">
                          <div className="flex-none h-[12px] rotate-[270deg] w-[4px]">
                            <div className="bg-[#b1c5f7] rounded-[100px] size-full" />
                          </div>
                        </div>
                        <div className="absolute flex inset-[17.59%_58.84%_58.84%_17.59%] items-center justify-center">
                          <div className="flex-none h-[12px] rotate-[315deg] w-[4px]">
                            <div className="bg-[#b1c5f7] rounded-[100px] size-full" />
                          </div>
                        </div>
                        <div className="absolute flex inset-[58.84%_17.59%_17.59%_58.84%] items-center justify-center">
                          <div className="flex-none h-[12px] rotate-[315deg] w-[4px]">
                            <div className="bg-[#dae4fb] rounded-[100px] size-full" />
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {/* Title */}
                    <div className="flex flex-col gap-[4px] items-start text-black text-nowrap whitespace-pre">
                      <p className="font-['Inter'] font-semibold leading-[24px] text-[16px]">Importing from Prism</p>
                      <p className="font-['Inter'] font-normal leading-[20px] text-[14px]">We are securely importing your profile data</p>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full">
                      <div className="flex flex-col gap-[2px] items-start p-[2px] w-full">
                        <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start w-full">
                          <div className="[grid-area:1_/_1] bg-zinc-100 h-[8px] ml-0 mt-0 rounded-[128px] w-[412px]" />
                          <motion.div
                            className="[grid-area:1_/_1] bg-black h-[8px] ml-0 mt-0 rounded-[128px]"
                            initial={{ width: '0px' }}
                            animate={{ width: `${(importProgress / 100) * 412}px` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <div className="flex items-start justify-between w-full h-[34px]">
                          <div className="flex flex-col justify-center leading-[0]">
                            <p className="font-['Inter'] font-medium leading-[16px] text-[12px] text-black tracking-[-0.08px]">
                              Completed {importProgress}%
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Data categories icons */}
                    <div className="flex flex-col gap-[8px] items-start w-full">
                      <div className="flex gap-[12px] items-center">
                        {dataCategories.map((category, idx) => (
                          <category.icon key={idx} className="w-[24px] h-[24px] text-[#8C8C92]" />
                        ))}
                      </div>
                      <div className="font-['Inter'] font-normal leading-[16px] text-[#727279] text-[12px] w-full">
                        <p>Personal Information, Contact Details, Address Information, Education History, Clinical Experience and Professional Summary</p>
                        <p className="underline cursor-pointer">View full list</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Banner */}
                <div className="bg-[#dcf2fc] min-h-[40px] rounded-[8px] mt-[12px] w-full">
                  <div className="flex items-start gap-[12px] p-[12px]">
                    <Info className="w-[16px] h-[16px] text-[#1086bd] shrink-0" />
                    <p className="font-['Inter'] font-normal leading-[16px] text-[#074c6b] text-[12px]">
                      Please refrain from closing or navigating away while we retrieve the information.
                    </p>
                  </div>
                </div>
              </div>

              {/* Green checkmark positioned absolutely */}
              <div className="absolute left-[448px] size-[24px] top-[8px]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                  <g>
                    <path d={svgPaths.pd88e880} fill="#088A48" />
                  </g>
                </svg>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      {flowState === 'selection' && (
        <div className="absolute bottom-[32px] left-1/2 -translate-x-1/2 flex items-center gap-[16px]">
          <button
            onClick={onBack}
            className="px-[24px] py-[12px] rounded-[4px] font-['Inter'] font-medium text-[14px] text-black text-center border border-[#8c8c92] hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={!selectedSource}
            className={`px-[32px] py-[14px] rounded-[4px] font-['Inter'] font-medium text-[14px] text-white transition-all flex items-center gap-[8px] ${
              selectedSource
                ? 'bg-[#39393c] hover:bg-[#39393c]/90 cursor-pointer'
                : 'bg-[#39393c]/40 cursor-not-allowed'
            }`}
          >
            Next
            <svg className="w-[16px] h-[16px]" fill="none" preserveAspectRatio="none" viewBox="0 0 11 12">
              <g clipPath="url(#clip0_next)">
                <path d={svgPaths.p2c317b80} fill="white" />
              </g>
              <defs>
                <clipPath id="clip0_next">
                  <rect fill="white" height="12" width="10.5" />
                </clipPath>
              </defs>
            </svg>
          </button>
        </div>
      )}

      {flowState === 'permission' && (
        <div className="absolute bottom-[32px] left-1/2 -translate-x-1/2 flex items-center gap-[16px]">
          <button
            onClick={handleCancelPermission}
            className="px-[24px] py-[12px] rounded-[4px] font-['Inter'] font-medium text-[14px] text-black text-center border border-[#8c8c92] hover:bg-gray-50 transition-colors w-[96px]"
          >
            Back
          </button>
          <button
            onClick={handleAllowAccess}
            className="bg-[#39393c] px-[32px] py-[14px] rounded-[4px] font-['Inter'] font-medium text-[14px] text-white hover:bg-[#39393c]/90 transition-all flex items-center gap-[8px] w-[272px] justify-center"
          >
            Next
            <svg className="w-[16px] h-[16px]" fill="none" preserveAspectRatio="none" viewBox="0 0 11 12">
              <g clipPath="url(#clip0_allow)">
                <path d={svgPaths.p2c317b80} fill="white" />
              </g>
              <defs>
                <clipPath id="clip0_allow">
                  <rect fill="white" height="12" width="10.5" />
                </clipPath>
              </defs>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
