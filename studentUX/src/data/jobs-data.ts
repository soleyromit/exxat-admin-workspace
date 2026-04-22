// Jobs page mock data

// Logo.dev (Clearbit replacement) — add VITE_LOGO_DEV_TOKEN to .env for higher rate limits
const logoDevToken = import.meta.env.VITE_LOGO_DEV_TOKEN as string | undefined;
/** Build Logo.dev URL from domain — use for job, organisation, and task card logos */
export const logoUrl = (domain: string) => {
  const base = `https://img.logo.dev/${domain}?size=128&format=png`;
  return logoDevToken ? `${base}&token=${logoDevToken}` : base;
};

/** Work setting options for job filters */
export const JOB_WORK_SETTINGS = [
  "Acute Care Hospital",
  "Ambulatory Surgery Center",
  "Assisted Living Facility",
  "Behavioral Health / Psychiatric Facility",
  "Children's Hospital",
  "Community Health Center",
  "Home Health",
  "Hospice / Palliative Care",
  "Inpatient Rehabilitation Facility",
  "Long-Term Acute Care Hospital (LTACH)",
  "Outpatient Clinic",
  "Private Practice / Physician Group",
  "School-Based Health",
  "Skilled Nursing Facility (SNF)",
  "Telehealth",
  "Urgent Care",
] as const;

/** Site options for job filters — specific facility/site names */
export const JOB_SITES = [
  "Cleveland Clinic Main Campus",
  "Johns Hopkins Hospital",
  "Kaiser Permanente Oakland Medical Center",
  "Mayo Clinic Rochester",
  "MedStar Georgetown University Hospital",
  "MedStar Washington Hospital Center",
  "Memorial Sloan Kettering Cancer Center",
  "Planned Parenthood Manhattan",
  "Sunrise Towson",
  "Children's National Main Campus",
  "HCA TriStar Centennial",
] as const;

/** Logo URL per site — used in site filter dropdown */
export const JOB_SITE_LOGO_MAP: Record<string, string> = {
  "Cleveland Clinic Main Campus": logoUrl("clevelandclinic.org"),
  "Johns Hopkins Hospital": logoUrl("hopkinsmedicine.org"),
  "Kaiser Permanente Oakland Medical Center": logoUrl("kaiserpermanente.org"),
  "Mayo Clinic Rochester": logoUrl("mayoclinic.org"),
  "MedStar Georgetown University Hospital": logoUrl("medstarhealth.org"),
  "MedStar Washington Hospital Center": logoUrl("medstarhealth.org"),
  "Memorial Sloan Kettering Cancer Center": logoUrl("mskcc.org"),
  "Planned Parenthood Manhattan": logoUrl("plannedparenthood.org"),
  "Sunrise Towson": logoUrl("sunriseseniorliving.com"),
  "Children's National Main Campus": logoUrl("childrensnational.org"),
  "HCA TriStar Centennial": logoUrl("hcahealthcare.com"),
};

/** Location options for job filters — 20 locations for searchable dropdown */
export const JOB_LOCATIONS = [
  "Baltimore, MD",
  "Boston, MA",
  "Charlotte, NC",
  "Chicago, IL",
  "Cleveland, OH",
  "Dallas, TX",
  "Denver, CO",
  "Houston, TX",
  "Los Angeles, CA",
  "Miami, FL",
  "Nashville, TN",
  "New York, NY",
  "Oakland, CA",
  "Philadelphia, PA",
  "Phoenix, AZ",
  "Rochester, MN",
  "San Diego, CA",
  "San Francisco, CA",
  "Towson, MD",
  "Washington, DC",
] as const;

export interface JobListing {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  site?: string;
  postedAt: string;
  isSaved?: boolean;
  matchScore?: "Great Fit" | "Good Fit" | null;
  salary?: string;
  specialty?: string;
  workSetting?: string;
  jobType?: string;
  description?: string;
  requirements?: string[];
  benefits?: string[];
  aiInsights?: {
    summary: string;
    strongMatches: string[];
    recommendedPrep: string[];
  };
}

