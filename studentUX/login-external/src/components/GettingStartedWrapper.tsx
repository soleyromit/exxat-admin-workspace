import svgPaths from "../imports/svg-mcwk40apay";
import ExxatOneLogo from "../imports/ExxatOneLogo";
import ExxatPrismLogo from "../imports/ExxatPrismLogo";

interface GettingStartedWrapperProps {
  onGetStarted: () => void;
  selectedProduct: 'prism' | 'one' | null;
}

function Group() {
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

function BrandLogo({ product }: { product: 'prism' | 'one' | null }) {
  return (
    <div className={`overflow-clip relative shrink-0 ${product === 'one' ? 'h-[32px] w-[128px]' : 'h-[32px] w-[144px]'}`} data-name="Brand Logo">
      {product === 'one' ? <ExxatOneLogo /> : <ExxatPrismLogo />}
    </div>
  );
}

function TopNavigationLandingPage({ product }: { product: 'prism' | 'one' | null }) {
  return (
    <div className="absolute content-stretch flex h-[56px] items-center left-1/2 px-[40px] py-0 top-0 translate-x-[-50%] w-[1280px]" data-name="Top Navigation – Landing Page">
      <BrandLogo product={product} />
    </div>
  );
}

function Frame1({ product }: { product: 'prism' | 'one' | null }) {
  const productName = product === 'prism' ? 'Exxat Prism' : 'Exxat One';
  
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
      <p className="font-['Inter:Bold',sans-serif] font-bold leading-[normal] not-italic relative shrink-0 text-[20px] text-black w-[720px]">Welcome to {productName}</p>
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
      <div className="font-['Crimson_Pro:ExtraBold',sans-serif] font-extrabold leading-[70px] relative shrink-0 text-[64px] text-black tracking-[-0.08px] w-[720px]">
        <p className="mb-[16px]">You've just taken the first step towards</p>
        <p className="bg-clip-text text-transparent bg-gradient-to-r from-[#E31C79] to-[#E31C79]">
          something awesome
        </p>
      </div>
    </div>
  );
}

function Frame3({ product }: { product: 'prism' | 'one' | null }) {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-[720px]">
      <Frame1 product={product} />
      <Frame2 />
    </div>
  );
}

