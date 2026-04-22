import svgPaths from "./svg-ct1fcmyqov";
import { exxatPrismLogo as imgExxatPrismWordmarkLogoWithMinClearSpace2 } from "../assets/images";

function LinkedinBoxFill() {
  return (
    <div className="overflow-clip relative shrink-0 size-[80px]" data-name="linkedin-box-fill">
      <div className="absolute h-[32px] left-1/2 top-[calc(50%-0.5px)] translate-x-[-50%] translate-y-[-50%] w-[74px]" data-name="ExxatPrism_WordmarkLogo_WithMinClearSpace 2">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img alt="" className="absolute h-full left-[-96.22%] max-w-none top-0 w-[197.31%]" src={imgExxatPrismWordmarkLogoWithMinClearSpace2} />
        </div>
      </div>
    </div>
  );
}

function Frame4() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[4px] grow items-start min-h-px min-w-px not-italic relative shrink-0 text-black">
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[24px] relative shrink-0 text-[16px] w-full">PRISM Knows Me Best</p>
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[20px] relative shrink-0 text-[14px] w-full">Let your Prism profile fill in the details Super quick, super accurate</p>
    </div>
  );
}

function Frame5() {
  return (
    <div className="content-stretch flex gap-[24px] items-center relative shrink-0 w-full">
      <LinkedinBoxFill />
      <Frame4 />
    </div>
  );
}

function Loader() {
  return (
    <div className="overflow-clip relative shrink-0 size-[48px]" data-name="Loader 4">
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
    </div>
  );
}

function Frame6() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start not-italic relative shrink-0 text-black text-nowrap whitespace-pre">
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[24px] relative shrink-0 text-[16px]">Importing from Prism</p>
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[20px] relative shrink-0 text-[14px]">We are securely importing your profile data</p>
    </div>
  );
}

function Group() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0 w-full">
      <div className="[grid-area:1_/_1] bg-zinc-100 h-[8px] ml-0 mt-0 rounded-[128px] w-[412px]" />
      <div className="[grid-area:1_/_1] bg-black h-[8px] ml-0 mt-0 rounded-[128px] w-[173.986px]" />
    </div>
  );
}

function Frame1() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[2px] grow h-[34px] items-start justify-center min-h-px min-w-px relative shrink-0">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black tracking-[-0.08px] w-full">
        <p className="leading-[16px]">Completed 45%</p>
      </div>
    </div>
  );
}

function Frame2() {
  return <div className="content-stretch flex flex-col h-[34px] items-start justify-center shrink-0" />;
}

function Frame3() {
  return (
    <div className="content-stretch flex items-start justify-between relative shrink-0 w-full">
      <Frame1 />
      <Frame2 />
    </div>
  );
}

function ProgressBar() {
  return (
    <div className="relative shrink-0 w-full" data-name="Progress bar">
      <div className="size-full">
        <div className="content-stretch flex flex-col gap-[2px] items-start p-[2px] relative w-full">
          <Group />
          <Frame3 />
        </div>
      </div>
    </div>
  );
}

function User() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="user">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="user">
          <path d={svgPaths.pe129f00} fill="var(--fill-0, #8C8C92)" id="Primary" />
        </g>
      </svg>
    </div>
  );
}

function PaperPlane() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="paper-plane">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="paper-plane">
          <path d={svgPaths.p390e4b80} fill="var(--fill-0, #8C8C92)" id="Primary" />
        </g>
      </svg>
    </div>
  );
}

function LocationSmile() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="location-smile">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="location-smile">
          <path d={svgPaths.p1cc1dd00} fill="var(--fill-0, #8C8C92)" id="Primary" />
        </g>
      </svg>
    </div>
  );
}

function GraduationCap() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="graduation-cap">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="graduation-cap">
          <path d={svgPaths.p27998270} fill="var(--fill-0, #8C8C92)" id="Primary" />
        </g>
      </svg>
    </div>
  );
}

function BuildingMemo() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="building-memo">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="building-memo">
          <path d={svgPaths.p1e9a1c00} fill="var(--fill-0, #8C8C92)" id="Primary" />
        </g>
      </svg>
    </div>
  );
}

function Stethoscope() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="stethoscope">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="stethoscope">
          <path d={svgPaths.p11090670} fill="var(--fill-0, #8C8C92)" id="Primary" />
        </g>
      </svg>
    </div>
  );
}

function Frame9() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0">
      <User />
      <PaperPlane />
      <LocationSmile />
      <GraduationCap />
      <BuildingMemo />
      <Stethoscope />
    </div>
  );
}

function Frame7() {
  return (
    <div className="content-stretch flex flex-col font-['Inter:Regular',sans-serif] font-normal gap-[4px] items-start justify-center leading-[16px] not-italic relative shrink-0 text-[#727279] text-[12px] w-full">
      <p className="relative shrink-0 w-full">Personal Information, Contact Details, Address Information, Education History, Clinical Experience and Professional Summary</p>
      <p className="[text-underline-position:from-font] decoration-solid relative shrink-0 underline w-full">View full list</p>
    </div>
  );
}

