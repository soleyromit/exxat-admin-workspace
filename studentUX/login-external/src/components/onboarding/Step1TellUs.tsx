import { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Lightbulb, X, Check, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { OnboardingData } from '../OnboardingFlow';

interface Step1Props {
  onNext: (data: Partial<OnboardingData>) => void;
  initialData: OnboardingData;
}

const availableRoles = [
  'Staff Physical Therapist',
  'Physician Assistant',
  'Integrated Mental Health Therapist',
  'Occupational Therapist',
  'Speech Language Pathologist',
  'Clinical Nurse Specialist',
  'Nurse Practitioner',
  'Registered Nurse',
];

const availableLocations = [
  'New York, NY',
  'Los Angeles, CA',
  'Chicago, IL',
  'Houston, TX',
  'Phoenix, AZ',
  'Philadelphia, PA',
  'San Antonio, TX',
  'San Diego, CA',
  'Dallas, TX',
  'San Jose, CA',
  'Austin, TX',
  'Jacksonville, FL',
  'Fort Worth, TX',
  'Columbus, OH',
  'San Francisco, CA',
  'Charlotte, NC',
  'Indianapolis, IN',
  'Seattle, WA',
  'Denver, CO',
  'Boston, MA',
  'Nashville, TN',
  'Portland, OR',
  'Atlanta, GA',
  'Miami, FL',
  'Detroit, MI',
  'Las Vegas, NV',
  'Baltimore, MD',
  'Washington, DC',
  'Minneapolis, MN',
  'Tampa, FL',
  'California',
  'Texas',
  'Florida',
  'New York',
  'Pennsylvania',
  'Illinois',
  'Ohio',
  'Georgia',
  'North Carolina',
  'Michigan',
];

const availableSkills = [
  'Manual Therapy Techniques',
  'Empathy',
  'Therapeutic Exercise',
  'Analytical skills',
  'Gait Analysis',
  'Patient Assessment',
  'Manual Therapy',
  'Patient care',
  'Communication',
  'Time management',
  'Critical thinking',
  'Documentation',
];

export default function Step1TellUs({ onNext, initialData }: Step1Props) {
  const [roles, setRoles] = useState<string[]>(initialData.roles || []);
  const [location, setLocation] = useState(initialData.location || '');
  const [skills, setSkills] = useState<string[]>(initialData.skills || []);
  const [jobAlertsEnabled, setJobAlertsEnabled] = useState(initialData.jobAlertsEnabled ?? true);
  const [showRolesDropdown, setShowRolesDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showSkillsDropdown, setShowSkillsDropdown] = useState(false);
  const [roleSearch, setRoleSearch] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const rolesCardRef = useRef<HTMLDivElement>(null);
  const locationCardRef = useRef<HTMLDivElement>(null);
  const skillsCardRef = useRef<HTMLDivElement>(null);
  const rolesDropdownRef = useRef<HTMLDivElement>(null);
  const locationDropdownRef = useRef<HTMLDivElement>(null);

  // Auto-scroll function to bring form element into view
  const scrollToElement = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current && containerRef.current) {
      const element = ref.current;
      const container = containerRef.current;
      
      const elementRect = element.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      // Check if element is fully visible
      const isFullyVisible = 
        elementRect.top >= containerRect.top &&
        elementRect.bottom <= containerRect.bottom;
      
      if (!isFullyVisible) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  };

  // Click outside handler for roles dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (rolesDropdownRef.current && !rolesDropdownRef.current.contains(event.target as Node)) {
        setShowRolesDropdown(false);
      }
    };

    if (showRolesDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showRolesDropdown]);

  // Click outside handler for location dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node)) {
        setShowLocationDropdown(false);
      }
    };

    if (showLocationDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLocationDropdown]);

  const handleAddRole = (role: string) => {
    if (!roles.includes(role)) {
      setRoles([...roles, role]);
    }
    setShowRolesDropdown(false);
    setRoleSearch('');
  };

  const handleRemoveRole = (role: string) => {
    setRoles(roles.filter(r => r !== role));
  };

  const handleSelectLocation = (loc: string) => {
    setLocation(loc);
    setLocationSearch('');
    setShowLocationDropdown(false);
  };

  const toggleSkill = (skill: string) => {
    if (skills.includes(skill)) {
      setSkills(skills.filter(s => s !== skill));
    } else {
      setSkills([...skills, skill]);
    }
  };

  const handleNext = () => {
    onNext({
      roles,
      location,
      skills,
      jobAlertsEnabled,
    });
  };

  const isValid = roles.length > 0 && location.trim() !== '' && skills.length > 0;

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{
      backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 1280 812\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'1\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(129.45 97.4 -80.275 106.69 367 220)\\'><stop stop-color=\\'rgba(255,255,255,1)\\' offset=\\'0.052885\\'/><stop stop-color=\\'rgba(253,249,241,1)\\' offset=\\'1\\'/></radialGradient></defs></svg>')"
    }}>
      {/* Background texture */}
      <div className="absolute bg-[rgba(247,247,247,0.2)] inset-0" />

      {/* Progress Header */}
      <div className="absolute left-1/2 top-[24px] -translate-x-1/2 w-[768px] flex flex-col gap-[12px]">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-['Inter'] font-semibold text-[16px] leading-[24px] text-[#101828] tracking-[-0.3125px]">
              Step 1 of 3
            </p>
            <p className="font-['Inter'] font-normal text-[14px] leading-[20px] text-[#4a5565] tracking-[-0.1504px]">
              Let's Build Your Profile
            </p>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="bg-gray-200 h-[8px] rounded-full relative overflow-hidden">
          <motion.div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#fc52a1] to-[#f3d45b] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: '33%' }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div 
        ref={containerRef}
        className="absolute left-1/2 top-[112px] -translate-x-1/2 w-[768px] h-[calc(100vh-200px)] overflow-y-auto pb-[100px]"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#e5e7eb transparent',
        }}
      >
        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-['Inter'] font-bold text-[20px] leading-[1.2] text-[#101828] tracking-[-0.2px] mb-[32px]"
        >
          👋 Hello! Share a bit about yourself so we can find your perfect clinical match
        </motion.h1>

        {/* Form Cards */}
        <div className="flex flex-col gap-[24px]">
          {/* Question 1: Roles */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-[16px] p-[24px] shadow-sm border border-gray-100 relative"
            ref={rolesCardRef}
          >
            <div className="flex gap-[16px]">
              <div className="bg-[rgba(255,255,255,0.3)] rounded-[8px] w-[64px] h-[64px] flex items-center justify-center shrink-0">
                <Search className="w-[36px] h-[36px]" />
              </div>
              <div className="flex-1">
                <p className="font-['Inter'] font-medium text-[14px] leading-[16px] text-black mb-[12px]">
                  Let's get specific about your discipline
                </p>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search roles..."
                    value={roleSearch}
                    onChange={(e) => {
                      setRoleSearch(e.target.value);
                      setShowRolesDropdown(true);
                    }}
                    onFocus={() => {
                      setShowRolesDropdown(true);
                      scrollToElement(rolesCardRef);
                    }}
                    onClick={() => scrollToElement(rolesCardRef)}
                    className="w-full h-[48px] px-[16px] border border-gray-300 rounded-[12px] font-['Inter'] text-[14px] focus:outline-none focus:border-[#39393c]"
                  />
                  
                  {/* Dropdown */}
                  <AnimatePresence>
                    {showRolesDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-[52px] left-0 right-0 bg-white rounded-[12px] shadow-lg border border-gray-200 max-h-[200px] overflow-y-auto z-10"
                        ref={rolesDropdownRef}
                      >
                        {availableRoles
                          .filter(role => role.toLowerCase().includes(roleSearch.toLowerCase()))
                          .filter(role => !roles.includes(role))
                          .map(role => (
                            <button
                              key={role}
                              onClick={() => handleAddRole(role)}
                              className="w-full text-left px-[16px] py-[12px] hover:bg-gray-50 font-['Inter'] text-[14px] text-[#101828]"
                            >
                              {role}
                            </button>
                          ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Selected Roles Tags */}
                {roles.length > 0 && (
                  <div className="flex flex-wrap gap-[8px] mt-[12px]">
                    {roles.map(role => (
                      <div
                        key={role}
                        className="bg-[#39393c] rounded-[8px] px-[12px] py-[6px] flex items-center gap-[8px]"
                      >
                        <span className="font-['Inter'] text-[14px] text-white">{role}</span>
                        <button
                          onClick={() => handleRemoveRole(role)}
                          className="hover:bg-white/20 rounded-full p-[2px] transition-colors"
                        >
                          <X className="w-[14px] h-[14px] text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Gradient Separator */}
          <div className="h-[1px] bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

          {/* Question 2: Location */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-[16px] p-[24px] shadow-sm border border-gray-100 relative"
            ref={locationCardRef}
          >
            <div className="flex gap-[16px]">
              <div className="bg-[rgba(255,255,255,0.3)] rounded-[8px] w-[64px] h-[64px] flex items-center justify-center shrink-0">
                <MapPin className="w-[36px] h-[36px]" />
              </div>
              <div className="flex-1">
                <p className="font-['Inter'] font-medium text-[14px] leading-[16px] text-black mb-[12px]">
                  Where do you want to work?
                </p>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter city or state..."
                    value={locationSearch}
                    onChange={(e) => {
                      setLocationSearch(e.target.value);
                      setShowLocationDropdown(true);
                    }}
                    onFocus={() => {
                      setShowLocationDropdown(true);
                      scrollToElement(locationCardRef);
                    }}
                    onClick={() => scrollToElement(locationCardRef)}
                    className="w-full h-[48px] px-[16px] border border-gray-300 rounded-[12px] font-['Inter'] text-[14px] focus:outline-none focus:border-[#39393c]"
                  />
                  
                  {/* Dropdown */}
                  <AnimatePresence>
                    {showLocationDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-[52px] left-0 right-0 bg-white rounded-[12px] shadow-lg border border-gray-200 max-h-[200px] overflow-y-auto z-10"
                        ref={locationDropdownRef}
                      >
                        {availableLocations
                          .filter(loc => loc.toLowerCase().includes(locationSearch.toLowerCase()))
                          .filter(loc => loc !== location)
                          .map(loc => (
                            <button
                              key={loc}
                              onClick={() => handleSelectLocation(loc)}
                              className="w-full text-left px-[16px] py-[12px] hover:bg-gray-50 font-['Inter'] text-[14px] text-[#101828]"
                            >
                              {loc}
                            </button>
                          ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {location && (
                  <div className="flex flex-wrap gap-[8px] mt-[12px]">
                    <div className="bg-[#39393c] rounded-[8px] px-[12px] py-[6px] flex items-center gap-[8px]">
                      <span className="font-['Inter'] text-[14px] text-white">{location}</span>
                      <button
                        onClick={() => setLocation('')}
                        className="hover:bg-white/20 rounded-full p-[2px] transition-colors"
                      >
                        <X className="w-[14px] h-[14px] text-white" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Gradient Separator */}
          <div className="h-[1px] bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

          {/* Question 3: Skills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-[16px] p-[24px] shadow-sm border border-gray-100 relative"
            ref={skillsCardRef}
          >
            <div className="flex gap-[16px]">
              <div className="bg-[rgba(255,255,255,0.3)] rounded-[8px] w-[64px] h-[64px] flex items-center justify-center shrink-0">
                <Lightbulb className="w-[36px] h-[36px]" />
              </div>
              <div className="flex-1">
                <p className="font-['Inter'] font-medium text-[14px] leading-[16px] text-black mb-[12px]">
                  What are your top skills?
                </p>
                <p className="font-['Inter'] text-[12px] text-[#6b7280] mb-[16px]">
                  Select all that apply
                </p>
                
                {/* Skills Grid */}
                <div 
                  className="flex flex-wrap gap-[8px]"
                  onClick={() => scrollToElement(skillsCardRef)}
                >
                  {availableSkills.map(skill => {
                    const isSelected = skills.includes(skill);
                    return (
                      <button
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        className={`px-[12px] py-[8px] rounded-[8px] border flex items-center gap-[6px] transition-all ${
                          isSelected
                            ? 'bg-[#f3f4f6] border-[#39393c] text-[#101828]'
                            : 'bg-white border-gray-300 text-[#6b7280] hover:border-gray-400'
                        }`}
                      >
                        {isSelected ? (
                          <Check className="w-[14px] h-[14px] text-[#39393c]" />
                        ) : (
                          <Plus className="w-[14px] h-[14px]" />
                        )}
                        <span className="font-['Inter'] text-[14px]">{skill}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Job Alerts Toggle */}
                <div className="mt-[24px] pt-[24px] border-t border-gray-200">
                  <label className="flex items-center gap-[12px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={jobAlertsEnabled}
                      onChange={(e) => setJobAlertsEnabled(e.target.checked)}
                      className="w-[20px] h-[20px] rounded accent-[#39393c]"
                    />
                    <span className="font-['Inter'] text-[14px] text-[#101828]">
                      Send me weekly job alerts for matching opportunities
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Next Button - Fixed at bottom */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-[32px] left-1/2 -translate-x-1/2"
      >
        <button
          onClick={handleNext}
          disabled={!isValid}
          className={`px-[32px] py-[14px] rounded-[8px] font-['Inter'] font-medium text-[16px] text-white transition-all ${
            isValid
              ? 'bg-[#39393c] hover:bg-[#39393c]/90 cursor-pointer'
              : 'bg-[#39393c]/40 cursor-not-allowed'
          }`}
        >
          Next
        </button>
      </motion.div>
    </div>
  );
}