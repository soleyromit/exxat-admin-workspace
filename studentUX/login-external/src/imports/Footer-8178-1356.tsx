import svgPaths from "./svg-7r8s8xduo5";

export default function Footer({ onHelpCenter }: { onHelpCenter?: () => void }) {
  return (
    <div className="content-stretch flex items-start justify-between relative size-full" data-name="Footer">
      <div className="content-stretch flex flex-col gap-[4px] items-start leading-[16px] not-italic relative shrink-0 w-[236px]" data-name="Footer">
        <p className="font-['Inter:Medium',sans-serif] font-medium min-w-full relative shrink-0 text-[14px] text-black w-[min-content]" style={{ fontFeatureSettings: "'lnum', 'tnum'" }}>
          Trouble signing in?
        </p>
        <p className="font-['Inter:Regular',sans-serif] font-normal relative shrink-0 text-[#727279] text-[12px] w-[236px]">{`Find answers in our Help Center & FAQs`}</p>
      </div>
      <button
        type="button"
        onClick={onHelpCenter ?? (() => window.open("https://help.exxat.com", "_blank", "noopener,noreferrer"))}
        className="content-stretch flex gap-[8px] h-[32px] items-center justify-center min-w-[80px] px-[12px] relative rounded-[4px] shrink-0 cursor-pointer bg-transparent hover:bg-[#f4f4f5] transition-colors"
        aria-label="Visit Help Center"
        data-name="Button"
      >
        <div aria-hidden="true" className="absolute border border-[#f4f4f5] border-solid inset-0 pointer-events-none rounded-[4px]" />
        <div className="relative shrink-0 size-[16px]" data-name="Leading Icon">
          <div className="absolute h-[9.6px] left-[2px] top-[3.2px] w-[12px]" data-name="Frame">
            <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 9.6">
              <g clipPath="url(#clip0_8178_1401)" id="Frame">
                <path d={svgPaths.p2dace700} fill="var(--fill-0, #3F51B5)" id="Vector" />
              </g>
              <defs>
                <clipPath id="clip0_8178_1401">
                  <rect fill="white" height="9.6" width="12" />
                </clipPath>
              </defs>
            </svg>
          </div>
        </div>
        <p className="capitalize font-['Inter:Medium',sans-serif] font-medium leading-[20px] not-italic relative shrink-0 text-[#3f51b5] text-[14px] text-center whitespace-nowrap" style={{ fontFeatureSettings: "'lnum', 'tnum'" }}>
          Visit Help Center
        </p>
      </button>
    </div>
  );
}