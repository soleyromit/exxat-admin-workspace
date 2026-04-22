import svgPaths from "./svg-1qpj391edr";

function Frame2() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start not-italic relative shrink-0 tracking-[-0.08px] w-full">
      <p className="font-['Inter:Bold',sans-serif] font-bold leading-[28px] relative shrink-0 text-[20px] text-black w-full">One platform. Many journeys. Let’s begin.</p>
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[1.2] relative shrink-0 text-[#727279] text-[14px] w-full">Enter your email to sign in</p>
    </div>
  );
}

function Icon() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon">
          <path d={svgPaths.p2f8e7e80} id="Vector" stroke="var(--stroke-0, #727279)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.p17070980} id="Vector_2" stroke="var(--stroke-0, #727279)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function EmailInput() {
  return (
    <div className="basis-0 grow h-[20px] min-h-px min-w-px relative shrink-0" data-name="Email Input">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex h-[20px] items-center overflow-clip relative rounded-[inherit] w-full">
        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[21px] not-italic relative shrink-0 text-[#39393c] text-[14px] text-nowrap whitespace-pre">alex@mit.edu</p>
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="absolute content-stretch flex gap-[8px] h-[40px] items-center left-0 overflow-clip px-[12px] py-0 rounded-[4px] top-0 w-[406px]" data-name="Container">
      <Icon />
      <EmailInput />
    </div>
  );
}

function Container1() {
  return <div className="absolute border border-[#8c8c92] border-solid h-[40px] left-0 rounded-[4px] top-0 w-[406px]" data-name="Container" />;
}

function Container2() {
  return (
    <div className="bg-white h-[40px] relative rounded-[4px] shrink-0 w-[406px]" data-name="Container">
      <Container />
      <Container1 />
    </div>
  );
}

function HeaderWithTextBox() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full" data-name="Header with Text Box">
      <Frame2 />
      <Container2 />
    </div>
  );
}

function Button() {
  return (
    <div className="bg-[#39393c] h-[40px] min-w-[96px] relative rounded-[4px] shrink-0 w-full" data-name="Button">
      <div className="flex flex-row items-center justify-center min-w-[inherit] size-full">
        <div className="content-stretch flex gap-[8px] h-[40px] items-center justify-center min-w-[inherit] px-[12px] py-0 relative w-full">
          <p className="capitalize font-['Inter:Medium',sans-serif] font-medium leading-[20px] not-italic relative shrink-0 text-[14px] text-center text-nowrap text-white whitespace-pre">Next</p>
        </div>
      </div>
    </div>
  );
}

function HeaderTextBoxCta() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-[406px]" data-name="Header + Text Box + CTA">
      <HeaderWithTextBox />
      <Button />
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0">
      <HeaderTextBoxCta />
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex flex-col items-center relative shrink-0">
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[16px] not-italic relative shrink-0 text-[#727279] text-[12px] w-[406px]">
        <span>{`By continuing, you agree to our `}</span>
        <span className="[text-decoration-skip-ink:none] [text-underline-position:from-font] decoration-solid underline">Terms of Service</span>
        <span>{` and that you have read and understood our `}</span>
        <span className="[text-decoration-skip-ink:none] [text-underline-position:from-font] decoration-solid underline">Privacy Policy</span>.
      </p>
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0">
      <Frame1 />
      <div className="h-0 relative shrink-0 w-[406px]">
        <div className="absolute bottom-0 left-0 right-0 top-[-1px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 406 1">
            <line id="Line 8" stroke="url(#paint0_linear_8002_1560)" x2="406" y1="0.5" y2="0.5" />
            <defs>
              <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_8002_1560" x1="0" x2="406" y1="1.5" y2="1.5">
                <stop stopColor="white" stopOpacity="0" />
                <stop offset="0.504808" stopColor="#E0E0E0" />
                <stop offset="1" stopColor="white" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
      <Frame />
    </div>
  );
}

