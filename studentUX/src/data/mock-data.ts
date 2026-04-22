// Centralized mock data for Exxat One application

export const mockStudentNames = [
  "Emma Wilson",
  "John Smith",
  "Sarah Johnson",
  "Michael Davis",
  "Jessica Chen",
  "Alex Rodriguez",
  "Maria Rodriguez",
  "Kevin Thompson",
  "Lisa Thompson",
  "Madison Clark",
  "David Park",
  "Ashley Martinez",
  "Christopher Lee",
  "Amanda Brown",
  "Ryan Garcia",
  "Nicole Taylor",
  "Brandon White",
  "Stephanie Lewis",
  "Justin Harris",
  "Lauren Martin",
  "Andrew Young",
  "Melissa King",
  "Daniel Wright",
  "Rebecca Scott",
];

export const mockSchoolNames = [
  "University of California",
  "Stanford University",
  "Harvard Medical School",
  "Johns Hopkins University",
  "Duke University",
  "Northwestern University",
  "University of Pennsylvania",
  "Columbia University",
  "Yale University",
  "MIT",
  "University of Michigan",
  "UCLA",
];

export const mockProgramTypes = [
  "Physical Therapy",
  "Nursing",
  "Occupational Therapy",
  "Medical",
  "Pharmacy",
  "Dental",
  "Physician Assistant",
  "Public Health",
];

export const mockRequestTypes = [
  "By Student",
  "By Faculty",
  "By School",
];

export const mockReadinessStatuses = [
  "Ready",
  "Pending",
  "Action Required",
  "Not Started",
];

export const mockComplianceStatuses = [
  "Complete",
  "In Progress",
  "Pending",
  "Overdue",
];

export const mockPreceptorNames = [
  "Dr. Sarah Mitchell",
  "Dr. James Anderson",
  "Dr. Emily Roberts",
  "Dr. Michael Chang",
  "Dr. Patricia Garcia",
  "Dr. Robert Kim",
  "Dr. Jennifer Lopez",
  "Dr. David Williams",
  "Dr. Laura Martinez",
  "Dr. Thomas Brown",
  "Dr. Maria Hernandez",
  "Dr. Christopher Davis",
];