/** Draft application — saved but not submitted */
export interface DraftApplication {
  id: string;
  jobId: string; // Links to JobListing.id for detail page
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  savedAt: string;
}

/** Applied job with status */
export interface AppliedJob {
  id: string;
  /** Job listing id — for navigation to job detail */
  jobId?: string;
  title: string;
  company: string;
  location: string;
  appliedAt: string;
  status: "Application Submitted" | "Application Viewed";
}

export const draftApplications: DraftApplication[] = [
  {
    id: "d1",
    jobId: "3",
    title: "Physical Therapist - Orthopedic Specialist",
    company: "MedStar Health",
    companyLogo: logoUrl("medstarhealth.org"),
    location: "Baltimore, MD",
    savedAt: "3d ago",
  },
  {
    id: "d2",
    jobId: "5",
    title: "East Coast Behavioral Health Therapist, Licensed",
    company: "SandyPines Adolescent Residential Treatment Center",
    companyLogo: logoUrl("sandyPines.com"),
    location: "Baltimore, MD",
    savedAt: "3d ago",
  },
];

export const appliedJobs: AppliedJob[] = [
  {
    id: "a1",
    jobId: "5",
    title: "East Coast Behavioral Health Therapist, Licensed",
    company: "SandyPines Adolescent Residential Treatment Center",
    location: "Baltimore, MD",
    appliedAt: "1d ago",
    status: "Application Submitted",
  },
  {
    id: "a2",
    jobId: "5",
    title: "East Coast Behavioral Health Therapist, Licensed",
    company: "SandyPines Adolescent Residential Treatment Center",
    location: "Baltimore, MD",
    appliedAt: "2d ago",
    status: "Application Viewed",
  },
  {
    id: "a3",
    jobId: "5",
    title: "East Coast Behavioral Health Therapist, Licensed",
    company: "SandyPines Adolescent Residential Treatment Center",
    location: "Baltimore, MD",
    appliedAt: "2d ago",
    status: "Application Viewed",
  },
  {
    id: "a4",
    jobId: "5",
    title: "East Coast Behavioral Health Therapist, Licensed",
    company: "SandyPines Adolescent Residential Treatment Center",
    location: "Baltimore, MD",
    appliedAt: "3d ago",
    status: "Application Submitted",
  },
  {
    id: "a5",
    jobId: "5",
    title: "East Coast Behavioral Health Therapist, Licensed",
    company: "SandyPines Adolescent Residential Treatment Center",
    location: "Baltimore, MD",
    appliedAt: "4d ago",
    status: "Application Submitted",
  },
];