function Cta() {
  return (
    <div className="content-stretch flex gap-[4px] items-center leading-[16px] not-italic relative shrink-0 text-[14px] text-nowrap w-[406px] whitespace-pre" data-name="CTA">
      <p className="font-['Inter:Regular',sans-serif] font-normal relative shrink-0 text-black text-center">New student?</p>
      <p className="font-['Inter:Medium',sans-serif] font-medium relative shrink-0 text-[#e31c79]">Join Exxat One Network</p>
    </div>
  );
}

function Cta1() {
  return (
    <div className="content-stretch flex gap-[4px] items-center leading-[16px] not-italic relative shrink-0 text-[14px] text-nowrap w-[406px] whitespace-pre" data-name="CTA">
      <p className="font-['Inter:Regular',sans-serif] font-normal relative shrink-0 text-black text-center">New school or site?</p>
      <p className="font-['Inter:Medium',sans-serif] font-medium relative shrink-0 text-[#e31c79]">Contact Sales</p>
    </div>
  );
}

function Frame4() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0">
      <Cta />
      <Cta1 />
    </div>
  );
}

function LoginForm() {
  return (
    <div className="content-stretch flex flex-col gap-[40px] items-start relative shrink-0" data-name="Login Form">
      <Frame3 />
      <Frame4 />
    </div>
  );
}

function LoginCard() {
  return (
    <div className="absolute bg-white content-stretch flex flex-col h-[812px] items-center justify-center px-0 py-[24px] right-0 top-1/2 translate-y-[-50%] w-[570px]" data-name="Login Card">
      <LoginForm />
    </div>
  );
}