// Generate student schedule data
export function generateStudentScheduleData(count: number = 50) {
  return Array.from({ length: count }, (_, index) => {
    const startDate = new Date();
    
    // Create varied start dates from 15 days to 1 year:
    // First 5 items: 15-90 days ahead (near-term schedules)
    // Next 5 items: 91-365 days ahead (longer-term schedules)
    // Rest: random distribution 15-365 days
    let daysAhead: number;
    if (index < 5) {
      // First 5: 15-90 days (near-term)
      daysAhead = Math.floor(Math.random() * 76) + 15;
    } else if (index < 10) {
      // Next 5: 91-365 days (longer-term, up to 1 year)
      daysAhead = Math.floor(Math.random() * 275) + 91;
    } else {
      // Rest: random 15-365 days (full range)
      daysAhead = Math.floor(Math.random() * 351) + 15;
    }
    
    startDate.setDate(startDate.getDate() + daysAhead);
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + [28, 42, 56, 70, 84][index % 5]);
    
    const daysUntilStart = Math.ceil((startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.max(0, Math.ceil((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const progressPercent = Math.min(100, Math.floor((daysElapsed / totalDays) * 100));
    
    // Generate compliance percent with some variation
    // NOTE: Compliance requirements can come from schools OR site partners
    // Schools may require specific documentation/certifications before placement starts
    // 20% chance of 100%, 30% chance of high (85-99%), 50% chance of lower (70-84%)
    let compliancePercent: number;
    const rand = Math.random();
    if (rand < 0.2) {
      compliancePercent = 100; // 20% are fully compliant
    } else if (rand < 0.5) {
      compliancePercent = Math.floor(Math.random() * 15) + 85; // 30% are 85-99%
    } else {
      compliancePercent = Math.floor(Math.random() * 15) + 70; // 50% are 70-84%
    }
    
    // Readiness status is directly tied to compliance level
    // Students cannot be "Ready" without 100% compliance
    let readinessStatus: string;
    if (compliancePercent === 100) {
      readinessStatus = "Ready";
    } else if (compliancePercent >= 85) {
      // 85-99% could be "Pending" (working towards ready)
      readinessStatus = "Pending";
    } else {
      // Below 85% needs action from school/student
      readinessStatus = "Action Required";
    }
    
    // Add new activity and notification flags (more common for upcoming schedules)
    const hasNewActivity = index < 10 ? Math.random() > 0.6 : Math.random() > 0.8;
    const hasNotification = index < 10 ? Math.random() > 0.5 : Math.random() > 0.8;

    // Per-requirement compliance for matrix view (faculty bulk review)
    const reqKeys = ["CPR/BLS", "HIPAA", "Background", "Immunization", "TB Test", "Insurance", "Drug Screen"];
    const completeCount = Math.round((compliancePercent / 100) * reqKeys.length);
    const complianceRequirements = reqKeys.map((name, i) => ({
      key: name.replace(/\s+/g, "").toLowerCase(),
      name,
      status: i < completeCount ? "Complete" as const : (i === completeCount && compliancePercent < 100 ? "In Review" as const : "Missing" as const),
    }));

    return {
      id: `student-${1000 + index}`,
      scheduleId: `SCH${String(1000 + index).padStart(6, '0')}`,
      studentName: mockStudentNames[index % mockStudentNames.length],
      studentId: `STU${String(1000 + index).padStart(6, '0')}`,
      studentEmail: `${mockStudentNames[index % mockStudentNames.length].toLowerCase().replace(' ', '.')}@university.edu`,
      internshipName: `Clinical Rotation ${index + 1}`,
      courseName: ["NURS 401", "PT 502", "NURS 305", "PT 401", "NURS 501"][index % 5],
      availabilityName: ["Spring 2024 Clinical", "Fall 2024 Rotation", "Summer 2024 Internship", "Winter 2024 Clinical", "Spring 2024 Advanced"][index % 5],
      discipline: mockProgramTypes[index % mockProgramTypes.length],
      specialization: ["Cardiology", "Pediatrics", "Orthopedics", "Emergency Medicine", "Internal Medicine"][index % 5],
      siteName: ["Mayo Clinic", "Cleveland Clinic", "Johns Hopkins Hospital", "Massachusetts General", "UCSF Medical Center"][index % 5],
      location: ["Rochester, MN", "Cleveland, OH", "Baltimore, MD", "Boston, MA", "San Francisco, CA"][index % 5],
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      duration: ["4 weeks", "6 weeks", "8 weeks", "10 weeks", "12 weeks"][index % 5],
      readinessStatus,
      compliancePercent,
      stage: index < 10 ? "upcoming" : index < 40 ? "ongoing" : "completed",
      experienceType: ["Clinical", "Lab", "Community"][index % 3],
      daysUntilStart: Math.max(1, daysUntilStart), // Ensure at least 1 day
      progress: `Week ${Math.min(totalDays / 7, Math.floor(daysElapsed / 7) + 1)} of ${Math.ceil(totalDays / 7)}`,
      progressPercent,
      lastCheckin: generateRandomDate(-7, 0),
      completionDate: formatDate(endDate),
      finalStatus: ["Completed Successfully", "Completed with Distinction", "Completed"][index % 3],
      finalEvaluation: ["4.8/5.0", "4.5/5.0", "4.9/5.0", "5.0/5.0"][index % 4],
      hasNewActivity,
      hasNotification,
      complianceRequirements,
      preceptorName: mockPreceptorNames[index % mockPreceptorNames.length],
      preceptorTitle: ["Attending Physician", "Clinical Supervisor", "Senior Clinician", "Lead Practitioner"][index % 4],
    };
  });
}

// Generate slot request data
export function generateSlotRequestData(count: number = 30) {
  return Array.from({ length: count }, (_, index) => ({
    id: `request-${2000 + index}`,
    requestType: mockRequestTypes[index % mockRequestTypes.length],
    programName: mockProgramTypes[index % mockProgramTypes.length],
    schoolName: mockSchoolNames[index % mockSchoolNames.length],
    siteName: ["Mayo Clinic", "Cleveland Clinic", "Johns Hopkins Hospital", "Massachusetts General", "UCSF Medical Center"][index % 5],
    location: ["Rochester, MN", "Cleveland, OH", "Baltimore, MD", "Boston, MA", "San Francisco, CA"][index % 5],
    discipline: mockProgramTypes[index % mockProgramTypes.length],
    specialization: ["Cardiology", "Pediatrics", "Orthopedics", "Emergency Medicine", "Internal Medicine"][index % 5],
    slotsRequested: Math.floor(Math.random() * 10) + 1,
    requestDate: generateRandomDate(-30, 0),
    requestedBy: mockStudentNames[index % mockStudentNames.length],
    status: ["Pending", "Under Review", "Approved", "Declined"][Math.floor(Math.random() * 4)],
    priority: ["High", "Medium", "Low"][index % 3],
    daysAgo: Math.floor(Math.random() * 30) + 1,
  }));
}

// Generate approved slot data
export function generateApprovedSlotData(count: number = 50) {
  return Array.from({ length: count }, (_, index) => {
    const totalSlots = Math.floor(Math.random() * 15) + 5; // 5-20 slots
    const assignedStudents = Math.floor(Math.random() * totalSlots);
    
    return {
      id: `approved-${3000 + index}`,
      requestType: mockRequestTypes[index % mockRequestTypes.length],
      programName: mockProgramTypes[index % mockProgramTypes.length],
      schoolName: mockSchoolNames[index % mockSchoolNames.length],
      siteName: ["Mayo Clinic", "Cleveland Clinic", "Johns Hopkins Hospital", "Massachusetts General", "UCSF Medical Center"][index % 5],
      location: ["Rochester, MN", "Cleveland, OH", "Baltimore, MD", "Boston, MA", "San Francisco, CA"][index % 5],
      discipline: mockProgramTypes[index % mockProgramTypes.length],
      specialization: ["Cardiology", "Pediatrics", "Orthopedics", "Emergency Medicine", "Internal Medicine"][index % 5],
      totalSlots,
      assignedStudents,
      availableSlots: totalSlots - assignedStudents,
      approvalDate: generateRandomDate(-60, -1),
      startDate: generateRandomDate(0, 90),
      endDate: generateRandomDate(91, 180),
      duration: ["4 weeks", "6 weeks", "8 weeks", "10 weeks", "12 weeks"][index % 5],
      daysAgo: Math.floor(Math.random() * 60) + 1,
      approvedBy: ["Dr. Sarah Johnson", "Dr. Michael Chen", "Dr. Emily Rodriguez"][index % 3],
    };
  });
}

// Generate site partner data
export function generateSitePartnerData(count: number = 25) {
  return Array.from({ length: count }, (_, index) => ({
    id: `site-${4000 + index}`,
    siteName: ["Mayo Clinic", "Cleveland Clinic", "Johns Hopkins Hospital", "Massachusetts General", "UCSF Medical Center", "UCLA Medical Center", "Stanford Hospital"][index % 7],
    location: ["Rochester, MN", "Cleveland, OH", "Baltimore, MD", "Boston, MA", "San Francisco, CA", "Los Angeles, CA", "Palo Alto, CA"][index % 7],
    tier: ["Gold", "Silver", "Bronze"][index % 3],
    status: ["Active", "Pending", "Inactive"][Math.floor(Math.random() * 3)],
    totalSlots: Math.floor(Math.random() * 50) + 10,
    availableSlots: Math.floor(Math.random() * 20),
    activeStudents: Math.floor(Math.random() * 30),
    programs: Math.floor(Math.random() * 8) + 1,
    contactName: ["Dr. Sarah Johnson", "Dr. Michael Chen", "Dr. Emily Rodriguez", "Dr. James Wilson", "Dr. Maria Garcia"][index % 5],
    contactEmail: ["s.johnson@hospital.com", "m.chen@hospital.com", "e.rodriguez@hospital.com", "j.wilson@hospital.com", "m.garcia@hospital.com"][index % 5],
    contactPhone: ["(555) 123-4567", "(555) 234-5678", "(555) 345-6789", "(555) 456-7890", "(555) 567-8901"][index % 5],
    partnerSince: generateRandomDate(-1000, -100),
    lastActivity: generateRandomDate(-30, 0),
  }));
}

// ─── Slots/Availability Data (used by Slots, Requested Slots, Approved Slots pages) ──

const slotStates = ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"];
const slotCities = ["Birmingham", "Fairbanks", "Phoenix", "Little Rock", "Los Angeles", "Denver", "Hartford", "Dover", "Miami", "Atlanta", "Honolulu", "Boise", "Chicago", "Indianapolis", "Des Moines", "Topeka", "Louisville", "New Orleans", "Portland", "Baltimore", "Boston", "Detroit", "Minneapolis", "Jackson", "Kansas City", "Billings", "Omaha", "Las Vegas", "Concord", "Newark", "Albuquerque", "New York", "Charlotte", "Fargo", "Columbus", "Oklahoma City", "Portland", "Philadelphia", "Providence", "Charleston", "Sioux Falls", "Nashville", "Houston", "Salt Lake City", "Montpelier", "Richmond", "Seattle", "Charleston", "Milwaukee", "Cheyenne"];
const slotDisciplines = ["Physical Therapy", "Occupational Therapy", "Speech-Language Pathology", "Physical Therapy Assistant", "Occupational Therapy Assistant", "Audiology", "Respiratory Therapy", "Recreational Therapy"];
const slotSpecializations = ["Orthopedic", "Pediatric", "General", "Sports Medicine", "Neurological", "Geriatric", "Cardiovascular", "Acute Care", "Mental Health", "Hand Therapy", "Voice Disorders", "Stroke Rehabilitation", "Adult Rehabilitation", "Outpatient", "Wound Care", "Cardiac Rehabilitation"];
const slotDurations = ["6 weeks", "8 weeks", "10 weeks", "12 weeks", "14 weeks", "16 weeks", "18 weeks", "20 weeks"];
const slotExperienceTypes = ["Individual", "Group"];
const slotHospitalSites = [
  "Belmont - Park St", "Downtown - Main Campus", "Westside - Medical Center",
  "Northshore - Clinic", "Southside - Rehabilitation", "Eastgate - Outpatient",
  "Midtown - Specialty Care", "Riverside - Acute Care", "Hillcrest - Pediatric",
  "Valley - Orthopedic", "Summit - Cardiac", "Lakeside - Geriatric",
  "Parkview - Mental Health", "Crossroads - Emergency", "Harbor - Trauma Center",
];
const slotTimeIndicators = ["Just now", "5 minutes ago", "15 minutes ago", "30 minutes ago", "1 hour ago", "2 hours ago", "3 hours ago", "5 hours ago", "6 hours ago", "1 day ago", "2 days ago", "3 days ago", "4 days ago", "5 days ago", "1 week ago"];
const slotRequestTypes = ["student", "faculty", "school"];
const slotPrograms = ["Physical Therapy", "Nursing", "Occupational Therapy", "Respiratory Therapy", "Medical Assistant"];

function generateSlotRandomDate() {
  const start = new Date();
  const end = new Date();
  end.setMonth(start.getMonth() + 6);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateSlotEndDate(startDate: Date, duration: string) {
  const weeks = parseInt(duration.split(' ')[0]);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + (weeks * 7));
  return endDate;
}

function generateYearRoundDates() {
  const currentYear = new Date().getFullYear();
  return {
    startDate: new Date(currentYear, 0, 1),
    endDate: new Date(currentYear, 11, 31),
  };
}

function generateSlotsData() {
  const data = [];

  for (let i = 0; i < 120; i++) {
    const state = slotStates[Math.floor(Math.random() * slotStates.length)];
    const city = slotCities[Math.floor(Math.random() * slotCities.length)];
    const discipline = slotDisciplines[Math.floor(Math.random() * slotDisciplines.length)];
    const specialization = slotSpecializations[Math.floor(Math.random() * slotSpecializations.length)];
    const duration = slotDurations[Math.floor(Math.random() * slotDurations.length)];
    const experienceType = slotExperienceTypes[Math.floor(Math.random() * slotExperienceTypes.length)];
    const hospitalSite = slotHospitalSites[Math.floor(Math.random() * slotHospitalSites.length)];

    const isUnlimited = Math.random() < 0.3;
    const isYearRound = Math.random() < 0.3;

    let startDate: Date;
    let endDate: Date;
    let totalSlots: number;

    if (isYearRound) {
      const yearRoundDates = generateYearRoundDates();
      startDate = yearRoundDates.startDate;
      endDate = yearRoundDates.endDate;
    } else {
      startDate = generateSlotRandomDate();
      endDate = generateSlotEndDate(startDate, duration);
    }

    if (isUnlimited) {
      totalSlots = -1; // -1 represents unlimited
    } else {
      totalSlots = Math.floor(Math.random() * 25) + 8; // 8-32 slots
    }

    const totalRequest = isUnlimited ? Math.floor(Math.random() * 50) + 10 : Math.floor(Math.random() * totalSlots);
    const pendingReview = Math.floor(Math.random() * 5);

    const hasRecentRequest = Math.random() < 0.3;
    const isNewRequest = Math.random() < 0.15;
    const lastRequestTime = hasRecentRequest || isNewRequest ? slotTimeIndicators[Math.floor(Math.random() * slotTimeIndicators.length)] : null;

    const requestedBy = slotRequestTypes[Math.floor(Math.random() * slotRequestTypes.length)];
    const program = requestedBy === "school" ? slotPrograms[Math.floor(Math.random() * slotPrograms.length)] : null;

    const id = Math.floor(Math.random() * 999999999).toString();

    const disciplineAbbr = discipline === "Physical Therapy" ? "PT"
      : discipline === "Occupational Therapy" ? "OT"
      : discipline === "Speech-Language Pathology" ? "SLP"
      : discipline === "Physical Therapy Assistant" ? "PTA"
      : discipline === "Occupational Therapy Assistant" ? "OTA"
      : discipline === "Audiology" ? "AUD"
      : discipline === "Respiratory Therapy" ? "RT"
      : "REC";

    const name = `${state} - ${city}-${disciplineAbbr}-H1 2025`;

    data.push({
      id,
      name,
      experienceType,
      location: hospitalSite,
      discipline,
      specialization,
      totalSlots,
      totalRequest,
      pendingReview,
      duration,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      hasRecentRequest,
      isNewRequest,
      lastRequestTime,
      isUnlimited,
      isYearRound,
      requestedBy,
      program,
    });
  }

  return data;
}

export const slotsData = generateSlotsData();

// Utility function to generate random dates
export function generateRandomDate(minDaysFromNow: number, maxDaysFromNow: number): string {
  const now = new Date();
  const days = Math.floor(Math.random() * (maxDaysFromNow - minDaysFromNow + 1)) + minDaysFromNow;
  const date = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  return date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

// Utility function to format relative time
export function formatRelativeTime(daysAgo: number): string {
  if (daysAgo === 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  if (daysAgo < 7) return `${daysAgo} days ago`;
  if (daysAgo < 30) return `${Math.floor(daysAgo / 7)} weeks ago`;
  return `${Math.floor(daysAgo / 30)} months ago`;
}

// Utility function to format dates
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

// Export pre-generated datasets
export const studentScheduleData = generateStudentScheduleData(50);
export const slotRequestData = generateSlotRequestData(30);
export const approvedSlotData = generateApprovedSlotData(50);
export const sitePartnerData = generateSitePartnerData(25);