// Profile mock data — aligned with Figma design

export interface ProfilePersonalInfo {
  preferredName: string;
  pronouns: string;
  yearOfBirth: string;
  maritalStatus: string;
  gender: string;
  raceEthnicity: string;
  primaryEmail: string;
  secondaryEmails?: string[];
  phoneNumber: string;
  npi: string;
  emergencyContact: string;
}

export interface ProfileAddress {
  addressLine1: string;
  addressLine2: string;
  city: string;
  stateTerritory: string;
  zipCode: string;
  country: string;
}

export interface ProfileEducation {
  school: string;
  degree: string;
  years: string;
  abbreviation?: string;
}

export interface ProfileWorkExperience {
  title: string;
  organization: string;
  location: string;
  years: string;
  description: string;
}

export interface ProfileClinicalExperience {
  title: string;
  organization: string;
  location: string;
  years: string;
  description: string;
}

export interface ProfileLanguage {
  language: string;
  speaking: string;
  reading: string;
  writing: string;
}

export interface ProfileMembership {
  name: string;
  membershipNumber: string;
  validFrom: string;
  validTo: string;
  category: string;
  status: string;
  positionHeld?: string;
  description?: string;
}

export interface ProfileLicensure {
  name: string;
  number: string;
  stateTerritory?: string;
  validFrom: string;
  validTo: string;
  note?: string;
}

export interface ProfilePublication {
  title: string;
  journal: string;
  citation: string;
  authors: string;
}

export interface ProfileAward {
  title: string;
  organization: string;
  year: string;
}

export interface ProfileResume {
  fileName: string;
  size: string;
  uploadedDate: string;
}

export interface ProfileJobPreferences {
  desiredRole: string;
  preferredLocation: string;
  patientCareAreas: string;
  workPriorities: string;
}

export interface ProfileData {
  personal: ProfilePersonalInfo;
  currentAddress: ProfileAddress;
  permanentAddress: ProfileAddress;
  professionalSummary: string;
  professionalInterests: string[];
  skills: {
    technical: string[];
    others: string[];
    languages: ProfileLanguage[];
  };
  education: ProfileEducation[];
  workExperience: ProfileWorkExperience[];
  clinicalExperience: ProfileClinicalExperience[];
  memberships: ProfileMembership[];
  licensures: ProfileLicensure[];
  accomplishments: {
    publications: ProfilePublication[];
    awards: ProfileAward[];
  };
  veteranStatus: {
    isVeteran: boolean;
    details?: string;
  };
  resume?: ProfileResume;
  jobPreferences?: ProfileJobPreferences;
}