function Frame({ className }: { className?: string }) {
  return (
    <div className={`absolute h-[12px] left-[2.75px] top-[2px] w-[10.5px] ${className}`} data-name="Frame">
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

function Button({ onClick, product }: { onClick: () => void; product: 'prism' | 'one' | null }) {
  const bgColor = product === 'one' ? '#39393c' : '#3F51B5';
  const hoverColor = product === 'one' ? '#39393c' : '#3F51B5';
  
  return (
    <button 
      onClick={onClick}
      className={`content-stretch flex gap-[8px] h-[40px] items-center justify-center min-w-[96px] px-[12px] py-0 relative rounded-[4px] shrink-0 w-[170px] transition-colors cursor-pointer`}
      style={{ backgroundColor: bgColor }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${hoverColor}90`)}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = bgColor)}
      data-name="Button"
    >
      <p className="capitalize font-['Inter:Medium',sans-serif] font-medium leading-[20px] not-italic relative shrink-0 text-[14px] text-center text-nowrap text-white whitespace-pre">Get Started</p>
      <TrailingIcon />
    </button>
  );
}

function Frame4({ onGetStarted, product }: { onGetStarted: () => void; product: 'prism' | 'one' | null }) {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-[720px]">
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[28px] min-w-full not-italic relative shrink-0 text-[24px] text-black tracking-[-0.08px] w-[min-content]">Check out opportunities and keep tabs on your placements!</p>
      <Button onClick={onGetStarted} product={product} />
    </div>
  );
}

function Frame5({ product, onGetStarted }: { product: 'prism' | 'one' | null; onGetStarted: () => void }) {
  return (
    <div className="absolute content-stretch flex flex-col gap-[72px] items-start left-[calc(8.33%-6.67px)] top-1/2 translate-y-[-50%] w-[720px]">
      <Frame3 product={product} />
      <Frame4 onGetStarted={onGetStarted} product={product} />
    </div>
  );
}

// Feature tags for Exxat One
const exxatOneFeatures = [
  "Credential Verification",
  "Rotation Scheduling",
  "Portfolio Management",
  "Career Dashboard",
  "Analytics",
  "Smart Matching",
  "Documentation",
  "Automated Alerts",
  "Student Data",
  "Reporting",
  "Employer Visibility",
  "Site Profile",
  "Career Opportunities"
];

// Feature tags for Exxat Prism
const exxatPrismFeatures = [
  "Clinical Placement",
  "Student Management",
  "Site Coordination",
  "Compliance Tracking",
  "Document Management",
  "Rotation Scheduling",
  "Analytics Dashboard",
  "Automated Workflows",
  "Credentialing",
  "Reporting Tools",
  "Integration Hub",
  "Mobile Access",
  "Real-time Updates"
];

function FeatureTag({ label }: { label: string }) {
  return (
    <div className="content-stretch flex h-[41.429px] items-center px-[10.357px] py-0 relative rounded-[5.179px] shrink-0">
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[20.714px] not-italic relative shrink-0 text-[#e31c79] text-[14.241px] text-nowrap whitespace-pre">{label}</p>
    </div>
  );
}

function Frame19({ product }: { product: 'prism' | 'one' | null }) {
  const features = product === 'prism' ? exxatPrismFeatures : exxatOneFeatures;
  
  return (
    <div className="absolute content-center flex flex-wrap gap-[20.714px] items-center justify-center left-[30px] opacity-50 top-1/2 translate-y-[-50%] w-[477px]">
      {features.map((feature, index) => (
        <FeatureTag key={index} label={feature} />
      ))}
    </div>
  );
}

function FeatureIllustration({ product }: { product: 'prism' | 'one' | null }) {
  return (
    <div className="absolute h-[812px] overflow-clip right-0 top-1/2 translate-y-[-50%] w-[440px]" data-name="Feature Illustration" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\\'0 0 440 812\\\' xmlns=\\\'http://www.w3.org/2000/svg\\\' preserveAspectRatio=\\\'none\\\'><rect x=\\\'0\\\' y=\\\'0\\\' height=\\\'100%\\\' width=\\\'100%\\\' fill=\\\'url(%23grad)\\\' opacity=\\\'0.20000000298023224\\\'/><defs><radialGradient id=\\\'grad\\\' gradientUnits=\\\'userSpaceOnUse\\\' cx=\\\'0\\\' cy=\\\'0\\\' r=\\\'10\\\' gradientTransform=\\\'matrix(-36.65 -59.65 51.583 -35.656 586.5 676.5)\\\'><stop stop-color=\\\'rgba(232,42,131,1)\\\' offset=\\\'0\\\'/><stop stop-color=\\\'rgba(233,64,134,1)\\\' offset=\\\'0.083993\\\'/><stop stop-color=\\\'rgba(234,87,137,1)\\\' offset=\\\'0.16799\\\'/><stop stop-color=\\\'rgba(235,132,143,1)\\\' offset=\\\'0.33597\\\'/><stop stop-color=\\\'rgba(237,176,149,1)\\\' offset=\\\'0.50396\\\'/><stop stop-color=\\\'rgba(238,221,154,1)\\\' offset=\\\'0.67195\\\'/><stop stop-color=\\\'rgba(255,255,255,0)\\\' offset=\\\'1\\\'/></radialGradient></defs></svg>')" }}>
      <Frame19 product={product} />
    </div>
  );
}

export default function GettingStartedWrapper({ onGetStarted, selectedProduct }: GettingStartedWrapperProps) {
  // Default to 'one' if no product is selected
  const product = selectedProduct || 'one';
  
  return (
    <div className="absolute inset-0 size-full z-50" data-name="Getting Started" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\\'0 0 1280 812\\\' xmlns=\\\'http://www.w3.org/2000/svg\\\' preserveAspectRatio=\\\'none\\\'><rect x=\\\'0\\\' y=\\\'0\\\' height=\\\'100%\\\' width=\\\'100%\\\' fill=\\\'url(%23grad)\\\' opacity=\\\'1\\\'/><defs><radialGradient id=\\\'grad\\\' gradientUnits=\\\'userSpaceOnUse\\\' cx=\\\'0\\\' cy=\\\'0\\\' r=\\\'10\\\' gradientTransform=\\\'matrix(129.45 97.4 -80.275 106.69 367 220)\\\'><stop stop-color=\\\'rgba(255,255,255,1)\\\' offset=\\\'0.052885\\\'/><stop stop-color=\\\'rgba(253,249,241,1)\\\' offset=\\\'1\\\'/></radialGradient></defs></svg>')" }}>
      <div className="absolute bg-[rgba(247,247,247,0.2)] h-[812px] left-0 top-1/2 translate-y-[-50%] w-[1280px]" data-name="Background texture" />
      <TopNavigationLandingPage product={product} />
      <Frame5 product={product} onGetStarted={onGetStarted} />
      <FeatureIllustration product={product} />
    </div>
  );
}