function Frame12() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
      <Frame9 />
      <Frame7 />
    </div>
  );
}

function Frame8() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full">
      <div aria-hidden="true" className="absolute border border-[#eaeaeb] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="size-full">
        <div className="content-stretch flex flex-col gap-[24px] items-start p-[16px] relative w-full">
          <Loader />
          <Frame6 />
          <ProgressBar />
          <Frame12 />
        </div>
      </div>
    </div>
  );
}

function Frame10() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
      <Frame8 />
    </div>
  );
}

function Frame11() {
  return (
    <div className="content-stretch flex flex-col items-center relative shrink-0 w-full">
      <Frame10 />
    </div>
  );
}

function CircleInfo() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="circle-info">
      <div className="absolute aspect-[16/16] bottom-[-0.3px] flex flex-col font-['Font_Awesome_6_Pro:Solid',sans-serif] justify-center leading-[0] left-1/2 not-italic text-[#1086bd] text-[14px] text-center top-[0.3px] translate-x-[-50%]">
        <p className="leading-[16px]">circle-info</p>
      </div>
    </div>
  );
}

function LeadingIcon() {
  return (
    <div className="content-stretch flex items-start relative self-stretch shrink-0" data-name="Leading Icon">
      <CircleInfo />
    </div>
  );
}

function Content() {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Content">
      <div className="basis-0 flex flex-col font-['Inter:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#074c6b] text-[12px]">
        <p className="leading-[16px]">Please refrain from closing or navigating away while we retrieve the information.</p>
      </div>
    </div>
  );
}

function Text() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[2px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Text">
      <Content />
    </div>
  );
}

function MainContent() {
  return (
    <div className="basis-0 content-stretch flex gap-[12px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Main Content">
      <LeadingIcon />
      <Text />
    </div>
  );
}

function Banner() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name="Banner">
      <MainContent />
    </div>
  );
}

function Banner1() {
  return (
    <div className="bg-[#dcf2fc] min-h-[40px] relative rounded-[8px] shrink-0 w-full" data-name="Banner">
      <div className="min-h-[inherit] overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col items-start min-h-[inherit] p-[12px] relative w-full">
          <Banner />
        </div>
      </div>
    </div>
  );
}

function CircleCheck() {
  return (
    <div className="absolute left-[448px] size-[24px] top-[8px]" data-name="circle-check">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="circle-check">
          <path d={svgPaths.pd88e880} fill="var(--fill-0, #088A48)" id="Primary" />
        </g>
      </svg>
    </div>
  );
}

function Frame() {
  return (
    <div className="absolute bg-[rgba(253,253,253,0.4)] content-stretch flex flex-col gap-[32px] items-start left-1/2 p-[16px] rounded-[16px] top-1/2 translate-x-[-50%] translate-y-[-50%] w-[480px]">
      <Frame5 />
      <Frame11 />
      <Banner1 />
      <CircleCheck />
    </div>
  );
}

function FormContainer() {
  return (
    <div className="absolute h-[564px] left-[calc(16.67%+42.67px)] overflow-clip top-[160px] w-[768px]" data-name="Form container">
      <Frame />
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
  return <div className="bg-gradient-to-r from-[#fc52a1] from-[68.688%] h-[8px] rounded-[1.67772e+07px] shrink-0 to-[#f3d45b] to-[128.59%] w-[692px]" data-name="Container" />;
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

export default function Step24Of() {
  return (
    <div className="relative size-full" data-name="Step 2.4 of 4" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\\'0 0 1280 812\\\' xmlns=\\\'http://www.w3.org/2000/svg\\\' preserveAspectRatio=\\\'none\\\'><rect x=\\\'0\\\' y=\\\'0\\\' height=\\\'100%\\\' width=\\\'100%\\\' fill=\\\'url(%23grad)\\\' opacity=\\\'1\\\'/><defs><radialGradient id=\\\'grad\\\' gradientUnits=\\\'userSpaceOnUse\\\' cx=\\\'0\\\' cy=\\\'0\\\' r=\\\'10\\\' gradientTransform=\\\'matrix(129.45 97.4 -80.275 106.69 367 220)\\\'><stop stop-color=\\\'rgba(255,255,255,1)\\\' offset=\\\'0.052885\\\'/><stop stop-color=\\\'rgba(253,249,241,1)\\\' offset=\\\'1\\\'/></radialGradient></defs></svg>')" }}>
      <div className="absolute bg-[rgba(247,247,247,0.2)] h-[812px] left-0 top-1/2 translate-y-[-50%] w-[1280px]" data-name="Background texture" />
      <div className="absolute h-0 left-[calc(25%+80px)] top-[267px] w-[480px]">
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
    </div>
  );
}