export const recommendedJobs: JobListing[] = [
  {
    id: "1",
    title: "Geriatric Nurse Practitioner",
    company: "Sunrise Senior Living",
    companyLogo: logoUrl("sunriseseniorliving.com"),
    location: "Towson, MD",
    site: "Sunrise Towson",
    postedAt: "1d ago",
    isSaved: false,
    matchScore: "Great Fit",
    salary: "78k Yearly",
    specialty: "Inpatient",
    workSetting: "Assisted Living Facility",
    jobType: "Full-time",
  },
  {
    id: "2",
    title: "Pediatric Nurse Practitioner",
    company: "Johns Hopkins Medicine",
    companyLogo: logoUrl("hopkinsmedicine.org"),
    location: "Baltimore, MD",
    site: "Johns Hopkins Hospital",
    postedAt: "2d ago",
    isSaved: true,
    matchScore: "Good Fit",
    salary: "92k Yearly",
    specialty: "Outpatient",
    workSetting: "Children's Hospital",
    jobType: "Full-time",
  },
  {
    id: "3",
    title: "Family Nurse Practitioner",
    company: "MedStar Health",
    companyLogo: logoUrl("medstarhealth.org"),
    location: "Washington, DC",
    site: "MedStar Georgetown University Hospital",
    postedAt: "3d ago",
    isSaved: false,
    matchScore: "Great Fit",
    salary: "85k Yearly",
    specialty: "Primary Care",
    workSetting: "Outpatient Clinic",
    jobType: "Full-time",
  },
  {
    id: "4",
    title: "Acute Care Nurse Practitioner",
    company: "Cleveland Clinic",
    location: "Cleveland, OH",
    site: "Cleveland Clinic Main Campus",
    postedAt: "4d ago",
    isSaved: false,
    matchScore: null,
    salary: "95k Yearly",
    specialty: "Inpatient",
    workSetting: "Acute Care Hospital",
    jobType: "Part-time",
  },
  {
    id: "5",
    title: "Psychiatric Mental Health NP",
    company: "Kaiser Permanente",
    location: "Oakland, CA",
    site: "Kaiser Permanente Oakland Medical Center",
    postedAt: "5d ago",
    isSaved: false,
    matchScore: "Great Fit",
    salary: "88k Yearly",
    specialty: "Behavioral Health",
    workSetting: "Behavioral Health / Psychiatric Facility",
    jobType: "Full-time",
  },
  {
    id: "6",
    title: "Senior Clinical Nurse Specialist – Adult-Gerontology Acute Care and Primary Care Dual Certification",
    company: "Mayo Clinic",
    location: "Rochester, MN",
    site: "Mayo Clinic Rochester",
    postedAt: "6d ago",
    isSaved: false,
    matchScore: "Good Fit",
    salary: "105k Yearly",
    specialty: "Acute & Primary Care",
    workSetting: "Inpatient Rehabilitation Facility",
    jobType: "Full-time",
  },
  {
    id: "7",
    title: "Women's Health Nurse Practitioner",
    company: "Planned Parenthood",
    location: "New York, NY",
    site: "Planned Parenthood Manhattan",
    postedAt: "1d ago",
    isSaved: false,
    matchScore: "Great Fit",
    salary: "82k Yearly",
    specialty: "Outpatient",
    workSetting: "Community Health Center",
    jobType: "Part-time",
  },
  {
    id: "8",
    title: "Emergency Nurse Practitioner",
    company: "HCA Healthcare",
    location: "Nashville, TN",
    site: "HCA TriStar Centennial",
    postedAt: "2d ago",
    isSaved: false,
    matchScore: null,
    salary: "98k Yearly",
    specialty: "Emergency",
    workSetting: "Urgent Care",
    jobType: "Per diem",
  },
  {
    id: "9",
    title: "Neonatal Nurse Practitioner",
    company: "Children's National",
    location: "Washington, DC",
    site: "Children's National Main Campus",
    postedAt: "3d ago",
    isSaved: true,
    matchScore: "Good Fit",
    salary: "102k Yearly",
    specialty: "NICU",
    workSetting: "Children's Hospital",
    jobType: "Full-time",
  },
  {
    id: "10",
    title: "Oncology Nurse Practitioner",
    company: "Memorial Sloan Kettering",
    location: "New York, NY",
    site: "Memorial Sloan Kettering Cancer Center",
    postedAt: "4d ago",
    isSaved: false,
    matchScore: "Great Fit",
    salary: "115k Yearly",
    specialty: "Oncology",
    workSetting: "Acute Care Hospital",
    jobType: "Full-time",
  },
];

/** Extended job details for detail page — merge with base listing */
const jobDetails: Record<
  string,
  Pick<JobListing, "description" | "requirements" | "benefits" | "aiInsights">
