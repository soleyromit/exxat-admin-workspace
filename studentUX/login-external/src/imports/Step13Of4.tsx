import svgPaths from "./svg-m7518k35uz";

function Heading() {
  return (
    <div className="h-[24px] relative shrink-0 w-full" data-name="Heading 2">
      <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[24px] left-0 not-italic text-[#101828] text-[16px] top-[-0.5px] tracking-[-0.3125px] w-[114px]">Step 1 of 3</p>
    </div>
  );
}

function Paragraph() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-0 not-italic text-[#4a5565] text-[14px] text-nowrap top-[0.5px] tracking-[-0.1504px] whitespace-pre">{`Let's Build Your Profile`}</p>
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
  return <div className="bg-gradient-to-r from-[#fc52a1] from-[68.688%] h-[8px] rounded-[1.67772e+07px] shrink-0 to-[#f3d45b] to-[128.59%] w-[164px]" data-name="Container" />;
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

function Frame23() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[calc(16.67%+42.67px)] top-[112px] w-[768px]">
      <p className="font-['Inter:Bold',sans-serif] font-bold leading-[1.2] not-italic relative shrink-0 text-[#101828] text-[20px] tracking-[-0.2px] w-full">👋 Hello! Share a bit about yourself so we can find your perfect clinical match</p>
    </div>
  );
}

function BriefcaseMedical() {
  return (
    <div className="absolute left-1/2 size-[36px] top-[calc(50%+1.5px)] translate-x-[-50%] translate-y-[-50%]" data-name="briefcase-medical">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 36 36">
        <g id="briefcase-medical">
          <path d={svgPaths.p2ecc8880} fill="var(--fill-0, black)" id="Primary" />
        </g>
      </svg>
    </div>
  );
}

function LinkedinBoxFill() {
  return (
    <div className="bg-[rgba(255,255,255,0.3)] overflow-clip relative rounded-[8px] shrink-0 size-[64px]" data-name="linkedin-box-fill">
      <BriefcaseMedical />
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex items-center relative shrink-0">
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[14px] text-black text-nowrap whitespace-pre">{`Let's get specific about your discipline`}</p>
    </div>
  );
}

function LabelIcon() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Label + Icon">
      <Frame1 />
    </div>
  );
}

function Label() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Label">
      <LabelIcon />
    </div>
  );
}

function InputBox() {
  return (
    <div className="bg-white h-[40px] min-h-[32px] min-w-[64px] relative rounded-[4px] shrink-0 w-full" data-name="Input Box">
      <div className="flex flex-row items-center min-h-[inherit] min-w-[inherit] overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex h-[40px] items-center min-h-[inherit] min-w-[inherit] p-[12px] relative w-full">
          <div className="basis-0 flex flex-col font-['Inter:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[#cfcfcf] text-[14px] text-nowrap">
            <p className="[white-space-collapse:collapse] leading-[20px] overflow-ellipsis overflow-hidden">Type your specialization</p>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#8c8c92] border-solid inset-0 pointer-events-none rounded-[4px]" />
    </div>
  );
}

function InputFieldLabel() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="_Input field_label">
      <Label />
      <InputBox />
    </div>
  );
}

function InputField() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Input Field">
      <InputFieldLabel />
    </div>
  );
}

function Frame7() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow items-start min-h-px min-w-px relative shrink-0">
      <InputField />
    </div>
  );
}

function Frame15() {
  return (
    <div className="content-stretch flex gap-[24px] items-center relative shrink-0 w-full">
      <LinkedinBoxFill />
      <Frame7 />
    </div>
  );
}

function Frame10() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[12px] text-black text-nowrap tracking-[0.48px] whitespace-pre">Physical Therapy</p>
    </div>
  );
}

function SmallIconConfig() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Small Icon Config">
      <div className="absolute aspect-[16/16] bottom-0 flex flex-col font-['Font_Awesome_6_Pro:Light',sans-serif] justify-center leading-[0] left-1/2 not-italic text-[14px] text-black text-center top-0 translate-x-[-50%]">
        <p className="leading-[16px]">xmark</p>
      </div>
    </div>
  );
}

