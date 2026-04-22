function Frame() {
  return (
    <div className="absolute content-stretch flex gap-[16px] items-center left-0 top-0">
      <div className="flex items-center justify-center relative shrink-0">
        <div className="flex-none scale-y-[-100%]">
          <div className="h-0 relative w-[152px]">
            <div className="absolute bottom-0 left-0 right-0 top-[-1px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 152 1">
                <line id="Line 11" stroke="url(#paint0_linear_8003_28)" x2="152" y1="0.5" y2="0.5" />
                <defs>
                  <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_8003_28" x1="0" x2="152" y1="1.5" y2="1.5">
                    <stop stopColor="white" stopOpacity="0" />
                    <stop offset="1" stopColor="#C6C6CA" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>
      </div>
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] not-italic relative shrink-0 text-[#717182] text-[13px] text-center text-nowrap tracking-[-0.0762px] whitespace-pre">Trouble logging in? Contact</p>
      <div className="flex items-center justify-center relative shrink-0">
        <div className="flex-none rotate-[180deg]">
          <div className="h-0 relative w-[152px]">
            <div className="absolute bottom-0 left-0 right-0 top-[-1px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 152 1">
                <line id="Line 10" stroke="url(#paint0_linear_8003_32)" x2="152" y1="0.5" y2="0.5" />
                <defs>
                  <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_8003_32" x1="0" x2="152" y1="1.5" y2="1.5">
                    <stop stopColor="white" stopOpacity="0" />
                    <stop offset="1" stopColor="#C6C6CA" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Paragraph() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Paragraph">
      <Frame />
    </div>
  );
}

function Prism() {
  return (
    <div className="content-stretch flex flex-col gap-[2px] items-center leading-[1.2] not-italic relative shrink-0 w-[162px]" data-name="Prism">
      <p className="font-['Inter:Medium',sans-serif] font-medium relative shrink-0 text-[#717182] text-[12px] text-center w-full">Exxat Prism</p>
      <p className="[text-underline-position:from-font] decoration-solid font-['Inter:Regular',sans-serif] font-normal relative shrink-0 text-[#3f51b5] text-[13px] tracking-[-0.0762px] underline w-full">prism-support@exxat.com</p>
    </div>
  );
}

function One() {
  return (
    <div className="content-stretch flex flex-col gap-[2px] items-center not-italic relative shrink-0 w-[151px]" data-name="One">
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[1.2] relative shrink-0 text-[#717182] text-[12px] text-center w-full">Exxat One</p>
      <p className="[text-underline-position:from-font] decoration-solid font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] relative shrink-0 text-[#3f51b5] text-[13px] tracking-[-0.0762px] underline w-full">one-support@exxat.com</p>
    </div>
  );
}

function FontAwesomeIcon() {
  return (
    <div className="relative shrink-0 size-0" data-name="FontAwesomeIcon">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid size-0" />
    </div>
  );
}

function Text() {
  return (
    <div className="basis-0 grow h-[19.5px] min-h-px min-w-px relative shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid h-[19.5px] relative w-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] left-1/2 not-italic text-[#3f51b5] text-[13px] text-center text-nowrap top-px tracking-[-0.0762px] translate-x-[-50%] whitespace-pre">Visit Help Center</p>
      </div>
    </div>
  );
}

function Link() {
  return (
    <div className="bg-[rgba(255,255,255,0)] content-stretch flex gap-[8px] h-[36px] items-center justify-center px-[21px] py-0 relative rounded-[10px] shrink-0 w-[139px]" data-name="Link">
      <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.06)] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <FontAwesomeIcon />
      <Text />
    </div>
  );
}

function Footer() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-name="Footer">
      <Prism />
      <div className="flex h-[36px] items-center justify-center relative shrink-0 w-0" style={{ "--transform-inner-width": "36", "--transform-inner-height": "0" } as React.CSSProperties}>
        <div className="flex-none rotate-[90deg]">
          <div className="h-0 relative w-[36px]">
            <div className="absolute bottom-0 left-0 right-0 top-[-1px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 36 1">
                <line id="Line 10" stroke="url(#paint0_linear_8003_30)" x2="36" y1="0.5" y2="0.5" />
                <defs>
                  <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_8003_30" x1="0" x2="36" y1="1.5" y2="1.5">
                    <stop stopColor="white" stopOpacity="0" />
                    <stop offset="0.5" stopColor="#C6C6CA" />
                    <stop offset="1" stopColor="white" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>
      </div>
      <One />
      <div className="flex h-[36px] items-center justify-center relative shrink-0 w-0" style={{ "--transform-inner-width": "36", "--transform-inner-height": "0" } as React.CSSProperties}>
        <div className="flex-none rotate-[90deg]">
          <div className="h-0 relative w-[36px]">
            <div className="absolute bottom-0 left-0 right-0 top-[-1px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 36 1">
                <line id="Line 10" stroke="url(#paint0_linear_8003_30)" x2="36" y1="0.5" y2="0.5" />
                <defs>
                  <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_8003_30" x1="0" x2="36" y1="1.5" y2="1.5">
                    <stop stopColor="white" stopOpacity="0" />
                    <stop offset="0.5" stopColor="#C6C6CA" />
                    <stop offset="1" stopColor="white" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>
      </div>
      <Link />
    </div>
  );
}

export default function Footer1() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-center justify-center relative w-auto h-auto" data-name="Footer">
      <Paragraph />
      <Footer />
    </div>
  );
}