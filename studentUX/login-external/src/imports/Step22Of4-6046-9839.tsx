import svgPaths from "./svg-bvagxa5ebd";
import { exxatPrismLogo as imgExxatPrismWordmarkLogoWithMinClearSpace2 } from "../assets/images";

function Frame4() {
  return (
    <div className="bg-[#00a63e] content-stretch flex items-center px-[6px] py-[3px] relative rounded-[4px] shrink-0">
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.2] not-italic relative shrink-0 text-[10px] text-nowrap text-white whitespace-pre">Recommended</p>
    </div>
  );
}

function TopPart() {
  return (
    <div className="content-stretch flex items-start justify-end relative shrink-0 w-full" data-name="Top Part">
      <Frame4 />
    </div>
  );
}

function PrismLogo() {
  return (
    <div className="overflow-clip relative shrink-0 size-[80px]" data-name="Prism Logo">
      <div className="absolute h-[32px] left-1/2 top-[calc(50%-0.5px)] translate-x-[-50%] translate-y-[-50%] w-[74px]" data-name="ExxatPrism_WordmarkLogo_WithMinClearSpace 2">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img alt="" className="absolute h-full left-[-96.22%] max-w-none top-0 w-[197.31%]" src={imgExxatPrismWordmarkLogoWithMinClearSpace2} />
        </div>
      </div>
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start not-italic relative shrink-0 text-black w-[282px]">
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[0.6] relative shrink-0 text-[16px] text-nowrap whitespace-pre">PRISM Knows Me Best</p>
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[20px] relative shrink-0 text-[12px] w-[344px]">Let your Prism profile fill in the details Super quick, super accurate</p>
    </div>
  );
}

function PrismIntro() {
  return (
    <div className="content-stretch flex gap-[24px] items-center relative shrink-0 w-full" data-name="Prism Intro">
      <PrismLogo />
      <Frame2 />
    </div>
  );
}

function PrismFillCard() {
  return (
    <div className="bg-white relative rounded-[16px] shrink-0 w-full" data-name="Prism Fill Card">
      <div aria-hidden="true" className="absolute border-2 border-[#39393c] border-solid inset-0 pointer-events-none rounded-[16px]" />
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[16px] relative w-full">
          <TopPart />
          <PrismIntro />
        </div>
      </div>
    </div>
  );
}

function Frame5() {
  return (
    <div className="bg-[#9ba600] content-stretch flex items-center px-[6px] py-[3px] relative rounded-[4px] shrink-0">
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.2] not-italic relative shrink-0 text-[10px] text-nowrap text-white whitespace-pre">For Early Adopters</p>
    </div>
  );
}

function TopPart1() {
  return (
    <div className="content-stretch flex items-start justify-end relative shrink-0 w-full" data-name="Top Part">
      <Frame5 />
    </div>
  );
}

function Icon() {
  return (
    <div className="absolute left-1/2 size-[48px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 48 48">
        <g id="Icon">
          <path d={svgPaths.p17ebc200} id="Vector" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" />
          <path d={svgPaths.p35679780} id="Vector_2" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" />
          <path d="M20.7508 19.1257H17.5012" id="Vector_3" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" />
          <path d="M30.4996 25.6248H17.5012" id="Vector_4" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" />
          <path d="M30.4996 32.124H17.5012" id="Vector_5" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" />
        </g>
      </svg>
    </div>
  );
}

function LinkedinBoxFill() {
  return (
    <div className="overflow-clip relative shrink-0 size-[80px]" data-name="linkedin-box-fill">
      <Icon />
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start not-italic relative shrink-0 text-black w-[282px]">
      <div className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[0.6] relative shrink-0 text-[16px] w-[344px]">
        <p className="mb-[16px]">Autofill from your resume or</p>
        <p>LinkedIn profile PDF!</p>
      </div>
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[20px] relative shrink-0 text-[12px] w-[344px]">Upload your info from your resume or LinkedIn PDF export</p>
    </div>
  );
}

function PrismIntro1() {
  return (
    <div className="content-stretch flex gap-[24px] items-center relative shrink-0 w-full" data-name="Prism Intro">
      <LinkedinBoxFill />
      <Frame1 />
    </div>
  );
}

