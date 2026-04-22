import { exxatPrismLogo as imgExxatPrismLogo } from "../assets/images";

export default function ExxatPrismLogo() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative size-full" data-name="Exxat Prism Logo">
      <div className="h-[32px] relative shrink-0 w-[144px]" data-name="Exxat Prism Logo">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgExxatPrismLogo} />
      </div>
    </div>
  );
}