function IconButton() {
  return (
    <div className="content-stretch flex items-center justify-center min-h-[16px] min-w-[16px] p-[8px] relative rounded-[4px] shrink-0 size-[16px]" data-name="Icon Button">
      <SmallIconConfig />
    </div>
  );
}

function Base() {
  return (
    <div className="bg-[#dae4fb] content-stretch flex gap-[8px] items-center justify-center min-h-[24px] px-[8px] py-[4px] relative rounded-[4px] shrink-0" data-name="_Base">
      <div aria-hidden="true" className="absolute border border-[#dae4fb] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <Frame10 />
      <IconButton />
    </div>
  );
}

function NeutralBadge() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Neutral Badge">
      <Base />
    </div>
  );
}

function Frame18() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="size-full">
        <div className="content-stretch flex flex-col items-start pl-[88px] pr-0 py-0 relative w-full">
          <NeutralBadge />
        </div>
      </div>
    </div>
  );
}

function Frame5() {
  return (
    <div className="relative rounded-[16px] shrink-0 w-full">
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col gap-[16px] items-start justify-center px-[16px] py-[24px] relative w-full">
          <Frame15 />
          <Frame18 />
        </div>
      </div>
    </div>
  );
}

function Frame16() {
  return (
    <div className="content-stretch flex flex-col items-start relative rounded-[16px] shrink-0 w-full">
      <Frame5 />
    </div>
  );
}

function UserDoctorHairLong() {
  return (
    <div className="absolute left-1/2 size-[36px] top-[calc(50%+1.5px)] translate-x-[-50%] translate-y-[-50%]" data-name="user-doctor-hair-long">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 36 36">
        <g id="user-doctor-hair-long">
          <path d={svgPaths.p2273a000} fill="var(--fill-0, black)" id="Primary" />
        </g>
      </svg>
    </div>
  );
}

function LinkedinBoxFill1() {
  return (
    <div className="bg-[rgba(255,255,255,0.3)] overflow-clip relative rounded-[8px] shrink-0 size-[64px]" data-name="linkedin-box-fill">
      <UserDoctorHairLong />
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex items-center relative shrink-0">
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[14px] text-black text-nowrap whitespace-pre">Tell me the type of roles are you seeking</p>
    </div>
  );
}

function LabelIcon1() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Label + Icon">
      <Frame2 />
    </div>
  );
}

function Label1() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Label">
      <LabelIcon1 />
    </div>
  );
}

function InputBox1() {
  return (
    <div className="bg-white h-[40px] min-h-[32px] min-w-[64px] relative rounded-[4px] shrink-0 w-full" data-name="Input Box">
      <div className="flex flex-row items-center min-h-[inherit] min-w-[inherit] overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex h-[40px] items-center min-h-[inherit] min-w-[inherit] p-[12px] relative w-full">
          <div className="basis-0 flex flex-col font-['Inter:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[#cfcfcf] text-[14px] text-nowrap">
            <p className="[white-space-collapse:collapse] leading-[20px] overflow-ellipsis overflow-hidden">Type your role or title</p>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#8c8c92] border-solid inset-0 pointer-events-none rounded-[4px]" />
    </div>
  );
}

function InputFieldLabel1() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="_Input field_label">
      <Label1 />
      <InputBox1 />
    </div>
  );
}

function InputField1() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Input Field">
      <InputFieldLabel1 />
    </div>
  );
}

function Frame8() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow items-start min-h-px min-w-px relative shrink-0">
      <InputField1 />
    </div>
  );
}

function Frame20() {
  return (
    <div className="content-stretch flex gap-[24px] items-center relative shrink-0 w-full">
      <LinkedinBoxFill1 />
      <Frame8 />
    </div>
  );
}

function Frame11() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[12px] text-black text-nowrap tracking-[0.48px] whitespace-pre">Staff Physical Therapist</p>
    </div>
  );
}

function SmallIconConfig1() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Small Icon Config">
      <div className="absolute aspect-[16/16] bottom-0 flex flex-col font-['Font_Awesome_6_Pro:Light',sans-serif] justify-center leading-[0] left-1/2 not-italic text-[14px] text-black text-center top-0 translate-x-[-50%]">
        <p className="leading-[16px]">xmark</p>
      </div>
    </div>
  );
}

