import { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, User, Mail, MapPin, GraduationCap, Building2, Stethoscope } from 'lucide-react';
import type { OnboardingData } from '../OnboardingFlow';
import svgPaths from '../../imports/svg-3treexqcvs';
import { userProfileImage as imgUserProfile } from '../../assets/images';

interface Step3Props {
  onNext: () => void;
  onBack: () => void;
  data: OnboardingData;
  userName?: string;
}

export default function Step3Review({ onNext, data, userName = 'Sarah Chen' }: Step3Props) {
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const completionPercentage = 75;

  const profileData = {
    name: 'Sarah Chen',
    pronouns: 'He/Him',
    degree: 'Doctor of Physical Therapy (DPT)',
    school: 'University of Southern California',
  };

  const checklistItems = [
    { icon: User, label: 'Personal Information', sublabel: 'Name, pronouns, profile photo', completed: true },
    { icon: Mail, label: 'Contact Details', sublabel: 'Email address, phone number', completed: true },
    { icon: MapPin, label: 'Address Information', sublabel: 'Current address, permanent address', completed: true },
    { icon: GraduationCap, label: 'Education History', sublabel: 'Schools, degrees, graduation dates, GPA', completed: true },
    { icon: Building2, label: 'Clinical Experience', sublabel: 'Hospital affiliations, clinical rotations, hours', completed: true },
    { icon: Stethoscope, label: 'Professional Summary', sublabel: 'Skills, certifications, career preferences', completed: true },
  ];

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{
      backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 1280 1013\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'1\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(129.45 121.51 -80.275 133.1 367 274.46)\\'><stop stop-color=\\'rgba(255,255,255,1)\\' offset=\\'0.052885\\'/><stop stop-color=\\'rgba(253,249,241,1)\\' offset=\\'1\\'/></radialGradient></defs></svg>')"
    }}>
      {/* Background texture */}
      <div className="absolute bg-[rgba(247,247,247,0.2)] inset-0" />

      {/* Progress Header */}
      <div className="absolute left-1/2 top-[24px] -translate-x-1/2 w-[768px] flex flex-col gap-[12px]">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-['Inter'] font-semibold text-[16px] leading-[24px] text-[#101828] tracking-[-0.3125px]">
              Step 3 of 3
            </p>
            <p className="font-['Inter'] font-normal text-[14px] leading-[20px] text-[#4a5565] tracking-[-0.1504px]">
              Review Your Profile
            </p>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="bg-gray-200 h-[8px] rounded-full relative overflow-hidden">
          <motion.div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#01582c] from-[26.432%] to-[#585401] rounded-full"
            initial={{ width: '66%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />
        </div>
      </div>

      {/* Title */}
      <p className="absolute font-['Inter'] font-bold leading-[1.2] left-[calc(16.67%+42.67px)] text-[#101828] text-[20px] top-[112px] tracking-[-0.2px] w-[768px]">
        ✅ You're all set, Sarah! Profile imported successfully
      </p>

      {/* Main Content - Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="absolute bg-[#fcfcfc] h-[693px] left-1/2 overflow-clip rounded-[16px] top-[160px] translate-x-[-50%] w-[480px]"
      >
        {/* Profile Picture */}
        <div className="absolute flex items-start justify-center left-1/2 top-[16px] translate-x-[-50%] w-[416px]">
          <div className="shrink-0 size-[65px]">
            <img alt="" className="block max-w-none size-full rounded-full" height="65" src={imgUserProfile} width="65" />
          </div>
        </div>

        {/* Name and Info */}
        <div className="absolute flex flex-col gap-[8px] items-center left-1/2 top-[105px] translate-x-[-50%] w-[444px]">
          <div className="flex gap-[8px] items-center">
            <p className="capitalize font-['Inter'] font-bold leading-[28px] shrink-0 text-[20px] text-black text-nowrap tracking-[-0.08px] whitespace-pre">
              {profileData.name}
            </p>
            <div className="flex flex-col font-['Inter'] font-normal h-[28px] justify-center leading-[0] shrink-0 text-[#545454] text-[12px] tracking-[0.18px] w-[44px]">
              <p className="leading-[16px]">{profileData.pronouns}</p>
            </div>
          </div>
          <div className="flex gap-[8px] items-center">
            <div className="flex gap-[8px] items-center">
              <div className="shrink-0 size-[16px]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                  <path d={svgPaths.p2466bf00} fill="#545454" />
                </svg>
              </div>
              <p className="font-['Inter'] font-normal leading-[normal] text-[#545454] text-[12px] text-nowrap whitespace-pre">
                {profileData.degree}  •
              </p>
            </div>
            <div className="flex gap-[8px] items-center">
              <div className="shrink-0 size-[16px]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                  <path d={svgPaths.p3f265600} fill="#545454" />
                </svg>
              </div>
              <p className="font-['Inter'] font-normal leading-[normal] text-[#545454] text-[12px] text-nowrap whitespace-pre">
                {profileData.school}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="absolute flex flex-col items-start left-1/2 top-[181px] translate-x-[-50%] w-[444px]">
          <div className="flex gap-[12px] items-center justify-end w-full">
            <div className="basis-0 bg-zinc-100 flex flex-col grow h-[8px] items-start min-h-px min-w-px rounded-[48px] border border-[#c6c6ca] relative">
              <div className="bg-gradient-to-r from-[#fc52a1] from-[68.688%] h-[8px] rounded-full shrink-0 to-[#f3d45b] to-[128.59%] w-[238px]" />
            </div>
            <p className="capitalize font-['Inter'] font-normal leading-[16px] shrink-0 text-[12px] text-black text-nowrap whitespace-pre">
              {completionPercentage}% completed
            </p>
          </div>
        </div>

        {/* Checklist Card */}
        <div className="absolute bg-white left-[32px] p-[16px] rounded-[8px] top-[213px] w-[416px] border border-[#eaeaeb]">
          {checklistItems.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="rounded-[8px]"
            >
              <div className="flex flex-row items-center size-full">
                <div className="flex gap-[12px] items-center px-[8px] py-[12px] w-full">
                  <item.icon className="w-[24px] h-[24px] text-black shrink-0" />
                  <div className="basis-0 flex flex-col gap-[4px] grow items-start leading-[16px] min-h-px min-w-px text-[12px]">
                    <p className="capitalize font-['Inter'] font-medium text-black w-full">
                      {item.label}
                    </p>
                    <p className="font-['Inter'] font-normal text-[#727279] w-full">
                      {item.sublabel}
                    </p>
                  </div>
                  <div className="shrink-0 size-[24px]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                      <path d={svgPaths.p2c489430} fill="#088A48" />
                    </svg>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Review Details Button */}
        <button
          onClick={() => setShowDetailsModal(true)}
          className="absolute flex gap-[8px] h-[40px] items-center justify-center left-[32px] min-w-[96px] px-[12px] py-0 rounded-[4px] top-[629px] w-[416px] border border-[#8c8c92] hover:bg-gray-50 transition-colors"
        >
          <p className="capitalize font-['Inter'] font-medium leading-[20px] shrink-0 text-[14px] text-black text-center text-nowrap whitespace-pre">
            Review Details
          </p>
        </button>
      </motion.div>

      {/* Job Preview Message */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="absolute flex gap-[8px] items-center left-1/2 top-[877px] translate-x-[-50%] w-[480px]"
      >
        <div className="shrink-0 size-[20px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
            <g clipPath="url(#clip0_star)">
              <path d={svgPaths.p158f6a40} fill="url(#paint0_linear_star)" />
            </g>
            <defs>
              <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_star" x1="1.81047" x2="15.917" y1="6.36411" y2="-4.12284">
                <stop stopColor="#F86FAF" />
                <stop offset="0.342178" stopColor="#F7B8A1" />
                <stop offset="0.671945" stopColor="#EDDB92" />
                <stop offset="1" stopColor="#A4D2F4" />
              </linearGradient>
              <clipPath id="clip0_star">
                <rect fill="white" height="20" width="20" />
              </clipPath>
            </defs>
          </svg>
        </div>
        <p className="basis-0 font-['Inter'] font-normal grow leading-[normal] min-h-px min-w-px text-[#545454] text-[14px]">
          Hey! We spotted 12,000+ job openings that you might dig
        </p>
      </motion.div>

      {/* Explore Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="absolute flex items-center left-1/2 top-[921px] translate-x-[-50%]"
      >
        <button
          onClick={onNext}
          className="bg-[#39393c] flex gap-[8px] h-[40px] items-center justify-center min-w-[96px] px-[12px] py-0 rounded-[4px] w-[272px] hover:bg-[#39393c]/90 transition-colors"
        >
          <p className="capitalize font-['Inter'] font-medium leading-[20px] shrink-0 text-[14px] text-center text-nowrap text-white whitespace-pre">
            Explore Exxat One
          </p>
          <div className="shrink-0 size-[16px]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11 12">
              <g clipPath="url(#clip0_explore)">
                <path d={svgPaths.p2c317b80} fill="white" />
              </g>
              <defs>
                <clipPath id="clip0_explore">
                  <rect fill="white" height="12" width="10.5" />
                </clipPath>
              </defs>
            </svg>
          </div>
        </button>
      </motion.div>
    </div>
  );
}