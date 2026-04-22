// Local Image Management for Exxat One
// All images are managed locally without external dependencies

export type ImageCategory = 
  | 'hospital'
  | 'clinic'
  | 'education'
  | 'students'
  | 'technology'
  | 'team'
  | 'general';

export interface ImageMetadata {
  id: string;
  category: ImageCategory;
  fileName: string;
  altText: string;
  width?: number;
  height?: number;
}

// Medical education image IDs for consistency
export const MEDICAL_IMAGE_IDS = {
  // Hospital & Clinical Settings
  HOSPITAL_ENTRANCE: 'hospital-entrance',
  HOSPITAL_CORRIDOR: 'hospital-corridor',
  OPERATING_ROOM: 'operating-room',
  ICU_WARD: 'icu-ward',
  EMERGENCY_ROOM: 'emergency-room',
  
  // Clinic & Outpatient Settings
  CLINIC_EXAM_ROOM: 'clinic-exam-room',
  CLINIC_WAITING: 'clinic-waiting',
  DOCTOR_PATIENT: 'doctor-patient',
  
  // Education & Training
  LECTURE_HALL: 'lecture-hall',
  MEDICAL_LAB: 'medical-lab',
  SIMULATION_CENTER: 'simulation-center',
  ANATOMY_LAB: 'anatomy-lab',
  UNIVERSITY_CAMPUS: 'university-campus',
  MEDICAL_CLASSROOM: 'medical-classroom',
  
  // Students & Healthcare Professionals
  MEDICAL_STUDENTS: 'medical-students',
  NURSING_STUDENTS: 'nursing-students',
  STUDENT_STUDY_GROUP: 'student-study-group',
  HEALTHCARE_TEAM: 'healthcare-team',
  MENTOR_STUDENT: 'mentor-student',
  MEDICAL_STUDENTS_HOSPITAL: 'medical-students-hospital',
  HEALTHCARE_TRAINING: 'healthcare-training',
  
  // Conferences & Events
  MEDICAL_CONFERENCE: 'medical-conference',
  
  // Technology & Equipment
  MEDICAL_EQUIPMENT: 'medical-equipment',
  ULTRASOUND_MACHINE: 'ultrasound-machine',
  XRAY_IMAGING: 'xray-imaging',
  COMPUTER_WORKSTATION: 'computer-workstation',
};

// Component-specific image mappings
export const COMPONENT_IMAGES = {
  hero: MEDICAL_IMAGE_IDS.HOSPITAL_ENTRANCE,
  services: MEDICAL_IMAGE_IDS.HEALTHCARE_TEAM,
  locations: MEDICAL_IMAGE_IDS.HOSPITAL_CORRIDOR,
  partners: MEDICAL_IMAGE_IDS.MEDICAL_LAB,
  success: MEDICAL_IMAGE_IDS.MEDICAL_STUDENTS,
  universities: MEDICAL_IMAGE_IDS.LECTURE_HALL,
};

// Get alt text for images
export function getImageAltText(imageId: string): string {
  const altTexts: Record<string, string> = {
    [MEDICAL_IMAGE_IDS.HOSPITAL_ENTRANCE]: 'Modern hospital entrance with professional healthcare facility',
    [MEDICAL_IMAGE_IDS.HOSPITAL_CORRIDOR]: 'Clean hospital corridor with medical staff',
    [MEDICAL_IMAGE_IDS.OPERATING_ROOM]: 'State-of-the-art operating room with surgical equipment',
    [MEDICAL_IMAGE_IDS.ICU_WARD]: 'Intensive care unit with monitoring equipment',
    [MEDICAL_IMAGE_IDS.EMERGENCY_ROOM]: 'Emergency department ready for patient care',
    [MEDICAL_IMAGE_IDS.CLINIC_EXAM_ROOM]: 'Outpatient clinic examination room',
    [MEDICAL_IMAGE_IDS.CLINIC_WAITING]: 'Comfortable clinic waiting area',
    [MEDICAL_IMAGE_IDS.DOCTOR_PATIENT]: 'Doctor consulting with patient in exam room',
    [MEDICAL_IMAGE_IDS.LECTURE_HALL]: 'Medical school lecture hall with students',
    [MEDICAL_IMAGE_IDS.MEDICAL_LAB]: 'Medical laboratory for clinical training',
    [MEDICAL_IMAGE_IDS.SIMULATION_CENTER]: 'Medical simulation center for hands-on training',
    [MEDICAL_IMAGE_IDS.ANATOMY_LAB]: 'Anatomy laboratory for medical education',
    [MEDICAL_IMAGE_IDS.UNIVERSITY_CAMPUS]: 'University campus with modern facilities',
    [MEDICAL_IMAGE_IDS.MEDICAL_CLASSROOM]: 'Medical classroom with students',
    [MEDICAL_IMAGE_IDS.MEDICAL_STUDENTS]: 'Group of medical students in professional attire',
    [MEDICAL_IMAGE_IDS.NURSING_STUDENTS]: 'Nursing students in clinical training',
    [MEDICAL_IMAGE_IDS.STUDENT_STUDY_GROUP]: 'Medical students collaborating in study group',
    [MEDICAL_IMAGE_IDS.HEALTHCARE_TEAM]: 'Diverse healthcare team working together',
    [MEDICAL_IMAGE_IDS.MENTOR_STUDENT]: 'Experienced physician mentoring medical student',
    [MEDICAL_IMAGE_IDS.MEDICAL_STUDENTS_HOSPITAL]: 'Medical students in hospital setting',
    [MEDICAL_IMAGE_IDS.HEALTHCARE_TRAINING]: 'Healthcare professionals in training',
    [MEDICAL_IMAGE_IDS.MEDICAL_CONFERENCE]: 'Medical conference with attendees',
    [MEDICAL_IMAGE_IDS.MEDICAL_EQUIPMENT]: 'Modern medical equipment and technology',
    [MEDICAL_IMAGE_IDS.ULTRASOUND_MACHINE]: 'Ultrasound machine for diagnostic imaging',
    [MEDICAL_IMAGE_IDS.XRAY_IMAGING]: 'X-ray imaging equipment in radiology department',
    [MEDICAL_IMAGE_IDS.COMPUTER_WORKSTATION]: 'Medical workstation with electronic health records',
  };

  return altTexts[imageId] || 'Medical education and healthcare image';
}

// Export for compatibility
export const MEDICAL_IMAGES = MEDICAL_IMAGE_IDS;