function IconButton1() {
  return (
    <div className="content-stretch flex items-center justify-center min-h-[16px] min-w-[16px] p-[8px] relative rounded-[4px] shrink-0 size-[16px]" data-name="Icon Button">
      <SmallIconConfig1 />
    </div>
  );
}

function Base1() {
  return (
    <div className="bg-[#dae4fb] content-stretch flex gap-[8px] items-center justify-center min-h-[24px] px-[8px] py-[4px] relative rounded-[4px] shrink-0" data-name="_Base">
      <div aria-hidden="true" className="absolute border border-[#dae4fb] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <Frame11 />
      <IconButton1 />
    </div>
  );
}

function NeutralBadge1() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Neutral Badge">
      <Base1 />
    </div>
  );
}

function Frame12() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[12px] text-black text-nowrap tracking-[0.48px] whitespace-pre">Physician Assistant</p>
    </div>
  );
}

function SmallIconConfig2() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Small Icon Config">
      <div className="absolute aspect-[16/16] bottom-0 flex flex-col font-['Font_Awesome_6_Pro:Light',sans-serif] justify-center leading-[0] left-1/2 not-italic text-[14px] text-black text-center top-0 translate-x-[-50%]">
        <p className="leading-[16px]">xmark</p>
      </div>
    </div>
  );
}

function IconButton2() {
  return (
    <div className="content-stretch flex items-center justify-center min-h-[16px] min-w-[16px] p-[8px] relative rounded-[4px] shrink-0 size-[16px]" data-name="Icon Button">
      <SmallIconConfig2 />
    </div>
  );
}

function Base2() {
  return (
    <div className="bg-[#dae4fb] content-stretch flex gap-[8px] items-center justify-center min-h-[24px] px-[8px] py-[4px] relative rounded-[4px] shrink-0" data-name="_Base">
      <div aria-hidden="true" className="absolute border border-[#dae4fb] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <Frame12 />
      <IconButton2 />
    </div>
  );
}

function NeutralBadge2() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Neutral Badge">
      <Base2 />
    </div>
  );
}

function Frame13() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[12px] text-black text-nowrap tracking-[0.48px] whitespace-pre">Integrated Mental Health Therapist</p>
    </div>
  );
}

function SmallIconConfig3() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Small Icon Config">
      <div className="absolute aspect-[16/16] bottom-0 flex flex-col font-['Font_Awesome_6_Pro:Light',sans-serif] justify-center leading-[0] left-1/2 not-italic text-[14px] text-black text-center top-0 translate-x-[-50%]">
        <p className="leading-[16px]">xmark</p>
      </div>
    </div>
  );
}

function IconButton3() {
  return (
    <div className="content-stretch flex items-center justify-center min-h-[16px] min-w-[16px] p-[8px] relative rounded-[4px] shrink-0 size-[16px]" data-name="Icon Button">
      <SmallIconConfig3 />
    </div>
  );
}

function Base3() {
  return (
    <div className="bg-[#dae4fb] content-stretch flex gap-[8px] items-center justify-center min-h-[24px] px-[8px] py-[4px] relative rounded-[4px] shrink-0" data-name="_Base">
      <div aria-hidden="true" className="absolute border border-[#dae4fb] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <Frame13 />
      <IconButton3 />
    </div>
  );
}

function NeutralBadge3() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Neutral Badge">
      <Base3 />
    </div>
  );
}

function Frame19() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="size-full">
        <div className="content-start flex flex-wrap gap-[8px] items-start pl-[88px] pr-0 py-0 relative w-full">
          <NeutralBadge1 />
          <NeutralBadge2 />
          <NeutralBadge3 />
        </div>
      </div>
    </div>
  );
}

function Frame4() {
  return (
    <div className="relative rounded-[16px] shrink-0 w-full">
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col gap-[16px] items-start justify-center px-[16px] py-[24px] relative w-full">
          <Frame20 />
          <Frame19 />
        </div>
      </div>
    </div>
  );
}

function LocationSmile() {
  return (
    <div className="absolute left-1/2 size-[36px] top-[calc(50%-0.75px)] translate-x-[-50%] translate-y-[-50%]" data-name="location-smile">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 36 36">
        <g id="location-smile">
          <path d={svgPaths.p1d713000} fill="var(--fill-0, black)" id="Primary" />
        </g>
      </svg>
    </div>
  );
}

