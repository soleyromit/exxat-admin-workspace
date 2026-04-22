import svgPaths from "./svg-3treexqcvs";
import { userProfileImage as imgUsersProfilePicWithAClaymationStyle } from "../assets/images";

function Heading() {
  return (
    <div className="h-[24px] relative shrink-0 w-full" data-name="Heading 2">
      <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[24px] left-0 not-italic text-[#101828] text-[16px] top-[-0.5px] tracking-[-0.3125px] w-[114px]">Step 3 of 3</p>
    </div>
  );
}

function Paragraph() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-0 not-italic text-[#4a5565] text-[14px] text-nowrap top-[0.5px] tracking-[-0.1504px] whitespace-pre">Review Your Profile</p>
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
  return <div className="bg-gradient-to-r from-[#01582c] from-[26.432%] h-[8px] rounded-[1.67772e+07px] shrink-0 to-[#585401] w-[768px]" data-name="Container" />;
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

function Button() {
  return (
    <div className="bg-[#39393c] content-stretch flex gap-[8px] h-[40px] items-center justify-center min-w-[96px] px-[12px] py-0 relative rounded-[4px] shrink-0 w-[272px]" data-name="Button">
      <p className="capitalize font-['Inter:Medium',sans-serif] font-medium leading-[20px] not-italic relative shrink-0 text-[14px] text-center text-nowrap text-white whitespace-pre">Explore Exxat One</p>
      <TrailingIcon />
    </div>
  );
}

function Frame25() {
  return (
    <div className="absolute content-stretch flex items-center left-1/2 top-[921px] translate-x-[-50%]">
      <Button />
    </div>
  );
}

function Frame22() {
  return (
    <div className="absolute content-stretch flex items-start justify-center left-1/2 top-[16px] translate-x-[-50%] w-[416px]">
      <div className="relative shrink-0 size-[65px]" data-name="User’s profile pic, with a claymation style">
        <img alt="" className="block max-w-none size-full" height="65" src={imgUsersProfilePicWithAClaymationStyle} width="65" />
      </div>
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex gap-[8px] items-center not-italic relative shrink-0">
      <p className="capitalize font-['Inter:Bold',sans-serif] font-bold leading-[28px] relative shrink-0 text-[20px] text-black text-nowrap tracking-[-0.08px] whitespace-pre">Sarah Chen</p>
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[28px] justify-center leading-[0] relative shrink-0 text-[#545454] text-[12px] tracking-[0.18px] w-[44px]">
        <p className="leading-[16px]">He/Him</p>
      </div>
    </div>
  );
}

function GraduationCapLine() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="graduation-cap-line">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="graduation-cap-line">
          <path d={svgPaths.p2466bf00} fill="var(--fill-0, #545454)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame4() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <GraduationCapLine />
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[#545454] text-[12px] text-nowrap whitespace-pre">{`Doctor of Physical Therapy (DPT)  •`}</p>
    </div>
  );
}

function SchoolLine() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="school-line">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="school-line">
          <path d={svgPaths.p3f265600} fill="var(--fill-0, #545454)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame5() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <SchoolLine />
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[#545454] text-[12px] text-nowrap whitespace-pre">University of Southern California</p>
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <Frame4 />
      <Frame5 />
    </div>
  );
}

function Frame23() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[8px] items-center left-1/2 top-[105px] translate-x-[-50%] w-[444px]">
      <Frame2 />
      <Frame3 />
    </div>
  );
}

function Frame7() {
  return (
    <div className="basis-0 bg-zinc-100 content-stretch flex flex-col grow h-[8px] items-start min-h-px min-w-px relative rounded-[48px] shrink-0">
      <div aria-hidden="true" className="absolute border border-[#c6c6ca] border-solid inset-0 pointer-events-none rounded-[48px]" />
      <div className="bg-gradient-to-r from-[#fc52a1] from-[68.688%] h-[8px] rounded-[1.67772e+07px] shrink-0 to-[#f3d45b] to-[128.59%] w-[238px]" />
    </div>
  );
}

function Frame8() {
  return (
    <div className="content-stretch flex gap-[12px] items-center justify-end relative shrink-0 w-full">
      <Frame7 />
      <p className="capitalize font-['Inter:Regular',sans-serif] font-normal leading-[16px] not-italic relative shrink-0 text-[12px] text-black text-nowrap whitespace-pre">75% completed</p>
    </div>
  );
}

function Frame24() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-1/2 top-[181px] translate-x-[-50%] w-[444px]">
      <Frame8 />
    </div>
  );
}

function User() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="user">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="user">
          <path d={svgPaths.pe129f00} fill="var(--fill-0, black)" id="Primary" />
        </g>
      </svg>
    </div>
  );
}

function Frame10() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[4px] grow items-start leading-[16px] min-h-px min-w-px not-italic relative shrink-0 text-[12px]">
      <p className="capitalize font-['Inter:Medium',sans-serif] font-medium relative shrink-0 text-black w-full">Personal Information</p>
      <p className="font-['Inter:Regular',sans-serif] font-normal relative shrink-0 text-[#727279] w-full">Name, pronouns, profile photo</p>
    </div>
  );
}

