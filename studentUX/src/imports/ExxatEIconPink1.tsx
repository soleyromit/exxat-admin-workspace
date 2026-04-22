import svgPaths from "./svg-mns1mgp9aq";

function Group() {
  return (
    <div className="absolute inset-[0_0.01%_0.01%_0]" data-name="Group">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 121.12 121.12">
        <g id="Group">
          <path d={svgPaths.p122487c0} fill="url(#paint0_linear_8312_691)" id="Vector" />
          <path d={svgPaths.p46c9e00} fill="var(--fill-0, #BE1E6D)" id="Vector_2" />
          <g id="Group_2">
            <path d={svgPaths.p3c2e4800} fill="var(--fill-0, white)" id="Vector_3" />
            <path d={svgPaths.p243a5180} fill="var(--fill-0, white)" id="Vector_4" />
            <path d={svgPaths.p16a0bb40} fill="var(--fill-0, white)" id="Vector_5" />
            <path d={svgPaths.p1b27fc00} fill="var(--fill-0, white)" id="Vector_6" />
            <path d={svgPaths.p1f8cef00} fill="var(--fill-0, white)" id="Vector_7" />
          </g>
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_8312_691" x1="23.38" x2="96.57" y1="103.83" y2="18.67">
            <stop offset="0.04" stopColor="#E21C79" />
            <stop offset="0.65" stopColor="#E21E7B" />
            <stop offset="0.73" stopColor="#E42880" />
            <stop offset="0.88" stopColor="#E9448E" />
            <stop offset="1" stopColor="#EF609D" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function Layer() {
  return (
    <div className="absolute contents inset-[0_0.01%_0.01%_0]" data-name="Layer 1">
      <Group />
    </div>
  );
}

export default function ExxatEIconPink() {
  return (
    <div className="relative size-full" data-name="Exxat_E_Icon_PINK 1">
      <Layer />
    </div>
  );
}