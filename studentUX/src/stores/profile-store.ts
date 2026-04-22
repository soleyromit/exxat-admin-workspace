import { create } from "zustand";
import {
  type ProfileData,
  type ProfileAddress,
  type ProfileAward,
  type ProfileClinicalExperience,
  type ProfileEducation,
  type ProfileLicensure,
  type ProfileMembership,
  type ProfileResume,
  type ProfileWorkExperience,
  mockProfileData,
} from "@/data/profile-data";

interface ProfileState {
  profile: ProfileData;
  getProfileData: () => ProfileData;
  updateAddress: (type: "current" | "permanent", address: Partial<ProfileAddress>) => void;
  updateLicensure: (index: number, licensure: Partial<ProfileLicensure>) => void;
  addLicensure: (licensure: ProfileLicensure) => void;
  removeLicensure: (index: number) => void;
  addMembership: (membership: ProfileMembership) => void;
  updateMembership: (index: number, membership: Partial<ProfileMembership>) => void;
  updateProfessionalSummary: (summary: string) => void;
  updateProfessionalInterests: (interests: string[]) => void;
  updateSkills: (skills: Partial<ProfileData["skills"]>) => void;
  addEducation: (education: ProfileEducation) => void;
  updateEducation: (index: number, education: Partial<ProfileEducation>) => void;
  addClinicalExperience: (experience: ProfileClinicalExperience) => void;
  updateClinicalExperience: (index: number, experience: Partial<ProfileClinicalExperience>) => void;
  addWorkExperience: (experience: ProfileWorkExperience) => void;
  updateWorkExperience: (index: number, experience: Partial<ProfileWorkExperience>) => void;
  addAward: (award: ProfileAward) => void;
  updateAward: (index: number, award: Partial<ProfileAward>) => void;
  updateResume: (resume: ProfileResume | undefined) => void;
  updateJobPreferences: (prefs: Partial<ProfileData["jobPreferences"]>) => void;
  updateVeteranStatus: (status: { isVeteran: boolean; details?: string }) => void;
  addSecondaryEmail: (email: string) => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: { ...mockProfileData },

  getProfileData: () => get().profile,

  updateAddress: (type, address) =>
    set((state) => ({
      profile: {
        ...state.profile,
        ...(type === "current"
          ? { currentAddress: { ...state.profile.currentAddress, ...address } }
          : { permanentAddress: { ...state.profile.permanentAddress, ...address } }),
      },
    })),

  updateLicensure: (index, licensure) =>
    set((state) => {
      const next = [...state.profile.licensures];
      if (next[index]) next[index] = { ...next[index], ...licensure };
      return { profile: { ...state.profile, licensures: next } };
    }),

  addLicensure: (licensure) =>
    set((state) => ({
      profile: {
        ...state.profile,
        licensures: [...state.profile.licensures, licensure],
      },
    })),

  removeLicensure: (index) =>
    set((state) => ({
      profile: {
        ...state.profile,
        licensures: state.profile.licensures.filter((_, i) => i !== index),
      },
    })),

  addMembership: (membership) =>
    set((state) => ({
      profile: {
        ...state.profile,
        memberships: [...state.profile.memberships, membership],
      },
    })),

  updateMembership: (index, membership) =>
    set((state) => {
      const next = [...state.profile.memberships];
      if (next[index]) next[index] = { ...next[index], ...membership };
      return { profile: { ...state.profile, memberships: next } };
    }),

  updateProfessionalSummary: (summary) =>
    set((state) => ({
      profile: { ...state.profile, professionalSummary: summary },
    })),

  updateProfessionalInterests: (interests) =>
    set((state) => ({
      profile: { ...state.profile, professionalInterests: interests },
    })),

  updateSkills: (skills) =>
    set((state) => ({
      profile: {
        ...state.profile,
        skills: {
          ...state.profile.skills,
          ...skills,
        },
      },
    })),

  addEducation: (education) =>
    set((state) => ({
      profile: {
        ...state.profile,
        education: [...state.profile.education, education],
      },
    })),

  updateEducation: (index, education) =>
    set((state) => {
      const next = [...state.profile.education];
      if (next[index]) next[index] = { ...next[index], ...education };
      return { profile: { ...state.profile, education: next } };
    }),

  addClinicalExperience: (experience) =>
    set((state) => ({
      profile: {
        ...state.profile,
        clinicalExperience: [...state.profile.clinicalExperience, experience],
      },
    })),

  updateClinicalExperience: (index, experience) =>
    set((state) => {
      const next = [...state.profile.clinicalExperience];
      if (next[index]) next[index] = { ...next[index], ...experience };
      return { profile: { ...state.profile, clinicalExperience: next } };
    }),

  addWorkExperience: (experience) =>
    set((state) => ({
      profile: {
        ...state.profile,
        workExperience: [...state.profile.workExperience, experience],
      },
    })),

  updateWorkExperience: (index, experience) =>
    set((state) => {
      const next = [...state.profile.workExperience];
      if (next[index]) next[index] = { ...next[index], ...experience };
      return { profile: { ...state.profile, workExperience: next } };
    }),

  addAward: (award) =>
    set((state) => ({
      profile: {
        ...state.profile,
        accomplishments: {
          ...state.profile.accomplishments,
          awards: [...state.profile.accomplishments.awards, award],
        },
      },
    })),

  updateAward: (index, award) =>
    set((state) => {
      const next = [...state.profile.accomplishments.awards];
      if (next[index]) next[index] = { ...next[index], ...award };
      return {
        profile: {
          ...state.profile,
          accomplishments: {
            ...state.profile.accomplishments,
            awards: next,
          },
        },
      };
    }),

  updateResume: (resume) =>
    set((state) => ({
      profile: { ...state.profile, resume },
    })),

  updateJobPreferences: (prefs) =>
    set((state) => ({
      profile: {
        ...state.profile,
        jobPreferences: {
          ...(state.profile.jobPreferences ?? {
            desiredRole: "",
            preferredLocation: "",
            patientCareAreas: "",
            workPriorities: "",
          }),
          ...prefs,
        },
      },
    })),

  updateVeteranStatus: (status) =>
    set((state) => ({
      profile: { ...state.profile, veteranStatus: { ...state.profile.veteranStatus, ...status } },
    })),

  addSecondaryEmail: (email) =>
    set((state) => {
      const trimmed = email.trim();
      if (!trimmed) return state;
      const current = state.profile.personal.secondaryEmails ?? [];
      if (current.includes(trimmed)) return state;
      return {
        profile: {
          ...state.profile,
          personal: {
            ...state.profile.personal,
            secondaryEmails: [...current, trimmed],
          },
        },
      };
    }),
}));