function AutoFillCard() {
  return (
    <div className="bg-white h-[130px] relative rounded-[16px] shrink-0 w-full" data-name="Auto Fill Card">
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col h-[130px] items-start justify-center p-[16px] relative w-full">
          <TopPart1 />
          <PrismIntro1 />
        </div>
      </div>
    </div>
  );
}

function TopPart2() {
  return <div className="content-stretch flex items-start justify-end shrink-0 w-full" data-name="Top Part" />;
}

function FaceAnxiousSweat() {
  return (
    <div className="absolute left-1/2 size-[48px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="face-anxious-sweat">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 48 48">
        <g id="face-anxious-sweat">
          <path d={svgPaths.p3d4533f0} fill="var(--fill-0, black)" id="Primary" />
        </g>
      </svg>
    </div>
  );
}

function LinkedinBoxFill1() {
  return (
    <div className="overflow-clip relative shrink-0 size-[80px]" data-name="linkedin-box-fill">
      <FaceAnxiousSweat />
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start not-italic relative shrink-0 text-black w-[282px]">
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[0.6] relative shrink-0 text-[16px] w-[344px]">I’ll do later</p>
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[20px] relative shrink-0 text-[12px] w-[344px]">You could totally miss 3,490 job opportunities!</p>
    </div>
  );
}

function PrismIntro2() {
  return (
    <div className="content-stretch flex gap-[24px] items-center relative shrink-0 w-full" data-name="Prism Intro">
      <LinkedinBoxFill1 />
      <Frame3 />
    </div>
  );
}

function DoItLaterCard() {
  return (
    <div className="bg-white h-[130px] relative rounded-[16px] shrink-0 w-full" data-name="Do it later Card">
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col h-[130px] items-start justify-center p-[16px] relative w-full">
          <TopPart2 />
          <PrismIntro2 />
        </div>
      </div>
    </div>
  );
}

function Frame6() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[16px] items-start left-[144px] top-1/2 translate-y-[-50%] w-[480px]">
      <PrismFillCard />
      <AutoFillCard />
      <DoItLaterCard />
    </div>
  );
}

function FormContainer() {
  return (
    <div className="absolute h-[470px] left-[calc(16.67%+42.67px)] overflow-clip top-[calc(50%-11px)] translate-y-[-50%] w-[768px]" data-name="Form container">
      <Frame6 />
    </div>
  );
}

function Heading() {
  return (
    <div className="h-[24px] relative shrink-0 w-full" data-name="Heading 2">
      <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[24px] left-0 not-italic text-[#101828] text-[16px] top-[-0.5px] tracking-[-0.3125px] w-[114px]">Step 2 of 3</p>
    </div>
  );
}

function Paragraph() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-0 not-italic text-[#4a5565] text-[14px] text-nowrap top-[0.5px] tracking-[-0.1504px] whitespace-pre">Build Your Profile</p>
    </div>
  );
}

function Container() {
  return (
    <div className="h-[44px] relative shrink-0 w-[191.063px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col h-[44px] items-start relative w-[191.063px]">
        <Heading />
        <Paragraph />
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="content-stretch flex h-[44px] items-center justify-between relative shrink-0 w-full" data-name="Container">
      <Container />
    </div>
  );
}

function Container2() {
  return <div className="bg-gradient-to-r from-[#fc52a1] from-[68.688%] h-[8px] rounded-[1.67772e+07px] shrink-0 to-[#f3d45b] to-[128.59%] w-[512px]" data-name="Container" />;
}

function Container3() {
  return (
    <div className="bg-gray-200 h-[8px] relative rounded-[1.67772e+07px] shrink-0 w-full" data-name="Container">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col h-[8px] items-start pl-0 pr-[614.406px] py-0 relative w-full">
          <Container2 />
        </div>
      </div>
    </div>
  );
}

function Container4() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[12px] h-[64px] items-start left-1/2 top-[24px] translate-x-[-50%] w-[768px]" data-name="Container">
      <Container1 />
      <Container3 />
    </div>
  );
}