function BriefcaseMedical1() {
  return (
    <div className="absolute left-1/2 overflow-clip size-[36px] top-[calc(50%+1.5px)] translate-x-[-50%] translate-y-[-50%]" data-name="briefcase-medical">
      <LocationSmile />
    </div>
  );
}

function LinkedinBoxFill2() {
  return (
    <div className="bg-[rgba(255,255,255,0.3)] overflow-clip relative rounded-[8px] shrink-0 size-[64px]" data-name="linkedin-box-fill">
      <BriefcaseMedical1 />
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex items-center relative shrink-0">
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[14px] text-black text-nowrap whitespace-pre">Where do you want to work?</p>
    </div>
  );
}

function LabelIcon2() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Label + Icon">
      <Frame3 />
    </div>
  );
}

function Label2() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Label">
      <LabelIcon2 />
    </div>
  );
}

function InputBox2() {
  return (
    <div className="bg-white h-[40px] min-h-[32px] min-w-[64px] relative rounded-[4px] shrink-0 w-full" data-name="Input Box">
      <div className="flex flex-row items-center min-h-[inherit] min-w-[inherit] overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex h-[40px] items-center min-h-[inherit] min-w-[inherit] p-[12px] relative w-full">
          <div className="basis-0 flex flex-col font-['Inter:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[#cfcfcf] text-[14px] text-nowrap">
            <p className="[white-space-collapse:collapse] leading-[20px] overflow-ellipsis overflow-hidden">Type your desired location of work</p>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#8c8c92] border-solid inset-0 pointer-events-none rounded-[4px]" />
    </div>
  );
}

function InputFieldLabel2() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="_Input field_label">
      <Label2 />
      <InputBox2 />
    </div>
  );
}

function InputField2() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Input Field">
      <InputFieldLabel2 />
    </div>
  );
}

function Frame9() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow items-start min-h-px min-w-px relative shrink-0">
      <InputField2 />
    </div>
  );
}

function Frame21() {
  return (
    <div className="content-stretch flex gap-[24px] items-center relative shrink-0 w-full">
      <LinkedinBoxFill2 />
      <Frame9 />
    </div>
  );
}

function Frame14() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[12px] text-black text-nowrap tracking-[0.48px] whitespace-pre">Los Angeles, CA</p>
    </div>
  );
}

function SmallIconConfig4() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Small Icon Config">
      <div className="absolute aspect-[16/16] bottom-0 flex flex-col font-['Font_Awesome_6_Pro:Light',sans-serif] justify-center leading-[0] left-1/2 not-italic text-[14px] text-black text-center top-0 translate-x-[-50%]">
        <p className="leading-[16px]">xmark</p>
      </div>
    </div>
  );
}

function IconButton4() {
  return (
    <div className="content-stretch flex items-center justify-center min-h-[16px] min-w-[16px] p-[8px] relative rounded-[4px] shrink-0 size-[16px]" data-name="Icon Button">
      <SmallIconConfig4 />
    </div>
  );
}

function Base4() {
  return (
    <div className="bg-[#dae4fb] content-stretch flex gap-[8px] items-center justify-center min-h-[24px] px-[8px] py-[4px] relative rounded-[4px] shrink-0" data-name="_Base">
      <div aria-hidden="true" className="absolute border border-[#dae4fb] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <Frame14 />
      <IconButton4 />
    </div>
  );
}

function Frame22() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="size-full">
        <div className="content-start flex flex-wrap gap-[8px] items-start pl-[88px] pr-0 py-0 relative w-full">
          <Base4 />
        </div>
      </div>
    </div>
  );
}

function Frame6() {
  return (
    <div className="relative rounded-[16px] shrink-0 w-full">
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col gap-[16px] items-start justify-center px-[16px] py-[24px] relative w-full">
          <Frame21 />
          <Frame22 />
        </div>
      </div>
    </div>
  );
}

function Frame17() {
  return (
    <div className="content-stretch flex flex-col items-start relative rounded-[16px] shrink-0 w-full">
      <Frame6 />
    </div>
  );
}

