import { motion } from 'motion/react';
import ExxatOneLogo from '../imports/ExxatOneLogo';
import ExxatPrismLogo from '../imports/ExxatPrismLogo';
import svgPaths from "../imports/svg-cuj25j8ag6";

interface GettingStartedScreenProps {
  onGetStarted: () => void;
  onSkipToHomepage?: () => void;
  product?: 'prism' | 'one';
  userName?: string;
}

// Logo Frame
function LogoFrame({ isPrism }: { isPrism: boolean }) {
  return (
    <div className="absolute content-stretch flex items-center left-[32px] top-[22px]">
      <div className="w-[111px] h-[28px]">
        {isPrism ? <ExxatPrismLogo /> : <ExxatOneLogo />}
      </div>
    </div>
  );
}

// Product Name Display
function Group() {
  return (
    <div className="absolute bottom-0 left-0 right-[44.08%] top-[3.11%]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 103 31">
        <g id="Group 2">
          <path d={svgPaths.p27079980} fill="var(--fill-0, #263340)" id="Vector" />
          <path d={svgPaths.p382c700} fill="var(--fill-0, #263340)" id="Vector_2" />
          <path d={svgPaths.p3eb3d400} fill="var(--fill-0, #263340)" id="Vector_3" />
          <path d={svgPaths.p13de6000} fill="var(--fill-0, #263340)" id="Vector_4" />
          <path d={svgPaths.pcdcab00} fill="var(--fill-0, #263340)" id="Vector_5" />
        </g>
      </svg>
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute bottom-0 left-[60.27%] right-0 top-0">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 73 31">
        <g id="Group 3">
          <path d={svgPaths.p32e6d880} fill="var(--fill-0, #E31C79)" id="Vector" />
          <path d={svgPaths.p28d0f00} fill="var(--fill-0, #E31C79)" id="Vector_2" />
          <path d={svgPaths.p3138d600} fill="var(--fill-0, #E31C79)" id="Vector_3" />
        </g>
      </svg>
    </div>
  );
}

function Frame27() {
  return (
    <div className="h-[31px] relative shrink-0 w-[183px]">
      <Group />
      <Group1 />
    </div>
  );
}

// Welcome Headline Section
function Frame29({ userName }: { userName?: string }) {
  return (
    <div className="content-stretch flex flex-col gap-[18px] items-start relative shrink-0 w-full">
      <p className="font-['Instrument_Sans:Bold',sans-serif] font-bold leading-[normal] min-w-full relative shrink-0 text-[48px] text-black tracking-[-0.08px] w-[min-content]" style={{ fontVariationSettings: "'wdth' 100" }}>
        {userName ? `Welcome, ${userName}` : 'Welcome to'}
      </p>
      {!userName && <Frame27 />}
    </div>
  );
}

// Description and Buttons Section
function Frame30({ userName }: { userName?: string }) {
  return (
    <div className="content-stretch flex flex-col gap-[39px] items-start relative shrink-0 w-[578px]">
      <Frame29 userName={userName} />
      <p className="capitalize font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[28px] not-italic relative shrink-0 text-[20px] text-black tracking-[-0.08px] w-[558px]">{`Let's set up your profile so we can help you discover the perfect clinical opportunities tailored just for you.`}</p>
    </div>
  );
}

// Button Components
function TrailingIcon() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Trailing Icon">
      <div className="absolute h-[12px] left-[2.75px] top-[2px] w-[10.5px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11 12">
          <g clipPath="url(#clip0_8021_2950)">
            <path d={svgPaths.p2c317b80} fill="var(--fill-0, white)" id="Vector" />
          </g>
          <defs>
            <clipPath id="clip0_8021_2950">
              <rect fill="white" height="12" width="10.5" />
            </clipPath>
          </defs>
        </svg>
      </div>
    </div>
  );
}

function PrimaryButton({ buttonColor, onClick }: { buttonColor: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="content-stretch flex gap-[8px] h-[48px] items-center justify-center min-w-[96px] px-[12px] py-0 relative rounded-xl shrink-0 cursor-pointer hover:opacity-90 transition-all"
      style={{ backgroundColor: buttonColor }}
    >
      <p className="capitalize font-['Inter:Medium',sans-serif] font-medium leading-[20px] not-italic relative shrink-0 text-[16px] text-center text-nowrap text-white whitespace-pre">{`Build Your Profile `}</p>
      <TrailingIcon />
    </button>
  );
}

function Frame31({ buttonColor, onGetStarted, onSkipToHomepage }: { buttonColor: string; onGetStarted: () => void; onSkipToHomepage?: () => void }) {
  return (
    <div className="content-stretch flex gap-[40px] items-center relative shrink-0 w-full">
      <PrimaryButton buttonColor={buttonColor} onClick={onGetStarted} />
      <button 
        onClick={onSkipToHomepage}
        className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[24px] not-italic relative shrink-0 text-[16px] text-black text-nowrap whitespace-pre hover:opacity-70 transition-opacity"
      >
        I'll do it later
      </button>
    </div>
  );
}