function WhiteColorBoxWithLogin() {
  return (
    <div className="absolute contents right-0 top-1/2 translate-y-[-50%]" data-name="White Color Box with Login">
      <LoginCard />
      <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[16px] left-[calc(58.33%+45.33px)] not-italic text-[#adadb2] text-[12px] text-nowrap top-[756px] whitespace-pre">
        <span className="text-black">{`Need Assistance? `}</span>
        <span className="[text-decoration-skip-ink:none] [text-underline-position:from-font] decoration-solid text-black underline">Contact Us</span>
        <span className="text-black"> </span>
        <span>{` •  `}</span>©2025 Exxat, Inc.
      </p>
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute inset-[2.78%_0.94%_4.92%_1%]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 99 17">
        <g id="Group 18">
          <path d={svgPaths.p37fdfe80} fill="var(--fill-0, #E31C79)" id="Vector" />
          <path d={svgPaths.pb8da600} fill="var(--fill-0, #E31C79)" id="Vector_2" />
          <path d={svgPaths.p3d13d80} fill="var(--fill-0, #E31C79)" id="Vector_3" />
          <path d={svgPaths.p369ebb80} fill="var(--fill-0, #263340)" id="Vector_4" />
          <path d={svgPaths.p200fbc00} fill="var(--fill-0, #263340)" id="Vector_5" />
          <path d={svgPaths.p1a0c9000} fill="var(--fill-0, #263340)" id="Vector_6" />
          <path d={svgPaths.p17ce7380} fill="var(--fill-0, #263340)" id="Vector_7" />
          <path d={svgPaths.p22673700} fill="var(--fill-0, #263340)" id="Vector_8" />
        </g>
      </svg>
    </div>
  );
}

function BrandLogo() {
  return (
    <div className="h-[18px] overflow-clip relative shrink-0 w-[100px]" data-name="Brand Logo">
      <Group1 />
    </div>
  );
}

function TopNavigationLandingPage() {
  return (
    <div className="absolute content-stretch flex h-[56px] items-center left-1/2 px-[40px] py-0 top-0 translate-x-[-50%] w-[1280px]" data-name="Top Navigation – Landing Page">
      <BrandLogo />
    </div>
  );
}

function Carousel() {
  return (
    <div className="absolute content-stretch flex gap-[4px] items-center left-[77px] top-[783px]" data-name="Carousel">
      <div className="relative rounded-[60px] shrink-0 size-[6px]">
        <div aria-hidden="true" className="absolute border-[0.667px] border-black border-solid inset-0 pointer-events-none rounded-[60px]" />
      </div>
      <div className="bg-black h-[6px] rounded-[60px] shrink-0 w-[24px]" />
      <div className="relative rounded-[60px] shrink-0 size-[6px]">
        <div aria-hidden="true" className="absolute border-[0.667px] border-black border-solid inset-0 pointer-events-none rounded-[60px]" />
      </div>
      <div className="relative rounded-[60px] shrink-0 size-[6px]">
        <div aria-hidden="true" className="absolute border-[0.667px] border-black border-solid inset-0 pointer-events-none rounded-[60px]" />
      </div>
    </div>
  );
}

function Group() {
  return (
    <div className="absolute inset-[43.28%_58.44%_11.7%_6.41%]" data-name="Group">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 450 366">
        <g id="Group">
          <path d={svgPaths.pc91200} fill="var(--fill-0, #FB9078)" id="Vector" />
          <path d={svgPaths.p258d0430} fill="var(--fill-0, #FFBFA7)" id="Vector_2" />
          <path d={svgPaths.p29503100} fill="var(--fill-0, white)" id="Vector_3" />
          <path d={svgPaths.p5525e80} fill="var(--fill-0, #FFBFA7)" id="Vector_4" />
          <path d={svgPaths.p3cfc480} fill="var(--fill-0, white)" id="Vector_5" />
          <path d={svgPaths.p3ab75b00} fill="var(--fill-0, #472B06)" id="Vector_6" />
          <path d={svgPaths.p22c99200} fill="var(--fill-0, #472B06)" id="Vector_7" />
          <path d={svgPaths.p8e40ef0} fill="var(--fill-0, #FB9078)" id="Vector_8" />
          <path d={svgPaths.p2ed3f000} fill="var(--fill-0, white)" id="Vector_9" />
          <path d={svgPaths.p3aa8e780} fill="var(--fill-0, white)" id="Vector_10" />
          <path d={svgPaths.p15fa2170} fill="var(--fill-0, #472B06)" id="Vector_11" />
          <path d={svgPaths.p35c86ef0} fill="var(--fill-0, #472B06)" id="Vector_12" />
          <path d={svgPaths.p2d783800} fill="var(--fill-0, #444444)" id="Vector_13" />
          <path d={svgPaths.p30e7db00} fill="var(--fill-0, #444444)" id="Vector_14" />
          <path d={svgPaths.p17633080} fill="var(--fill-0, #444444)" id="Vector_15" />
          <path d={svgPaths.p894a680} fill="var(--fill-0, #472B06)" id="Vector_16" />
          <path d={svgPaths.pa5fe280} fill="var(--fill-0, white)" id="Vector_17" />
          <path d={svgPaths.p3829fd00} fill="var(--fill-0, #472B06)" id="Vector_18" />
          <path d={svgPaths.pf99f500} fill="var(--fill-0, #472B06)" id="Vector_19" />
          <path d={svgPaths.p38865e00} fill="var(--fill-0, #472B06)" id="Vector_20" />
          <path d={svgPaths.p1f6847c0} fill="var(--fill-0, #444444)" id="Vector_21" />
          <path d={svgPaths.p28cbb780} fill="var(--fill-0, #444444)" id="Vector_22" />
          <path d={svgPaths.p23c9c180} fill="var(--fill-0, white)" id="Vector_23" />
          <path d={svgPaths.p9ed7d00} fill="var(--fill-0, white)" id="Vector_24" />
          <path d={svgPaths.p3329180} fill="var(--fill-0, #444444)" id="Vector_25" />
          <path d={svgPaths.p2686d880} fill="var(--fill-0, #FDBB64)" id="Vector_26" />
          <path d={svgPaths.p2f302700} fill="var(--fill-0, #FDBB64)" id="Vector_27" />
          <path d={svgPaths.p3bcff640} fill="var(--fill-0, #FDBB64)" id="Vector_28" />
          <path d={svgPaths.p3f445300} fill="var(--fill-0, #472B06)" id="Vector_29" />
          <path d={svgPaths.p216c2840} fill="var(--fill-0, #FDBB64)" id="Vector_30" />
          <path d={svgPaths.p2ddc9780} fill="var(--fill-0, #472B06)" id="Vector_31" />
          <path d={svgPaths.p1372ed00} fill="var(--fill-0, #472B06)" id="Vector_32" />
          <path d={svgPaths.p3ad72880} fill="var(--fill-0, #444444)" id="Vector_33" />
          <path d={svgPaths.p3c466f80} fill="var(--fill-0, white)" id="Vector_34" />
          <path d={svgPaths.p80b9b80} fill="var(--fill-0, white)" id="Vector_35" />
          <path d={svgPaths.p7bed400} fill="var(--fill-0, #444444)" id="Vector_36" />
          <path d={svgPaths.pbc92c0} fill="var(--fill-0, #FDBB64)" id="Vector_37" />
          <path d={svgPaths.p1cca4680} fill="var(--fill-0, #472B06)" id="Vector_38" />
          <path d={svgPaths.p10f2a280} fill="var(--fill-0, #FDBB64)" id="Vector_39" />
          <path d={svgPaths.p2425c100} fill="var(--fill-0, #FDBB64)" id="Vector_40" />
          <path d={svgPaths.p34186700} fill="var(--fill-0, #472B06)" id="Vector_41" />
          <path d={svgPaths.p23f41ff0} fill="var(--fill-0, white)" id="Vector_42" />
          <path d={svgPaths.p29c3e000} fill="var(--fill-0, white)" id="Vector_43" />
          <path d={svgPaths.p1b60af00} fill="var(--fill-0, #EF7459)" id="Vector_44" />
          <path d={svgPaths.p1043780} fill="var(--fill-0, #FDBB64)" id="Vector_45" />
        </g>
      </svg>
    </div>
  );
}

export default function OneExxatComCommonLoginPage() {
  return (
    <div className="relative size-full" data-name="one.exxat.com – Common Login Page" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\\'0 0 1280 812\\\' xmlns=\\\'http://www.w3.org/2000/svg\\\' preserveAspectRatio=\\\'none\\\'><rect x=\\\'0\\\' y=\\\'0\\\' height=\\\'100%\\\' width=\\\'100%\\\' fill=\\\'url(%23grad)\\\' opacity=\\\'1\\\'/><defs><radialGradient id=\\\'grad\\\' gradientUnits=\\\'userSpaceOnUse\\\' cx=\\\'0\\\' cy=\\\'0\\\' r=\\\'10\\\' gradientTransform=\\\'matrix(-10.05 -352.22 2691.9 -183.85 651.5 3451)\\\'><stop stop-color=\\\'rgba(247,247,247,0)\\\' offset=\\\'0.57941\\\'/><stop stop-color=\\\'rgba(247,247,247,1)\\\' offset=\\\'1\\\'/></radialGradient></defs></svg>')" }}>
      <div className="absolute bg-[rgba(247,247,247,0.2)] h-[812px] left-0 top-1/2 translate-y-[-50%] w-[1280px]" data-name="Background texture" />
      <div className="absolute bg-[rgba(247,247,247,0.2)] h-[812px] left-0 top-1/2 translate-y-[-50%] w-[1280px]" data-name="Background texture" />
      <WhiteColorBoxWithLogin />
      <TopNavigationLandingPage />
      <Carousel />
      <div className="absolute bg-clip-text font-['Inter:Black',sans-serif] font-black leading-none left-[82px] not-italic text-[0px] top-[102px] tracking-[-0.08px] w-[560px]" style={{ WebkitTextFillColor: "transparent" }}>
        <p className="mb-[24px] text-black">
          <span className="font-['Inter:Black',sans-serif] font-black text-[32px]">Empowering a Network of</span>
          <span className="font-['Inter:Regular',sans-serif] font-normal text-[52px]"> </span>
        </p>
        <p className="font-['Inter:Bold',sans-serif] font-bold text-[72px]">Sites, Schools, and Students</p>
      </div>
      <Group />
    </div>
  );
}