function Frame24() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[12px] items-start left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] w-[480px]">
      <Frame16 />
      <div className="h-0 relative shrink-0 w-[448px]">
        <div className="absolute bottom-0 left-0 right-0 top-[-1px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 448 1">
            <line id="Line 8" stroke="url(#paint0_linear_6043_3253)" x2="448" y1="0.5" y2="0.5" />
            <defs>
              <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_6043_3253" x1="0" x2="448" y1="1.5" y2="1.5">
                <stop stopColor="white" stopOpacity="0" />
                <stop offset="0.504808" stopColor="#E0E0E0" />
                <stop offset="1" stopColor="white" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
      <Frame4 />
      <div className="h-0 relative shrink-0 w-[448px]">
        <div className="absolute bottom-0 left-0 right-0 top-[-1px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 448 1">
            <line id="Line 8" stroke="url(#paint0_linear_6043_3253)" x2="448" y1="0.5" y2="0.5" />
            <defs>
              <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_6043_3253" x1="0" x2="448" y1="1.5" y2="1.5">
                <stop stopColor="white" stopOpacity="0" />
                <stop offset="0.504808" stopColor="#E0E0E0" />
                <stop offset="1" stopColor="white" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
      <Frame17 />
    </div>
  );
}

function FormContainer() {
  return (
    <div className="absolute bg-neutral-100 h-[536px] left-[calc(25%+80px)] overflow-clip top-[160px] w-[480px]" data-name="Form container">
      <div className="absolute h-0 left-1/2 top-[455px] translate-x-[-50%] w-[480px]" data-name="Background highlighter">
        <div className="absolute inset-[-74px_-13.33%_-64px_-13.33%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 608 138">
            <g filter="url(#filter0_f_6043_2785)" id="Background highlighter">
              <line stroke="url(#paint0_linear_6043_2785)" strokeOpacity="0.5" strokeWidth="10" x1="64" x2="544" y1="69" y2="69" />
            </g>
            <defs>
              <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="138" id="filter0_f_6043_2785" width="608" x="0" y="0">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
                <feGaussianBlur result="effect1_foregroundBlur_6043_2785" stdDeviation="32" />
              </filter>
              <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_6043_2785" x1="64" x2="544" y1="74.5" y2="74.5">
                <stop stopColor="#F93C94" />
                <stop offset="0.5" stopColor="#FFDA46" />
                <stop offset="1" stopColor="#37AAFF" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
      <Frame24 />
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
    <div className="absolute bg-[#39393c] content-stretch flex gap-[8px] h-[40px] items-center justify-center left-[calc(33.33%+77.33px)] min-w-[96px] px-[12px] py-0 rounded-[4px] top-[720px] w-[272px]" data-name="Button">
      <p className="capitalize font-['Inter:Medium',sans-serif] font-medium leading-[20px] not-italic relative shrink-0 text-[14px] text-center text-nowrap text-white whitespace-pre">Next</p>
      <TrailingIcon />
    </div>
  );
}

export default function Step13Of() {
  return (
    <div className="relative size-full" data-name="Step 1.3 of 4" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\\'0 0 1280 812\\\' xmlns=\\\'http://www.w3.org/2000/svg\\\' preserveAspectRatio=\\\'none\\\'><rect x=\\\'0\\\' y=\\\'0\\\' height=\\\'100%\\\' width=\\\'100%\\\' fill=\\\'url(%23grad)\\\' opacity=\\\'1\\\'/><defs><radialGradient id=\\\'grad\\\' gradientUnits=\\\'userSpaceOnUse\\\' cx=\\\'0\\\' cy=\\\'0\\\' r=\\\'10\\\' gradientTransform=\\\'matrix(129.45 97.4 -80.275 106.69 367 220)\\\'><stop stop-color=\\\'rgba(255,255,255,1)\\\' offset=\\\'0.052885\\\'/><stop stop-color=\\\'rgba(253,249,241,1)\\\' offset=\\\'1\\\'/></radialGradient></defs></svg>')" }}>
      <div className="absolute bg-[rgba(247,247,247,0.2)] h-[812px] left-0 top-1/2 translate-y-[-50%] w-[1280px]" data-name="Background texture" />
      <Container4 />
      <Frame23 />
      <FormContainer />
      <Button />
    </div>
  );
}