> = {
  "1": {
    description:
      "Join our team as a Geriatric Nurse Practitioner and make a meaningful impact on the lives of seniors. You will provide comprehensive primary care to older adults in our skilled nursing and assisted living facilities, managing chronic conditions and promoting wellness.",
    requirements: ["ANCC or AANP certification", "2+ years geriatric experience", "Active state NP license", "DEA registration"],
    benefits: ["Health, dental, vision", "401(k) match", "CE allowance", "Flexible scheduling"],
    aiInsights: {
      summary: "This role focuses on orthopedic rehabilitation and graduate development. Strong fit for new grads seeking structured mentorship.",
      strongMatches: ["Manual therapy techniques", "Exercise prescription", "Patient education", "EMR documentation"],
      recommendedPrep: ["Review APTA's outpatient guidelines", "Familiarize yourself with Epic EMR system"],
    },
  },
  "2": {
    description:
      "Johns Hopkins Medicine seeks a Pediatric Nurse Practitioner to join our outpatient pediatric team. You will provide primary care to children from birth through adolescence, including well-child visits, acute care, and chronic disease management.",
    requirements: ["PNP certification", "Maryland NP license", "BLS certification", "1+ year pediatric experience"],
    benefits: ["Competitive salary", "Tuition reimbursement", "Relocation assistance", "Professional development"],
    aiInsights: {
      summary: "Academic medical center setting with strong teaching and research opportunities.",
      strongMatches: ["Pediatric assessment", "Family-centered care", "Vaccination protocols"],
      recommendedPrep: ["Review AAP guidelines", "Pediatric growth assessment"],
    },
  },
  "3": {
    description:
      "MedStar Health is looking for a Family Nurse Practitioner to provide comprehensive primary care across the lifespan. You will work in an outpatient setting serving diverse patient populations with a focus on preventive care and chronic disease management.",
    requirements: ["FNP certification", "DC or MD NP license", "2+ years primary care experience"],
    benefits: ["Comprehensive benefits", "Loan repayment eligible", "CME allowance", "Work-life balance"],
    aiInsights: {
      summary: "Large health system with diverse patient populations and strong interdisciplinary collaboration.",
      strongMatches: ["Chronic disease management", "Preventive care", "Care coordination"],
      recommendedPrep: ["Review primary care protocols", "Population health basics"],
    },
  },
};

const defaultDetails = {
  description:
    "We are seeking a qualified healthcare professional to join our team. You will provide high-quality patient care and work collaboratively with our multidisciplinary team.",
  requirements: ["Relevant certification", "Active state license", "BLS certification"],
  benefits: ["Health insurance", "401(k)", "Paid time off", "Professional development"],
  aiInsights: {
    summary: "This role offers growth opportunities and a supportive team environment.",
    strongMatches: ["Clinical skills", "Communication", "Documentation"],
    recommendedPrep: ["Review job requirements", "Prepare for behavioral interview"],
  },
};

export function getJobWithDetails(job: JobListing): JobListing {
  const details = jobDetails[job.id] ?? defaultDetails;
  return { ...job, ...details };
}

/** Resolve a listing by id — used for job detail navigation */
export function getJobListingById(id: string): JobListing | undefined {
  return recommendedJobs.find((j) => j.id === id);
}

/** Sites that have posted jobs — for Company/Site filter */
export const SITES_WITH_JOBS = Array.from(
  new Set(recommendedJobs.map((j) => j.site).filter(Boolean))
).sort() as string[];

/** All unique benefits from job postings — for Benefits filter */
export const JOB_BENEFITS = Array.from(
  new Set(
    Object.values(jobDetails).flatMap((d) => d.benefits ?? []).concat(defaultDetails.benefits ?? [])
  )
).sort();

/** Suggestion group for job search predictive — matches SuggestionGroup in job-search-bar */
export interface JobSearchSuggestionGroup {
  category: "jobTitle" | "benefits" | "keyword" | "siteOrCompany";
  label: string;
  items: string[];
}