function Check() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="check">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="check">
          <path d={svgPaths.p2c489430} fill="var(--fill-0, #088A48)" id="Primary" />
        </g>
      </svg>
    </div>
  );
}

function Frame9() {
  return (
    <div className="relative rounded-[8px] shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[12px] items-center px-[8px] py-[12px] relative w-full">
          <User />
          <Frame10 />
          <Check />
        </div>
      </div>
    </div>
  );
}

function PaperPlane() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="paper-plane">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="paper-plane">
          <path d={svgPaths.p390e4b80} fill="var(--fill-0, black)" id="Primary" />
        </g>
      </svg>
    </div>
  );
}

function Frame15() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[4px] grow items-start leading-[16px] min-h-px min-w-px not-italic relative shrink-0 text-[12px]">
      <p className="capitalize font-['Inter:Medium',sans-serif] font-medium relative shrink-0 text-black w-full">Contact Details</p>
      <p className="font-['Inter:Regular',sans-serif] font-normal relative shrink-0 text-[#727279] w-full">Email address, phone number</p>
    </div>
  );
}

function Check1() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="check">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="check">
          <path d={svgPaths.p2c489430} fill="var(--fill-0, #088A48)" id="Primary" />
        </g>
      </svg>
    </div>
  );
}

function Frame16() {
  return (
    <div className="relative rounded-[8px] shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[12px] items-center px-[8px] py-[12px] relative w-full">
          <PaperPlane />
          <Frame15 />
          <Check1 />
        </div>
      </div>
    </div>
  );
}

function LocationSmile() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="location-smile">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="location-smile">
          <path d={svgPaths.p1cc1dd00} fill="var(--fill-0, black)" id="Primary" />
        </g>
      </svg>
    </div>
  );
}

function Frame17() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[4px] grow items-start leading-[16px] min-h-px min-w-px not-italic relative shrink-0 text-[12px]">
      <p className="capitalize font-['Inter:Medium',sans-serif] font-medium relative shrink-0 text-black w-full">Address Information</p>
      <p className="font-['Inter:Regular',sans-serif] font-normal relative shrink-0 text-[#727279] w-full">Current address, permanent address</p>
    </div>
  );
}

function Check2() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="check">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="check">
          <path d={svgPaths.p2c489430} fill="var(--fill-0, #088A48)" id="Primary" />
        </g>
      </svg>
    </div>
  );
}

function Frame11() {
  return (
    <div className="relative rounded-[8px] shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[12px] items-center px-[8px] py-[12px] relative w-full">
          <LocationSmile />
          <Frame17 />
          <Check2 />
        </div>
      </div>
    </div>
  );
}

function GraduationCap() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="graduation-cap">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="graduation-cap">
          <path d={svgPaths.p27998270} fill="var(--fill-0, black)" id="Primary" />
        </g>
      </svg>
    </div>
  );
}

function Frame18() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[4px] grow items-start leading-[16px] min-h-px min-w-px not-italic relative shrink-0 text-[12px]">
      <p className="capitalize font-['Inter:Medium',sans-serif] font-medium relative shrink-0 text-black w-full">Education History</p>
      <p className="font-['Inter:Regular',sans-serif] font-normal relative shrink-0 text-[#727279] w-full">Schools, degrees, graduation dates, GPA</p>
    </div>
  );
}

function Check3() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="check">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="check">
          <path d={svgPaths.p2c489430} fill="var(--fill-0, #088A48)" id="Primary" />
        </g>
      </svg>
    </div>
  );
}

function Frame12() {
  return (
    <div className="relative rounded-[8px] shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[12px] items-center px-[8px] py-[12px] relative w-full">
          <GraduationCap />
          <Frame18 />
          <Check3 />
        </div>
      </div>
    </div>
  );
}

function BuildingMemo() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="building-memo">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="building-memo">
          <path d={svgPaths.p1e9a1c00} fill="var(--fill-0, black)" id="Primary" />
        </g>
      </svg>
    </div>
  );
}

function Frame19() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[4px] grow items-start leading-[16px] min-h-px min-w-px not-italic relative shrink-0 text-[12px]">
      <p className="capitalize font-['Inter:Medium',sans-serif] font-medium relative shrink-0 text-black w-full">Clinical Experience</p>
      <p className="font-['Inter:Regular',sans-serif] font-normal relative shrink-0 text-[#727279] w-full">Hospital affiliations, clinical rotations, hours</p>
    </div>
  );
}

function Check4() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="check">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="check">
          <path d={svgPaths.p2c489430} fill="var(--fill-0, #088A48)" id="Primary" />
        </g>
      </svg>
    </div>
  );
}

function Frame13() {
  return (
    <div className="relative rounded-[8px] shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[12px] items-center px-[8px] py-[12px] relative w-full">
          <BuildingMemo />
          <Frame19 />
          <Check4 />
        </div>
      </div>
    </div>
  );
}

function Stethoscope() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="stethoscope">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="stethoscope">
          <path d={svgPaths.p11090670} fill="var(--fill-0, black)" id="Primary" />
        </g>
      </svg>
    </div>
  );
}

