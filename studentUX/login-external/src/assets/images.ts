/**
 * Centralized Image Asset Registry
 * =================================
 * All image assets used across the application are centralized here.
 * This is the ONLY file that references figma:asset imports.
 * 
 * WHEN EXPORTING / RUNNING OUTSIDE FIGMA MAKE:
 * The figma:asset imports resolve to CDN URLs at build time. To make fully
 * self-contained with local files:
 * 
 * 1. Create a /public/images/ directory in your project
 * 2. Download each image from the built app (inspect network tab or rendered src)
 * 3. Save them with descriptive names matching the exports below
 * 4. Replace the figma:asset imports with local paths, e.g.:
 *
 *    // Before (Figma Make):
 *    import exxatPrismLogo from "figma:asset/dbd698...png";
 *
 *    // After (local files):
 *    const exxatPrismLogo = "/images/exxat-prism-logo.png";
 *
 * ASSET MANIFEST (15 images):
 * ──────────────────────────────────────────────────────────────────
 * Export Name              │ Description                  │ Used In
 * ──────────────────────────────────────────────────────────────────
 * exxatPrismLogo           │ Exxat Prism wordmark logo    │ ExxatPrismLogo, Step* imports
 * cohereBackground         │ Cohere 2026 slide background │ MarketingCarousel
 * publicHealthBackground   │ Public health slide bg       │ MarketingCarousel
 * classroomImage8          │ Partner logo 1               │ ClassroomToClinicSlide, MarketingSide
 * classroomImage9          │ Cleveland Clinic logo         │ ClassroomToClinicSlide, MarketingSide
 * classroomImage10         │ MedStar logo                 │ ClassroomToClinicSlide, MarketingSide
 * classroomImage11         │ ATI logo                     │ ClassroomToClinicSlide, MarketingSide
 * healthcareProfessional   │ Healthcare professional photo│ ClassroomToClinicSlide, MarketingSide
 * studentRoleImage         │ Student role selection image  │ SignInSide
 * employerRoleImage        │ Employer role selection image │ SignInSide
 * ssoProviderImage         │ SSO provider illustration    │ SSORedirect
 * userProfileImage         │ Claymation user profile pic  │ Step3Review, Step3Of4 imports
 * jobInterviewImage        │ Job interview illustration   │ FtuHomepage
 * houseImage               │ Housing illustration         │ FtuHomepage
 * containerImage           │ Container/card illustration  │ FtuHomepage
 * ──────────────────────────────────────────────────────────────────
 */

// === Logo Assets ===
import exxatPrismLogo from "figma:asset/dbd698495c4d1281c3fd3fea5ddda3fbd853ec8f.png";

// === Marketing Carousel Backgrounds ===
import cohereBackground from "figma:asset/ab2278fbb115104abe74e0ddc9356c4b722a182a.png";
import publicHealthBackground from "figma:asset/3339914084a6b91e68687f62e49f07b07fa3484a.png";

// === Classroom-to-Clinic Slide Images ===
import classroomImage8 from "figma:asset/a9bd9c428ec870c1ad5a631d9a5feb14b653a96d.png";
import classroomImage9 from "figma:asset/0db113a54fee31a20eeb2209806d09324e78fb69.png";
import classroomImage10 from "figma:asset/bc296365d78ae7dfc13c15cf810ec44ce7fe03bf.png";
import classroomImage11 from "figma:asset/11da368994f8cb71375c621536cc0259fd19e175.png";
import healthcareProfessional from "figma:asset/773758bf21e54595fc9e58d992f052a221353467.png";

// === Auth Flow Images ===
import studentRoleImage from "figma:asset/5d0f339fba942b528e0d536da2e28c3e36c15c17.png";
import employerRoleImage from "figma:asset/fa571533dc764af52242e9d10710540e475fcf98.png";
import ssoProviderImage from "figma:asset/fe2734da397730a7eb1a808b20f1fc666320eceb.png";

// === Onboarding / Profile Images ===
import userProfileImage from "figma:asset/5d9a57ec5ab605ac290f32d264f847899d6b2788.png";

// === FTU Homepage Images ===
import jobInterviewImage from "figma:asset/90acfd8045c0c6e9fb455ab3dbb39cbebf38f5ae.png";
import houseImage from "figma:asset/1392197328f289717c0f052637e18f67ed931025.png";
import containerImage from "figma:asset/da77fd859066c5578a253b6f7b89b8da5bbb38ad.png";

// Re-export all assets
export {
  // Logos
  exxatPrismLogo,
  
  // Marketing Carousel
  cohereBackground,
  publicHealthBackground,
  
  // Classroom-to-Clinic Slide
  classroomImage8,
  classroomImage9,
  classroomImage10,
  classroomImage11,
  healthcareProfessional,
  
  // Auth Flow
  studentRoleImage,
  employerRoleImage,
  ssoProviderImage,
  
  // Onboarding
  userProfileImage,
  
  // FTU Homepage
  jobInterviewImage,
  houseImage,
  containerImage,
};