// Main Content Frame
function Frame1({ userName, buttonColor, onGetStarted, onSkipToHomepage }: { userName?: string; buttonColor: string; onGetStarted: () => void; onSkipToHomepage?: () => void }) {
  return (
    <div className="absolute content-stretch flex flex-col gap-[40px] items-start left-[calc(8.33%+63.33px)] top-[calc(50%+0.5px)] translate-y-[-50%] w-[578px]">
      <Frame30 userName={userName} />
      <Frame31 buttonColor={buttonColor} onGetStarted={onGetStarted} onSkipToHomepage={onSkipToHomepage} />
    </div>
  );
}

// Decorative Tag Components
function FaceTongueMoney() {
  return (
    <div className="relative shrink-0 size-[16px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="face-tongue-money">
          <path d={svgPaths.p176e3c80} fill="var(--fill-0, black)" id="Primary" />
        </g>
      </svg>
    </div>
  );
}

function Stethoscope() {
  return (
    <div className="relative shrink-0 size-[16px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="stethoscope">
          <path d={svgPaths.p12220180} fill="var(--fill-0, black)" id="Primary" />
        </g>
      </svg>
    </div>
  );
}

function Gem() {
  return (
    <div className="relative shrink-0 size-[16px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="gem">
          <path d={svgPaths.p29b1580} fill="var(--fill-0, black)" id="Primary" />
        </g>
      </svg>
    </div>
  );
}