function Button() {
  return (
    <div className="content-stretch flex gap-[8px] h-[40px] items-center justify-center min-w-[96px] px-[12px] py-0 relative rounded-[4px] shrink-0 w-[96px]" data-name="Button">
      <div aria-hidden="true" className="absolute border border-[#8c8c92] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <p className="capitalize font-['Inter:Medium',sans-serif] font-medium leading-[20px] not-italic relative shrink-0 text-[14px] text-black text-center text-nowrap whitespace-pre">Back</p>
    </div>
  );
}

function Frame() {
  return (
    <div className="absolute h-[12px] left-[2.75px] top-[2px] w-[10.5px]" data-name="Frame">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11 12">
        <g clipPath="url(#clip0_6043_1721)" id="Frame">
          <path d={svgPaths.p2c317b80} fill="var(--fill-0, white)" id="Vector" />
        </g>
        <defs>
          <clipPath id="clip0_6043_1721">
            <rect fill="white" height="12" width="10.5" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function TrailingIcon() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Trailing Icon">
      <Frame />
    </div>
  );
}

function Button1() {
  return (
    <div className="bg-[#39393c] content-stretch flex gap-[8px] h-[40px] items-center justify-center min-w-[96px] px-[12px] py-0 relative rounded-[4px] shrink-0 w-[272px]" data-name="Button">
      <p className="capitalize font-['Inter:Medium',sans-serif] font-medium leading-[20px] not-italic relative shrink-0 text-[14px] text-center text-nowrap text-white whitespace-pre">Next</p>
      <TrailingIcon />
    </div>
  );
}

function Frame7() {
  return (
    <div className="absolute content-stretch flex gap-[16px] items-center left-1/2 top-[654px] translate-x-[-50%]">
      <Button />
      <Button1 />
    </div>
  );
}

export default function Step22Of() {
  return (
    <div className="relative size-full" data-name="Step 2.2 of 4" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\\'0 0 1280 812\\\' xmlns=\\\'http://www.w3.org/2000/svg\\\' preserveAspectRatio=\\\'none\\\'><rect x=\\\'0\\\' y=\\\'0\\\' height=\\\'100%\\\' width=\\\'100%\\\' fill=\\\'url(%23grad)\\\' opacity=\\\'1\\\'/><defs><radialGradient id=\\\'grad\\\' gradientUnits=\\\'userSpaceOnUse\\\' cx=\\\'0\\\' cy=\\\'0\\\' r=\\\'10\\\' gradientTransform=\\\'matrix(129.45 97.4 -80.275 106.69 367 220)\\\'><stop stop-color=\\\'rgba(255,255,255,1)\\\' offset=\\\'0.052885\\\'/><stop stop-color=\\\'rgba(253,249,241,1)\\\' offset=\\\'1\\\'/></radialGradient></defs></svg>')" }}>
      <div className="absolute bg-[rgba(247,247,247,0.2)] h-[812px] left-0 top-1/2 translate-y-[-50%] w-[1280px]" data-name="Background texture" />
      <div className="absolute h-0 left-[calc(25%+80px)] top-[337px] w-[480px]">
        <div className="absolute inset-[-184px_-13.33%_-64px_-13.33%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 608 248">
            <g filter="url(#filter0_f_6043_4788)" id="Line 5">
              <line stroke="url(#paint0_linear_6043_4788)" strokeOpacity="0.2" strokeWidth="120" x1="64" x2="544" y1="124" y2="124" />
            </g>
            <defs>
              <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="248" id="filter0_f_6043_4788" width="608" x="0" y="0">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
                <feGaussianBlur result="effect1_foregroundBlur_6043_4788" stdDeviation="32" />
              </filter>
              <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_6043_4788" x1="64" x2="544" y1="184.5" y2="184.5">
                <stop stopColor="#F93C94" />
                <stop offset="0.5" stopColor="#FFDA46" />
                <stop offset="1" stopColor="#37AAFF" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
      <FormContainer />
      <Container4 />
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[1.2] left-[calc(16.67%+42.67px)] not-italic text-[#101828] text-[20px] top-[112px] tracking-[-0.2px] w-[768px]">⚡ Nice work! Now choose the fastest way to complete your profile</p>
      <Frame7 />
    </div>
  );
}