function Frame20() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[4px] grow items-start leading-[16px] min-h-px min-w-px not-italic relative shrink-0 text-[12px]">
      <p className="capitalize font-['Inter:Medium',sans-serif] font-medium relative shrink-0 text-black w-full">Professional Summary</p>
      <p className="font-['Inter:Regular',sans-serif] font-normal relative shrink-0 text-[#727279] w-full">Skills, certifications, career preferences</p>
    </div>
  );
}

function Check5() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="check">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="check">
          <path d={svgPaths.p2c489430} fill="var(--fill-0, #088A48)" id="Primary" />
        </g>
      </svg>
    </div>
  );
}

function Frame14() {
  return (
    <div className="relative rounded-[8px] shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[12px] items-center px-[8px] py-[12px] relative w-full">
          <Stethoscope />
          <Frame20 />
          <Check5 />
        </div>
      </div>
    </div>
  );
}

function Frame21() {
  return (
    <div className="absolute bg-white content-stretch flex flex-col items-start left-[32px] p-[16px] rounded-[8px] top-[213px] w-[416px]">
      <div aria-hidden="true" className="absolute border border-[#eaeaeb] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <Frame9 />
      <Frame16 />
      <Frame11 />
      <Frame12 />
      <Frame13 />
      <Frame14 />
    </div>
  );
}

function Button1() {
  return (
    <div className="absolute content-stretch flex gap-[8px] h-[40px] items-center justify-center left-[32px] min-w-[96px] px-[12px] py-0 rounded-[4px] top-[629px] w-[416px]" data-name="Button">
      <div aria-hidden="true" className="absolute border border-[#8c8c92] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <p className="capitalize font-['Inter:Medium',sans-serif] font-medium leading-[20px] not-italic relative shrink-0 text-[14px] text-black text-center text-nowrap whitespace-pre">Review Details</p>
    </div>
  );
}

function Frame26() {
  return (
    <div className="absolute bg-[#fcfcfc] h-[693px] left-1/2 overflow-clip rounded-[16px] top-[160px] translate-x-[-50%] w-[480px]">
      <Frame22 />
      <Frame23 />
      <Frame24 />
      <Frame21 />
      <Button1 />
    </div>
  );
}

function Frame1() {
  return (
    <div className="absolute left-1/2 size-[20px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Frame">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g clipPath="url(#clip0_6043_5988)" id="Frame">
          <path d={svgPaths.p158f6a40} fill="url(#paint0_linear_6043_5988)" id="Vector" />
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_6043_5988" x1="1.81047" x2="15.917" y1="6.36411" y2="-4.12284">
            <stop stopColor="#F86FAF" />
            <stop offset="0.342178" stopColor="#F7B8A1" />
            <stop offset="0.671945" stopColor="#EDDB92" />
            <stop offset="1" stopColor="#A4D2F4" />
          </linearGradient>
          <clipPath id="clip0_6043_5988">
            <rect fill="white" height="20" width="20" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function HeaderIcons() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="header_icons">
      <Frame1 />
    </div>
  );
}

function Frame6() {
  return (
    <div className="absolute content-stretch flex gap-[8px] items-center left-1/2 top-[877px] translate-x-[-50%] w-[480px]">
      <HeaderIcons />
      <p className="basis-0 font-['Inter:Regular',sans-serif] font-normal grow leading-[normal] min-h-px min-w-px not-italic relative shrink-0 text-[#545454] text-[14px]">Hey! We spotted 12,000+ job openings that you might dig</p>
    </div>
  );
}

export default function Step3Of() {
  return (
    <div className="relative size-full" data-name="Step 3 of 4" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\\'0 0 1280 1013\\\' xmlns=\\\'http://www.w3.org/2000/svg\\\' preserveAspectRatio=\\\'none\\\'><rect x=\\\'0\\\' y=\\\'0\\\' height=\\\'100%\\\' width=\\\'100%\\\' fill=\\\'url(%23grad)\\\' opacity=\\\'1\\\'/><defs><radialGradient id=\\\'grad\\\' gradientUnits=\\\'userSpaceOnUse\\\' cx=\\\'0\\\' cy=\\\'0\\\' r=\\\'10\\\' gradientTransform=\\\'matrix(129.45 121.51 -80.275 133.1 367 274.46)\\\'><stop stop-color=\\\'rgba(255,255,255,1)\\\' offset=\\\'0.052885\\\'/><stop stop-color=\\\'rgba(253,249,241,1)\\\' offset=\\\'1\\\'/></radialGradient></defs></svg>')" }}>
      <div className="absolute bg-[rgba(247,247,247,0.2)] h-[1017px] left-0 top-1/2 translate-y-[-50%] w-[1280px]" data-name="Background texture" />
      <Container4 />
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[1.2] left-[calc(16.67%+42.67px)] not-italic text-[#101828] text-[20px] top-[112px] tracking-[-0.2px] w-[768px]">{`✅ You're all set, Sarah! Profile imported successfully`}</p>
      <Frame25 />
      <Frame26 />
      <Frame6 />
    </div>
  );
}