function InformationLine() {
  return (
    <div className="relative shrink-0 size-[12px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g id="information-line">
          <path d={svgPaths.p2d0d7e80} fill="var(--fill-0, #888888)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Group2() {
  return (
    <div className="h-[10px] relative shrink-0 w-[23.707px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 10">
        <g id="Group 4">
          <path d={svgPaths.p1c657100} fill="var(--fill-0, #E31C79)" id="Vector" />
          <path d={svgPaths.p3e00bd80} fill="var(--fill-0, #E31C79)" id="Vector_2" />
          <path d={svgPaths.p2665fd00} fill="var(--fill-0, #E31C79)" id="Vector_3" />
        </g>
      </svg>
    </div>
  );
}

function BarProgressFull() {
  return (
    <div className="h-[16px] relative shrink-0 w-[18px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 16">
        <g id="bar-progress-full">
          <path d={svgPaths.p2a5e9c00} fill="var(--fill-0, black)" id="Primary" />
        </g>
      </svg>
    </div>
  );
}

function Seedling() {
  return (
    <div className="relative shrink-0 size-[16px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="seedling">
          <path d={svgPaths.p40771c0} fill="var(--fill-0, black)" id="Primary" />
        </g>
      </svg>
    </div>
  );
}

// Tag Components with Content
function Frame6() {
  return (
    <div className="content-stretch flex h-[24px] items-center px-[8px] py-[4px] relative rounded-[12px] shrink-0">
      <div aria-hidden="true" className="absolute border border-[#c6c6ca] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
        <FaceTongueMoney />
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[11px] text-black text-nowrap whitespace-pre">34k Yearly</p>
      </div>
    </div>
  );
}

function Frame8() {
  return (
    <div className="content-stretch flex h-[24px] items-center px-[8px] py-[4px] relative rounded-[12px] shrink-0">
      <div aria-hidden="true" className="absolute border border-[#c6c6ca] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
        <Stethoscope />
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[11px] text-black text-nowrap whitespace-pre">Outpatient</p>
      </div>
    </div>
  );
}

function Frame14() {
  return (
    <div className="content-stretch flex h-[24px] items-center px-[8px] py-[4px] relative rounded-[12px] shrink-0">
      <div aria-hidden="true" className="absolute border border-[#c6c6ca] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
        <Stethoscope />
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[11px] text-black text-nowrap whitespace-pre">Emergency Care</p>
      </div>
    </div>
  );
}

function Frame13() {
  return (
    <div className="content-stretch flex h-[24px] items-center px-[8px] py-[4px] relative rounded-[12px] shrink-0">
      <div aria-hidden="true" className="absolute border border-[#c6c6ca] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
        <Stethoscope />
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[11px] text-black text-nowrap whitespace-pre">Inpatient</p>
      </div>
    </div>
  );
}

function Frame10() {
  return (
    <div className="content-stretch flex h-[24px] items-center px-[8px] py-[4px] relative rounded-[12px] shrink-0">
      <div aria-hidden="true" className="absolute border border-[#c6c6ca] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
        <Gem />
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[11px] text-black text-nowrap whitespace-pre">75% Match</p>
        <InformationLine />
      </div>
    </div>
  );
}

function Frame15() {
  return (
    <div className="content-stretch flex h-[24px] items-center px-[8px] py-[4px] relative rounded-[12px] shrink-0">
      <div aria-hidden="true" className="absolute border border-[#c6c6ca] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
        <Stethoscope />
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[11px] text-black text-nowrap whitespace-pre">Specialty Consultation</p>
      </div>
    </div>
  );
}

function Frame11() {
  return (
    <div className="content-stretch flex h-[24px] items-center px-[8px] py-[5px] relative rounded-[12px] shrink-0">
      <div aria-hidden="true" className="absolute border border-[#c6c6ca] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <div className="content-stretch flex gap-[3px] items-center relative shrink-0">
        <Group2 />
        <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[normal] not-italic relative shrink-0 text-[#e31c79] text-[10px] text-nowrap whitespace-pre">Exclusive</p>
        <InformationLine />
      </div>
    </div>
  );
}

function Frame16() {
  return (
    <div className="content-stretch flex h-[24px] items-center px-[8px] py-[4px] relative rounded-[12px] shrink-0">
      <div aria-hidden="true" className="absolute border border-[#c6c6ca] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
        <Stethoscope />
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[11px] text-black text-nowrap whitespace-pre">Preventive Health Screening</p>
      </div>
    </div>
  );
}

function Frame17() {
  return (
    <div className="content-stretch flex h-[24px] items-center px-[8px] py-[4px] relative rounded-[12px] shrink-0">
      <div aria-hidden="true" className="absolute border border-[#c6c6ca] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
        <Stethoscope />
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[11px] text-black text-nowrap whitespace-pre">Maternity Services</p>
      </div>
    </div>
  );
}

function Frame9() {
  return (
    <div className="content-stretch flex h-[24px] items-center px-[8px] py-[4px] relative rounded-[12px] shrink-0">
      <div aria-hidden="true" className="absolute border border-[#c6c6ca] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
        <BarProgressFull />
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[11px] text-black text-nowrap whitespace-pre">Full-time</p>
      </div>
    </div>
  );
}

function Frame25() {
  return (
    <div className="content-stretch flex h-[24px] items-center px-[8px] py-[4px] relative rounded-[12px] shrink-0">
      <div aria-hidden="true" className="absolute border border-[#c6c6ca] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
        <Seedling />
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[11px] text-black text-nowrap whitespace-pre">Fresh Graduate</p>
      </div>
    </div>
  );
}

function Frame12() {
  return (
    <div className="content-stretch flex h-[24px] items-center px-[8px] py-[4px] relative rounded-[12px] shrink-0">
      <div aria-hidden="true" className="absolute border border-[#c6c6ca] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
        <FaceTongueMoney />
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[11px] text-black text-nowrap whitespace-pre">200k Yearly</p>
      </div>
    </div>
  );
}

// Decorative Tags Container
function Frame28() {
  return (
    <div className="absolute content-start flex flex-wrap gap-[24px] h-[261px] items-start justify-end left-[calc(87.5%+0.5px)] opacity-40 top-[calc(50%+22.5px)] translate-x-[-50%] translate-y-[-50%] w-[389px]">
      <Frame6 />
      <Frame8 />
      <Frame14 />
      <Frame13 />
      <Frame10 />
      <Frame15 />
      <Frame11 />
      <Frame16 />
      <Frame17 />
      {[...Array(2).keys()].map((_, i) => (
        <Frame9 key={i} />
      ))}
      <Frame25 />
      <Frame12 />
    </div>
  );
}

export default function GettingStartedScreen({ 
  onGetStarted, 
  onSkipToHomepage,
  product = 'one',
  userName 
}: GettingStartedScreenProps) {
  const isPrism = product === 'prism';
  const buttonColor = isPrism ? '#3F51B5' : '#39393c';
  
  return (
    <div className="relative size-full" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 1280 812\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'1\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(129.45 97.4 -80.275 106.69 367 220)\\'><stop stop-color=\\'rgba(255,255,255,1)\\' offset=\\'0.052885\\'/><stop stop-color=\\'rgba(253,249,241,1)\\' offset=\\'1\\'/></radialGradient></defs></svg>')" }}>
      <div className="absolute inset-[44.46%_37.87%_45.94%_37.97%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
          <g id="Vector"></g>
        </svg>
      </div>
      <LogoFrame isPrism={isPrism} />
      <Frame1 userName={userName} buttonColor={buttonColor} onGetStarted={onGetStarted} onSkipToHomepage={onSkipToHomepage} />
      <Frame28 />
      <p className="absolute font-['Inter:Black',sans-serif] font-black leading-[normal] left-[calc(37.5%-310px)] not-italic text-[48px] text-black top-[689px] tracking-[-0.08px] w-[527px]">🎓🚀 ✨</p>
      <div className="absolute bg-white h-[651px] left-[calc(100%+404px)] rounded-[24px] shadow-[0px_4px_2px_0px_rgba(0,0,0,0.07),0px_0px_20px_0px_rgba(0,0,0,0.15)] top-[87px] translate-x-[-50%] w-[896px]" />
    </div>
  );
}