export const mockProfileData: ProfileData = {
  personal: {
    preferredName: "William",
    pronouns: "He/Him",
    yearOfBirth: "1999",
    maritalStatus: "",
    gender: "",
    raceEthnicity: "",
    primaryEmail: "william.johnson@university.edu",
    phoneNumber: "(555) 123-4567",
    npi: "67856476855",
    emergencyContact: "(555) 678-1234",
  },
  currentAddress: {
    addressLine1: "3421 University Park Blvd",
    addressLine2: "Apt 4B",
    city: "Los Angeles",
    stateTerritory: "California",
    zipCode: "90089",
    country: "United States",
  },
  permanentAddress: {
    addressLine1: "1245 Oak Street",
    addressLine2: "",
    city: "San Diego",
    stateTerritory: "California",
    zipCode: "92101",
    country: "United States",
  },
  professionalSummary:
    "Third-year Doctor of Physical Therapy student at USC with clinical experience in outpatient orthopedics, sports medicine, and geriatric rehabilitation. Strong interest in manual therapy and evidence-based practice. Completed over 800 clinical hours across acute care and outpatient settings.",
  professionalInterests: [
    "Orthopedic Physical Therapy",
    "Sports Rehabilitation",
    "Manual Therapy",
    "Geriatric Rehabilitation",
  ],
  skills: {
    technical: [
      "Manual Therapy",
      "Therapeutic Exercise",
      "Gait Analysis",
      "Patient Assessment",
      "EMR Documentation",
      "Dry Needling (Certified)",
    ],
    others: ["Patient Communication", "Empathy", "Time Management"],
    languages: [
      {
        language: "English",
        speaking: "Native or bilingual proficiency",
        reading: "Native or bilingual proficiency",
        writing: "Native or bilingual proficiency",
      },
      {
        language: "Spanish",
        speaking: "Professional working proficiency",
        reading: "Professional working proficiency",
        writing: "Limited working proficiency",
      },
    ],
  },
  education: [
    {
      school: "University of Southern California",
      degree: "Doctor of Physical Therapy",
      years: "2022 - 2025",
      abbreviation: "DPT",
    },
    {
      school: "UCLA",
      degree: "Bachelor of Science in Kinesiology",
      years: "2018 - 2022",
      abbreviation: "BS",
    },
  ],
  workExperience: [
    {
      title: "Rehabilitation Aide",
      organization: "Providence Saint John's Health Center",
      location: "Santa Monica, CA",
      years: "2020 - 2022",
      description:
        "Assisted physical therapists with patient setup, equipment preparation, and therapeutic exercises. Maintained clean and organized treatment areas. Supported documentation and scheduling.",
    },
  ],
  clinicalExperience: [
    {
      title: "Student Physical Therapist",
      organization: "Cedars-Sinai Medical Center",
      location: "Los Angeles, CA",
      years: "Jan 2025 - Apr 2025",
      description:
        "Outpatient orthopedic rotation. Evaluated and treated patients with musculoskeletal conditions. Implemented manual therapy techniques and therapeutic exercise programs under licensed PT supervision.",
    },
    {
      title: "Student Physical Therapist",
      organization: "Keck Hospital of USC",
      location: "Los Angeles, CA",
      years: "Sep 2024 - Dec 2024",
      description:
        "Acute care rotation. Worked with post-surgical and medically complex patients. Performed mobility assessments and discharge planning with interdisciplinary teams.",
    },
  ],
  memberships: [
    {
      name: "American Physical Therapy Association",
      membershipNumber: "APTA-894521",
      validFrom: "08/15/2022",
      validTo: "08/14/2026",
      category: "Student Member",
      status: "Active",
    },
  ],
  licensures: [
    {
      name: "Physical Therapist License (Pending)",
      number: "CA-PT-APPL-2025-0847",
      validFrom: "—",
      validTo: "Expected: 06/2025",
    },
  ],
  accomplishments: {
    publications: [
      {
        title: "Effects of Early Mobilization on Post-TKA Outcomes: A Scoping Review",
        journal: "Journal of Orthopaedic & Sports Physical Therapy, 54(2), 112-124.",
        citation: "J Orthop Sports Phys Ther. 2024;54(2):112-124.",
        authors: "Morgan, S., Chen, L., & Patel, R. (2024)",
      },
    ],
    awards: [
      {
        title: "Outstanding Clinical Performance Award",
        organization: "USC Division of Biokinesiology and Physical Therapy",
        year: "2024",
      },
      {
        title: "Dean's List",
        organization: "UCLA",
        year: "2019 - 2022",
      },
    ],
  },
  veteranStatus: {
    isVeteran: false,
  },
  resume: {
    fileName: "Sarah_Morgan_Resume_2024.pdf",
    size: "127 KB",
    uploadedDate: "11/15/2024",
  },
  jobPreferences: {
    desiredRole: "I love working in physical therapy domain.",
    preferredLocation: "Los Angeles, CA and surrounding areas. Open to relocation for the right opportunity.",
    patientCareAreas: "Orthopedic, sports rehabilitation, and geriatric care. Interested in outpatient and acute care settings.",
    workPriorities: "Work-life balance, mentorship from experienced PTs, and opportunities for continuing education.",
  },
};