/** Build search suggestions from mock jobs — natural phrases students would type */
export function getJobSearchSuggestions(): JobSearchSuggestionGroup[] {
  const jobTitles = Array.from(
    new Set(
      recommendedJobs.map((j) => {
        const t = j.title.replace(/ – .*$/, "").replace(/,.*$/, "").trim();
        return `${t} jobs`;
      })
    )
  ).slice(0, 6);

  const benefits = JOB_BENEFITS.slice(0, 6).map((b) =>
    /loan|tuition|relocation|ce allowance|cme/i.test(b) ? `${b} jobs` : b
  );

  const specialties = Array.from(
    new Set(recommendedJobs.map((j) => j.specialty).filter(Boolean))
  ).sort() as string[];
  const workSettings = Array.from(
    new Set(recommendedJobs.map((j) => j.workSetting).filter(Boolean))
  ).sort() as string[];
  const keywords = [
    ...specialties.map((s) => `${s} jobs`),
    ...workSettings.slice(0, 3),
  ].slice(0, 6);

  const companies = Array.from(new Set(recommendedJobs.map((j) => j.company))).sort();
  const siteNames = SITES_WITH_JOBS.map((s) =>
    s.length > 25 ? s.split(" ").slice(0, 2).join(" ") : s
  );
  const sitesAndCompanies = [...new Set([...companies, ...siteNames])].slice(0, 6);

  return [
    { category: "jobTitle", label: "Job titles", items: jobTitles },
    { category: "benefits", label: "Benefits", items: benefits },
    { category: "keyword", label: "Keywords", items: keywords },
    { category: "siteOrCompany", label: "Sites & companies", items: sitesAndCompanies },
  ];
}

export interface OrganisationListing {
  id: string;
  name: string;
  logo?: string;
  locationsCount: number;
  openingCount: number;
  salaryRange: string;
  experienceRange: string;
  statusChip: "Ongoing" | "Worked here" | string;
  isSaved?: boolean;
}

export const recommendedOrganisations: OrganisationListing[] = [
  {
    id: "org-1",
    name: "MedStar Health",
    logo: logoUrl("medstarhealth.org"),
    locationsCount: 30,
    openingCount: 12,
    salaryRange: "$32K - $102K",
    experienceRange: "0-12+y Experience",
    statusChip: "Ongoing",
    isSaved: false,
  },
  {
    id: "org-2",
    name: "Magellan Health",
    logo: logoUrl("magellanhealth.com"),
    locationsCount: 30,
    openingCount: 12,
    salaryRange: "$32K - $102K",
    experienceRange: "0-12+y Experience",
    statusChip: "Worked here",
    isSaved: false,
  },
  {
    id: "org-3",
    name: "Johns Hopkins Medicine",
    logo: logoUrl("hopkinsmedicine.org"),
    locationsCount: 24,
    openingCount: 18,
    salaryRange: "$45K - $115K",
    experienceRange: "0-5y Experience",
    statusChip: "Ongoing",
    isSaved: false,
  },
  {
    id: "org-4",
    name: "Mayo Clinic",
    logo: logoUrl("mayoclinic.org"),
    locationsCount: 18,
    openingCount: 22,
    salaryRange: "$55K - $125K",
    experienceRange: "0-12+y Experience",
    statusChip: "Worked here",
    isSaved: true,
  },
  {
    id: "org-5",
    name: "Cleveland Clinic",
    logo: logoUrl("clevelandclinic.org"),
    locationsCount: 32,
    openingCount: 15,
    salaryRange: "$42K - $98K",
    experienceRange: "0-12+y Experience",
    statusChip: "Ongoing",
    isSaved: false,
  },
  {
    id: "org-6",
    name: "Kaiser Permanente",
    logo: logoUrl("kaiserpermanente.org"),
    locationsCount: 45,
    openingCount: 28,
    salaryRange: "$48K - $110K",
    experienceRange: "0-12+y Experience",
    statusChip: "Ongoing",
    isSaved: false,
  },
];
