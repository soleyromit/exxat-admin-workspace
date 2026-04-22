"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v3";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProfileEditDialog } from "@/components/shared/profile-edit-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useFormContext } from "react-hook-form";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/shared/rich-text-editor";
import { FontAwesomeIcon } from "@/components/brand/font-awesome-icon";
import { cn, touchTargetMobileClasses } from "@/components/ui/utils";
import { useProfileStore } from "@/stores/profile-store";

export type ProfileCardSectionId =
  | "address"
  | "skills"
  | "memberships"
  | "licensures"
  | "accomplishments"
  | "education"
  | "clinical"
  | "work"
  | "summary"
  | "interest"
  | "veteran"
  | "resume"
  | "jobPreferences";

const SECTION_LABELS: Record<ProfileCardSectionId, string> = {
  address: "Address Information",
  skills: "Skills",
  memberships: "Membership",
  licensures: "Licensure",
  accomplishments: "Accomplishments",
  education: "Education",
  clinical: "Clinical Experience",
  work: "Work Experience",
  summary: "Professional Summary",
  interest: "Professional Interest",
  veteran: "Veteran Status",
  resume: "Resume",
  jobPreferences: "Job Preferences",
};

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
  "Wisconsin", "Wyoming", "District of Columbia",
];

const COUNTRIES = [
  "United States", "Canada", "United Kingdom", "Australia", "India", "Germany",
  "France", "Mexico", "Brazil", "Japan", "China", "Other",
];

/** Profile dialog form fields: height/background/border handled by globals.css */
const PROFILE_FIELD_CLASS = "profile-dialog-field";

const OPTIONAL_DATE_MESSAGE = "Use the date format YYYY-MM-DD";
const zipCodeRegex = /^\d{5}(?:-\d{4})?$/;
const htmlDateRegex = /^\d{4}-\d{2}-\d{2}$/;
const optionalDateField = z
  .string()
  .optional()
  .refine((value) => !value || htmlDateRegex.test(value), OPTIONAL_DATE_MESSAGE);

const addressSchema = z.object({
  addressType: z.enum(["current", "permanent"]),
  addressLine1: z.string().min(1, "Address line 1 is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  stateTerritory: z.string().optional(),
  zipCode: z
    .string()
    .optional()
    .refine((value) => !value || zipCodeRegex.test(value), "ZIP code must be 12345 or 12345-6789"),
  country: z.string().optional(),
});

type AddressFormValues = z.infer<typeof addressSchema>;

const EMPTY_ADDRESS_VALUES: AddressFormValues = {
  addressType: "current",
  addressLine1: "",
  addressLine2: "",
  city: "",
  stateTerritory: "",
  zipCode: "",
  country: "",
};

function getSkillsByType(
  skills: ReturnType<typeof useProfileStore.getState>["profile"]["skills"],
  type: "technical" | "other" | "language"
) {
  if (type === "technical") return skills.technical;
  if (type === "other") return skills.others;
  return skills.languages.map((item) => item.language);
}

function normalizeChipValues(values: string[]) {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );
}

function getAddressValues(
  type: "current" | "permanent",
  profile: ReturnType<typeof useProfileStore.getState>["profile"]
): AddressFormValues {
  const source = type === "current" ? profile.currentAddress : profile.permanentAddress;
  return {
    addressType: type,
    addressLine1: source.addressLine1,
    addressLine2: source.addressLine2,
    city: source.city,
    stateTerritory: source.stateTerritory,
    zipCode: source.zipCode,
    country: source.country,
  };
}

const licensureSchema = z.object({
  name: z.string().min(1, "License type is required"),
  number: z.string().optional(),
  stateTerritory: z.string().optional(),
  validFrom: optionalDateField,
  validTo: optionalDateField,
  note: z.string().optional(),
}).refine(
  (value) => !value.validFrom || !value.validTo || value.validTo >= value.validFrom,
  {
    message: "Expiration date must be the same as or later than licensure date",
    path: ["validTo"],
  }
);

type LicensureFormValues = z.infer<typeof licensureSchema>;

const membershipSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  membershipNumber: z.string().optional(),
  positionHeld: z.string().optional(),
  validFrom: optionalDateField,
  validTo: optionalDateField,
  description: z.string().optional(),
}).refine(
  (value) => !value.validFrom || !value.validTo || value.validTo >= value.validFrom,
  {
    message: "Expiration date must be the same as or later than joined date",
    path: ["validTo"],
  }
);

type MembershipFormValues = z.infer<typeof membershipSchema>;

export interface ProfileCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionId: ProfileCardSectionId;
  mode: "add" | "edit";
  editAddressType?: "current" | "permanent";
  editItemIndex?: number;
  editSkillType?: "technical" | "other" | "language";
  onSave?: (data: Record<string, unknown>, options?: { keepOpen?: boolean }) => void;
}

export function ProfileCardDialog({
  open,
  onOpenChange,
  sectionId,
  mode,
  editAddressType,
  editItemIndex,
  editSkillType,
  onSave,
}: ProfileCardDialogProps) {
  const title = SECTION_LABELS[sectionId] ?? sectionId;
  const profile = useProfileStore((s) => s.profile);
  const updateAddress = useProfileStore((s) => s.updateAddress);
  const updateLicensure = useProfileStore((s) => s.updateLicensure);
  const addLicensure = useProfileStore((s) => s.addLicensure);
  const addMembership = useProfileStore((s) => s.addMembership);
  const updateMembership = useProfileStore((s) => s.updateMembership);
  const updateProfessionalSummary = useProfileStore((s) => s.updateProfessionalSummary);
  const updateProfessionalInterests = useProfileStore((s) => s.updateProfessionalInterests);
  const updateSkills = useProfileStore((s) => s.updateSkills);
  const addEducation = useProfileStore((s) => s.addEducation);
  const updateEducation = useProfileStore((s) => s.updateEducation);
  const addClinicalExperience = useProfileStore((s) => s.addClinicalExperience);
  const updateClinicalExperience = useProfileStore((s) => s.updateClinicalExperience);
  const addWorkExperience = useProfileStore((s) => s.addWorkExperience);
  const updateWorkExperience = useProfileStore((s) => s.updateWorkExperience);
  const addAward = useProfileStore((s) => s.addAward);
  const updateAward = useProfileStore((s) => s.updateAward);
  const updateResume = useProfileStore((s) => s.updateResume);
  const updateJobPreferences = useProfileStore((s) => s.updateJobPreferences);
  const updateVeteranStatus = useProfileStore((s) => s.updateVeteranStatus);

  const selectedEducationIndex = editItemIndex ?? 0;
  const selectedClinicalIndex = editItemIndex ?? 0;
  const selectedWorkIndex = editItemIndex ?? 0;
  const selectedMembershipIndex = editItemIndex ?? 0;
  const selectedLicensureIndex = editItemIndex ?? 0;
  const selectedAwardIndex = editItemIndex ?? 0;

  const [errorSummary, setErrorSummary] = React.useState<string | undefined>();
  const [summaryValue, setSummaryValue] = React.useState(profile.professionalSummary ?? "");
  const [interestValues, setInterestValues] = React.useState(profile.professionalInterests);
  const [interestInput, setInterestInput] = React.useState("");
  const [skillsDraft, setSkillsDraft] = React.useState(profile.skills.technical);
  const [skillType, setSkillType] = React.useState<"technical" | "other" | "language">(editSkillType ?? "technical");
  const [skillInput, setSkillInput] = React.useState("");
  const [educationDraft, setEducationDraft] = React.useState({
    school: profile.education[selectedEducationIndex]?.school ?? "",
    degree: profile.education[selectedEducationIndex]?.degree ?? "",
    years: profile.education[selectedEducationIndex]?.years ?? "",
  });
  const [clinicalDraft, setClinicalDraft] = React.useState({
    title: profile.clinicalExperience[selectedClinicalIndex]?.title ?? "",
    organization: profile.clinicalExperience[selectedClinicalIndex]?.organization ?? "",
    location: profile.clinicalExperience[selectedClinicalIndex]?.location ?? "",
    years: profile.clinicalExperience[selectedClinicalIndex]?.years ?? "",
    description: profile.clinicalExperience[selectedClinicalIndex]?.description ?? "",
  });
  const [workDraft, setWorkDraft] = React.useState({
    title: profile.workExperience[selectedWorkIndex]?.title ?? "",
    organization: profile.workExperience[selectedWorkIndex]?.organization ?? "",
    location: profile.workExperience[selectedWorkIndex]?.location ?? "",
    years: profile.workExperience[selectedWorkIndex]?.years ?? "",
    description: profile.workExperience[selectedWorkIndex]?.description ?? "",
  });
  const [awardDraft, setAwardDraft] = React.useState({
    title: profile.accomplishments.awards[selectedAwardIndex]?.title ?? "",
    description: "",
    organization: profile.accomplishments.awards[selectedAwardIndex]?.organization ?? "",
    year: profile.accomplishments.awards[selectedAwardIndex]?.year ?? "",
  });
  const [veteranValue, setVeteranValue] = React.useState<"yes" | "no" | "prefer-not">(
    profile.veteranStatus.isVeteran
      ? "yes"
      : profile.veteranStatus.details === "Prefer not to say"
        ? "prefer-not"
        : "no"
  );
  const [jobPreferencesDraft, setJobPreferencesDraft] = React.useState({
    desiredRole: profile.jobPreferences?.desiredRole ?? "",
    preferredLocation: profile.jobPreferences?.preferredLocation ?? "",
    patientCareAreas: profile.jobPreferences?.patientCareAreas ?? "",
    workPriorities: profile.jobPreferences?.workPriorities ?? "",
  });

  const emptyEducationDraft = React.useMemo(() => ({
    school: "",
    degree: "",
    years: "",
  }), []);

  const emptyClinicalDraft = React.useMemo(() => ({
    title: "",
    organization: "",
    location: "",
    years: "",
    description: "",
  }), []);

  const emptyWorkDraft = React.useMemo(() => ({
    title: "",
    organization: "",
    location: "",
    years: "",
    description: "",
  }), []);

  const addressForm = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues:
      mode === "edit"
        ? getAddressValues(editAddressType ?? "current", profile)
        : EMPTY_ADDRESS_VALUES,
  });

  const licensureForm = useForm<LicensureFormValues>({
    resolver: zodResolver(licensureSchema),
    defaultValues: {
      name: profile.licensures[selectedLicensureIndex]?.name ?? "",
      number: profile.licensures[selectedLicensureIndex]?.number ?? "",
      stateTerritory: profile.licensures[selectedLicensureIndex]?.stateTerritory ?? "",
      validFrom: profile.licensures[selectedLicensureIndex]?.validFrom ?? "",
      validTo: profile.licensures[selectedLicensureIndex]?.validTo ?? "",
      note: profile.licensures[selectedLicensureIndex]?.note ?? "",
    },
  });

  const membershipForm = useForm<MembershipFormValues>({
    resolver: zodResolver(membershipSchema),
    defaultValues: {
      name: profile.memberships[selectedMembershipIndex]?.name ?? "",
      membershipNumber: profile.memberships[selectedMembershipIndex]?.membershipNumber ?? "",
      positionHeld: profile.memberships[selectedMembershipIndex]?.positionHeld ?? profile.memberships[selectedMembershipIndex]?.category ?? "",
      validFrom: profile.memberships[selectedMembershipIndex]?.validFrom ?? "",
      validTo: profile.memberships[selectedMembershipIndex]?.validTo ?? "",
      description: profile.memberships[selectedMembershipIndex]?.description ?? "",
    },
  });

  React.useEffect(() => {
    if (open && sectionId === "address") {
      addressForm.reset(
        mode === "edit"
          ? getAddressValues(editAddressType ?? "current", profile)
          : EMPTY_ADDRESS_VALUES
      );
    }
  }, [open, sectionId, mode, editAddressType, profile, addressForm.reset]);

  React.useEffect(() => {
    if (open && sectionId === "licensures") {
      licensureForm.reset({
        name: profile.licensures[selectedLicensureIndex]?.name ?? "",
        number: profile.licensures[selectedLicensureIndex]?.number ?? "",
        stateTerritory: profile.licensures[selectedLicensureIndex]?.stateTerritory ?? "",
        validFrom: profile.licensures[selectedLicensureIndex]?.validFrom ?? "",
        validTo: profile.licensures[selectedLicensureIndex]?.validTo ?? "",
        note: profile.licensures[selectedLicensureIndex]?.note ?? "",
      });
    }
  }, [open, sectionId, profile.licensures, selectedLicensureIndex, licensureForm.reset]);

  React.useEffect(() => {
    if (open && sectionId === "memberships") {
      const m = mode === "edit" && profile.memberships[selectedMembershipIndex] ? profile.memberships[selectedMembershipIndex] : null;
      membershipForm.reset({
        name: m?.name ?? "",
        membershipNumber: m?.membershipNumber ?? "",
        positionHeld: m?.positionHeld ?? m?.category ?? "",
        validFrom: m?.validFrom ?? "",
        validTo: m?.validTo ?? "",
        description: m?.description ?? "",
      });
    }
  }, [open, sectionId, mode, profile.memberships, selectedMembershipIndex, membershipForm.reset]);

  React.useEffect(() => {
    if (open) setErrorSummary(undefined);
  }, [open]);

  React.useEffect(() => {
    if (!open) return;

    if (sectionId === "summary") {
      setSummaryValue(profile.professionalSummary ?? "");
    } else if (sectionId === "interest") {
      setInterestValues(profile.professionalInterests);
      setInterestInput("");
    } else if (sectionId === "skills") {
      const nextSkillType = editSkillType ?? "technical";
      setSkillType(nextSkillType);
      setSkillsDraft(mode === "edit" ? getSkillsByType(profile.skills, nextSkillType) : []);
      setSkillInput("");
    } else if (sectionId === "education") {
      setEducationDraft({
        school: profile.education[selectedEducationIndex]?.school ?? "",
        degree: profile.education[selectedEducationIndex]?.degree ?? "",
        years: profile.education[selectedEducationIndex]?.years ?? "",
      });
    } else if (sectionId === "clinical") {
      setClinicalDraft({
        title: profile.clinicalExperience[selectedClinicalIndex]?.title ?? "",
        organization: profile.clinicalExperience[selectedClinicalIndex]?.organization ?? "",
        location: profile.clinicalExperience[selectedClinicalIndex]?.location ?? "",
        years: profile.clinicalExperience[selectedClinicalIndex]?.years ?? "",
        description: profile.clinicalExperience[selectedClinicalIndex]?.description ?? "",
      });
    } else if (sectionId === "work") {
      setWorkDraft({
        title: profile.workExperience[selectedWorkIndex]?.title ?? "",
        organization: profile.workExperience[selectedWorkIndex]?.organization ?? "",
        location: profile.workExperience[selectedWorkIndex]?.location ?? "",
        years: profile.workExperience[selectedWorkIndex]?.years ?? "",
        description: profile.workExperience[selectedWorkIndex]?.description ?? "",
      });
    } else if (sectionId === "accomplishments") {
      setAwardDraft({
        title: profile.accomplishments.awards[selectedAwardIndex]?.title ?? "",
        description: "",
        organization: profile.accomplishments.awards[selectedAwardIndex]?.organization ?? "",
        year: profile.accomplishments.awards[selectedAwardIndex]?.year ?? "",
      });
    } else if (sectionId === "veteran") {
      setVeteranValue(
        profile.veteranStatus.isVeteran
          ? "yes"
          : profile.veteranStatus.details === "Prefer not to say"
            ? "prefer-not"
            : "no"
      );
    } else if (sectionId === "jobPreferences") {
      setJobPreferencesDraft({
        desiredRole: profile.jobPreferences?.desiredRole ?? "",
        preferredLocation: profile.jobPreferences?.preferredLocation ?? "",
        patientCareAreas: profile.jobPreferences?.patientCareAreas ?? "",
        workPriorities: profile.jobPreferences?.workPriorities ?? "",
      });
    }
  }, [
    open,
    sectionId,
    mode,
    profile,
    editSkillType,
    selectedEducationIndex,
    selectedClinicalIndex,
    selectedWorkIndex,
    selectedAwardIndex,
  ]);

  React.useEffect(() => {
    if (!open || sectionId !== "skills") return;
    setSkillsDraft(mode === "edit" ? getSkillsByType(profile.skills, skillType) : []);
    setSkillInput("");
  }, [open, sectionId, mode, skillType, profile.skills]);

  const handleAddressSubmit = React.useCallback(
    (values: AddressFormValues) => {
      const { addressType, ...addressData } = values;
      updateAddress(addressType, addressData);
      onSave?.(values);
      onOpenChange(false);
    },
    [updateAddress, onSave, onOpenChange]
  );

  const handleLicensureSubmit = React.useCallback(
    (values: LicensureFormValues) => {
      const licensureData = {
        name: values.name,
        number: values.number ?? "",
        stateTerritory: values.stateTerritory,
        validFrom: values.validFrom ?? "",
        validTo: values.validTo ?? "",
        note: values.note,
      };
      if (mode === "add" || !profile.licensures[selectedLicensureIndex]) {
        addLicensure(licensureData);
      } else {
        updateLicensure(selectedLicensureIndex, licensureData);
      }
      onSave?.(values);
      onOpenChange(false);
    },
    [mode, profile.licensures, selectedLicensureIndex, addLicensure, updateLicensure, onSave, onOpenChange]
  );

  const handleMembershipSubmit = React.useCallback(
    (values: MembershipFormValues) => {
      const membershipData = {
        name: values.name,
        membershipNumber: values.membershipNumber ?? "",
        validFrom: values.validFrom ?? "",
        validTo: values.validTo ?? "",
        category: values.positionHeld ?? "",
        status: "Active",
        positionHeld: values.positionHeld,
        description: values.description,
      };
      if (mode === "add" || !profile.memberships[selectedMembershipIndex]) {
        addMembership(membershipData);
      } else {
        updateMembership(selectedMembershipIndex, membershipData);
      }
      onSave?.(values);
      onOpenChange(false);
    },
    [mode, profile.memberships, selectedMembershipIndex, addMembership, updateMembership, onSave, onOpenChange]
  );

  const handleSave = React.useCallback((behavior: "close" | "addNext" = "close") => {
    setErrorSummary(undefined);
    if (sectionId === "address") {
      addressForm.handleSubmit(handleAddressSubmit, () =>
        setErrorSummary("Please fix the errors in the form.")
      )();
    } else if (sectionId === "licensures") {
      licensureForm.handleSubmit(handleLicensureSubmit, () =>
        setErrorSummary("Please fix the errors in the form.")
      )();
    } else if (sectionId === "memberships") {
      membershipForm.handleSubmit(handleMembershipSubmit, () =>
        setErrorSummary("Please fix the errors in the form.")
      )();
    } else if (sectionId === "summary") {
      updateProfessionalSummary(summaryValue.trim());
      onSave?.({ summary: summaryValue.trim() });
      onOpenChange(false);
    } else if (sectionId === "interest") {
      const interests = normalizeChipValues([
        ...interestValues,
        ...interestInput.split(","),
      ]);
      updateProfessionalInterests(interests);
      onSave?.({ interests });
      onOpenChange(false);
    } else if (sectionId === "skills") {
      const nextSkills = normalizeChipValues([
        ...skillsDraft,
        ...skillInput.split(","),
      ]);
      if (nextSkills.length === 0) {
        setErrorSummary("Please enter at least one skill.");
        return;
      }
      if (mode === "add") {
        if (skillType === "technical") {
          updateSkills({ technical: normalizeChipValues([...profile.skills.technical, ...nextSkills]) });
        } else if (skillType === "other") {
          updateSkills({ others: normalizeChipValues([...profile.skills.others, ...nextSkills]) });
        } else {
          const existingLanguages = profile.skills.languages.map((item) => item.language);
          updateSkills({
            languages: normalizeChipValues([...existingLanguages, ...nextSkills]).map((language) => ({
              language,
              speaking: "Professional working proficiency",
              reading: "Professional working proficiency",
              writing: "Professional working proficiency",
            })),
          });
        }
      } else if (skillType === "technical") {
        updateSkills({ technical: nextSkills });
      } else if (skillType === "other") {
        updateSkills({ others: nextSkills });
      } else {
        updateSkills({
          languages: nextSkills.map((language) => ({
            language,
            speaking: "Professional working proficiency",
            reading: "Professional working proficiency",
            writing: "Professional working proficiency",
          })),
        });
      }
      onSave?.({ skillType, skills: nextSkills });
      onOpenChange(false);
    } else if (sectionId === "education") {
      const educationData = {
        school: educationDraft.school.trim(),
        degree: educationDraft.degree.trim(),
        years: educationDraft.years.trim(),
      };
      if (mode === "add" || !profile.education[selectedEducationIndex]) addEducation(educationData);
      else updateEducation(selectedEducationIndex, educationData);
      if (behavior === "addNext" && mode === "add") {
        onSave?.(educationData, { keepOpen: true });
        setEducationDraft(emptyEducationDraft);
      } else {
        onSave?.(educationData);
        onOpenChange(false);
      }
    } else if (sectionId === "clinical") {
      const clinicalData = {
        title: clinicalDraft.title.trim(),
        organization: clinicalDraft.organization.trim(),
        location: clinicalDraft.location.trim(),
        years: clinicalDraft.years.trim(),
        description: clinicalDraft.description.trim(),
      };
      if (mode === "add" || !profile.clinicalExperience[selectedClinicalIndex]) addClinicalExperience(clinicalData);
      else updateClinicalExperience(selectedClinicalIndex, clinicalData);
      if (behavior === "addNext" && mode === "add") {
        onSave?.(clinicalData, { keepOpen: true });
        setClinicalDraft(emptyClinicalDraft);
      } else {
        onSave?.(clinicalData);
        onOpenChange(false);
      }
    } else if (sectionId === "work") {
      const workData = {
        title: workDraft.title.trim(),
        organization: workDraft.organization.trim(),
        location: workDraft.location.trim(),
        years: workDraft.years.trim(),
        description: workDraft.description.trim(),
      };
      if (mode === "add" || !profile.workExperience[selectedWorkIndex]) addWorkExperience(workData);
      else updateWorkExperience(selectedWorkIndex, workData);
      if (behavior === "addNext" && mode === "add") {
        onSave?.(workData, { keepOpen: true });
        setWorkDraft(emptyWorkDraft);
      } else {
        onSave?.(workData);
        onOpenChange(false);
      }
    } else if (sectionId === "accomplishments") {
      const awardData = {
        title: awardDraft.title.trim(),
        organization: awardDraft.organization.trim(),
        year: awardDraft.year.trim(),
      };
      if (mode === "add" || !profile.accomplishments.awards[selectedAwardIndex]) addAward(awardData);
      else updateAward(selectedAwardIndex, awardData);
      onSave?.({ ...awardData, description: awardDraft.description.trim() });
      onOpenChange(false);
    } else if (sectionId === "veteran") {
      const veteranData =
        veteranValue === "yes"
          ? { isVeteran: true, details: "Yes" }
          : veteranValue === "prefer-not"
            ? { isVeteran: false, details: "Prefer not to say" }
            : { isVeteran: false, details: "No" };
      updateVeteranStatus(veteranData);
      onSave?.(veteranData);
      onOpenChange(false);
    } else if (sectionId === "resume") {
      const resumeData = profile.resume ?? {
        fileName: "Uploaded_Resume.pdf",
        size: "0 KB",
        uploadedDate: new Date().toISOString().slice(0, 10),
      };
      updateResume(resumeData);
      onSave?.(resumeData);
      onOpenChange(false);
    } else if (sectionId === "jobPreferences") {
      updateJobPreferences(jobPreferencesDraft);
      onSave?.(jobPreferencesDraft);
      onOpenChange(false);
    } else {
      onSave?.({});
      onOpenChange(false);
    }
  }, [
    sectionId,
    addressForm,
    licensureForm,
    membershipForm,
    handleAddressSubmit,
    handleLicensureSubmit,
    handleMembershipSubmit,
    updateProfessionalSummary,
    summaryValue,
    updateProfessionalInterests,
    interestValues,
    interestInput,
    mode,
    skillInput,
    skillType,
    profile.skills.technical,
    profile.skills.others,
    profile.skills.languages,
    skillsDraft,
    updateSkills,
    addEducation,
    updateEducation,
    selectedEducationIndex,
    educationDraft,
    emptyEducationDraft,
    profile.education,
    addClinicalExperience,
    updateClinicalExperience,
    selectedClinicalIndex,
    clinicalDraft,
    emptyClinicalDraft,
    profile.clinicalExperience,
    addWorkExperience,
    updateWorkExperience,
    selectedWorkIndex,
    workDraft,
    emptyWorkDraft,
    profile.workExperience,
    addAward,
    updateAward,
    selectedAwardIndex,
    awardDraft,
    profile.accomplishments.awards,
    veteranValue,
    updateVeteranStatus,
    updateResume,
    profile.resume,
    updateJobPreferences,
    jobPreferencesDraft,
    selectedLicensureIndex,
    selectedMembershipIndex,
    onSave,
    onOpenChange,
  ]);

  return (
    <ProfileEditDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      mode={mode}
      onSave={() => handleSave("close")}
      onSecondarySave={
        mode === "add" && (sectionId === "education" || sectionId === "clinical" || sectionId === "work")
          ? () => handleSave("addNext")
          : undefined
      }
      secondarySaveLabel={
        mode === "add" && (sectionId === "education" || sectionId === "clinical" || sectionId === "work")
          ? "Save and add next"
          : undefined
      }
      errorSummary={errorSummary}
    >
      {sectionId === "address" && (
        <Form {...addressForm}>
          <AddressForm mode={mode} />
        </Form>
      )}
      {sectionId === "licensures" && (
        <Form {...licensureForm}>
          <LicensureForm />
        </Form>
      )}
      {sectionId === "memberships" && (
        <Form {...membershipForm}>
          <MembershipForm />
        </Form>
      )}
      {sectionId === "skills" && (
        <SkillsForm
          mode={mode}
          skillType={skillType}
          setSkillType={setSkillType}
          skillInput={skillInput}
          setSkillInput={setSkillInput}
          skills={skillsDraft}
          setSkills={setSkillsDraft}
        />
      )}
      {sectionId === "accomplishments" && (
        <AccomplishmentsForm value={awardDraft} onChange={setAwardDraft} />
      )}
      {sectionId === "education" && (
        <EducationForm value={educationDraft} onChange={setEducationDraft} />
      )}
      {sectionId === "clinical" && (
        <ClinicalForm value={clinicalDraft} onChange={setClinicalDraft} />
      )}
      {sectionId === "work" && <WorkForm value={workDraft} onChange={setWorkDraft} />}
      {sectionId === "summary" && <SummaryForm value={summaryValue} onChange={setSummaryValue} />}
      {sectionId === "interest" && (
        <InterestForm
          values={interestValues}
          inputValue={interestInput}
          onInputChange={setInterestInput}
          onValuesChange={setInterestValues}
        />
      )}
      {sectionId === "veteran" && <VeteranForm value={veteranValue} onChange={setVeteranValue} />}
      {sectionId === "resume" && <ResumeForm />}
      {sectionId === "jobPreferences" && (
        <JobPreferencesForm value={jobPreferencesDraft} onChange={setJobPreferencesDraft} />
      )}
    </ProfileEditDialog>
  );
}

function FormFieldWithHint({
  label,
  hint,
  hintAriaLabel,
  children,
}: {
  label: string;
  hint?: boolean;
  hintAriaLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5">
        {label}
        {hint && (
          <button
            type="button"
            className={cn("rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground", touchTargetMobileClasses, "size-4 md:size-4")}
            aria-label={hintAriaLabel ?? `Help with ${label.toLowerCase()}`}
          >
            <FontAwesomeIcon name="circleQuestion" className="size-3.5" weight="regular" aria-hidden />
          </button>
        )}
      </Label>
      {children}
    </div>
  );
}

function ChipEntryField({
  label,
  values,
  inputValue,
  onInputChange,
  onValuesChange,
  placeholder,
}: {
  label: string;
  values: string[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onValuesChange: (values: string[]) => void;
  placeholder: string;
}) {
  const commitInput = React.useCallback(() => {
    if (!inputValue.trim()) return;
    const next = normalizeChipValues([...values, ...inputValue.split(",")]);
    onValuesChange(next);
    onInputChange("");
  }, [inputValue, onInputChange, onValuesChange, values]);

  const removeValue = React.useCallback(
    (valueToRemove: string) => {
      onValuesChange(values.filter((value) => value !== valueToRemove));
    },
    [onValuesChange, values]
  );

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex min-h-[44px] w-full flex-wrap items-center gap-2 rounded-md border border-[var(--control-border)] bg-background px-3 py-2 md:min-h-[32px]">
        {values.map((value) => (
          <Badge key={value} variant="secondary" className="rounded-full px-2 py-1 text-xs">
            <span>{value}</span>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full"
              aria-label={`Remove ${value}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => removeValue(value)}
            >
              <FontAwesomeIcon name="x" className="h-3 w-3" aria-hidden />
            </button>
          </Badge>
        ))}
        <input
          value={inputValue}
          onChange={(e) => {
            const nextValue = e.target.value;
            if (nextValue.includes(",")) {
              const next = normalizeChipValues([...values, ...nextValue.split(",")]);
              onValuesChange(next);
              onInputChange("");
              return;
            }
            onInputChange(nextValue);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commitInput();
            } else if (e.key === "Backspace" && !inputValue && values.length > 0) {
              onValuesChange(values.slice(0, -1));
            }
          }}
          onBlur={commitInput}
          className="min-w-[160px] flex-1 border-0 bg-transparent p-0 text-sm outline-none placeholder:text-muted-foreground"
          placeholder={values.length === 0 ? placeholder : "Add another and press comma"}
          aria-label={label}
        />
      </div>
    </div>
  );
}

function AddressForm({ mode }: { mode: "add" | "edit" }) {
  const form = useFormContext<AddressFormValues>();
  const profile = useProfileStore((s) => s.profile);
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="addressType"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <FieldGroup className="w-full">
                <FieldSet>
                  <FieldLegend variant="label">
                    Address Type <span className="text-destructive" aria-hidden>*</span>
                  </FieldLegend>
                  <FieldDescription>
                    Choose whether this address should appear as your current or permanent address.
                  </FieldDescription>
                  <RadioGroup
                    value={field.value}
                    onValueChange={(nextValue) => {
                      const typedValue = nextValue as "current" | "permanent";
                      if (mode === "edit") {
                        form.reset(getAddressValues(typedValue, profile));
                        return;
                      }
                      field.onChange(typedValue);
                    }}
                    className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                    aria-label="Address type"
                  >
                    <FieldLabel htmlFor="address-type-current">
                      <Field orientation="horizontal">
                        <FieldContent>
                          <FieldTitle>Current</FieldTitle>
                          <FieldDescription>
                            Use for your active mailing address.
                          </FieldDescription>
                        </FieldContent>
                        <RadioGroupItem value="current" id="address-type-current" />
                      </Field>
                    </FieldLabel>
                    <FieldLabel htmlFor="address-type-permanent">
                      <Field orientation="horizontal">
                        <FieldContent>
                          <FieldTitle>Permanent</FieldTitle>
                          <FieldDescription>
                            Use for your long-term address.
                          </FieldDescription>
                        </FieldContent>
                        <RadioGroupItem value="permanent" id="address-type-permanent" />
                      </Field>
                    </FieldLabel>
                  </RadioGroup>
                </FieldSet>
              </FieldGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="addressLine1"
        render={({ field }) => (
          <FormItem>
            <FormLabel aria-required>Address Line 1 <span className="text-destructive" aria-hidden>*</span></FormLabel>
            <FormControl>
              <Input className={PROFILE_FIELD_CLASS} placeholder="Enter address line 1" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="addressLine2"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Address Line 2</FormLabel>
            <FormControl>
              <Input className={PROFILE_FIELD_CLASS} placeholder="Enter address line 2" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel aria-required>City <span className="text-destructive" aria-hidden>*</span></FormLabel>
              <FormControl>
                <Input className={PROFILE_FIELD_CLASS} placeholder="Enter city" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="stateTerritory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>State/Territory</FormLabel>
              <FormControl>
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <SelectTrigger className={PROFILE_FIELD_CLASS}>
                    <SelectValue placeholder="Select state/territory" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="zipCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ZIP Code</FormLabel>
              <FormControl>
                <Input className={PROFILE_FIELD_CLASS} placeholder="Enter ZIP code" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country</FormLabel>
              <FormControl>
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <SelectTrigger className={PROFILE_FIELD_CLASS}>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

function LicensureForm() {
  const form = useFormContext<LicensureFormValues>();
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel aria-required>Type of License <span className="text-destructive" aria-hidden>*</span></FormLabel>
            <FormControl>
              <Input className={PROFILE_FIELD_CLASS} placeholder="Enter license type" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="number"
        render={({ field }) => (
          <FormItem>
            <FormLabel>License Number</FormLabel>
            <FormControl>
              <Input className={PROFILE_FIELD_CLASS} placeholder="Enter license number" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="stateTerritory"
        render={({ field }) => (
          <FormItem>
            <FormLabel>State/Territory</FormLabel>
            <FormControl>
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger className={PROFILE_FIELD_CLASS}>
                  <SelectValue placeholder="Select state/territory" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="validFrom"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Licensure Date</FormLabel>
            <FormControl>
              <Input type="date" className={cn(PROFILE_FIELD_CLASS, "[&::-webkit-calendar-picker-indicator]:opacity-100")} placeholder="Select licensure date" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="validTo"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Expiration Date</FormLabel>
            <FormControl>
              <Input type="date" className={cn(PROFILE_FIELD_CLASS, "[&::-webkit-calendar-picker-indicator]:opacity-100")} placeholder="Select expiration date" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="note"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1.5">
              Note
              <button
                type="button"
                className={cn("rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground", touchTargetMobileClasses, "size-4 md:size-4")}
                aria-label="Help with note field"
              >
                <FontAwesomeIcon name="circleQuestion" className="size-3.5" weight="regular" aria-hidden />
              </button>
            </FormLabel>
            <FormControl>
              <RichTextEditor placeholder="Type here" minHeight="100px" value={field.value ?? ""} onChange={field.onChange} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

function SkillsForm({
  mode,
  skillType,
  setSkillType,
  skillInput,
  setSkillInput,
  skills,
  setSkills,
}: {
  mode: "add" | "edit";
  skillType: "technical" | "other" | "language";
  setSkillType: React.Dispatch<React.SetStateAction<"technical" | "other" | "language">>;
  skillInput: string;
  setSkillInput: React.Dispatch<React.SetStateAction<string>>;
  skills: string[];
  setSkills: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  return (
    <div className="space-y-4">
      <FormFieldWithHint label="Skill Type">
        <Select value={skillType} onValueChange={(value) => setSkillType(value as "technical" | "other" | "language")}>
          <SelectTrigger className={PROFILE_FIELD_CLASS}>
            <SelectValue placeholder="Select skill type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="technical">Technical</SelectItem>
            <SelectItem value="other">Other</SelectItem>
            <SelectItem value="language">Language</SelectItem>
          </SelectContent>
        </Select>
      </FormFieldWithHint>
      <ChipEntryField
        label={mode === "add" ? "Skill Name" : `${skillType === "technical" ? "Technical" : skillType === "other" ? "Other" : "Language"} Skills`}
        values={skills}
        inputValue={skillInput}
        onInputChange={setSkillInput}
        onValuesChange={setSkills}
        placeholder="Type a skill and press comma"
      />
    </div>
  );
}

function MembershipForm() {
  const form = useFormContext<MembershipFormValues>();
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel aria-required>
              Organization Name <span className="text-destructive" aria-hidden>*</span>
            </FormLabel>
            <FormControl>
              <Input
                className={PROFILE_FIELD_CLASS}
                placeholder="Enter organization name"
                aria-required
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="membershipNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Membership Number</FormLabel>
            <FormControl>
              <Input
                className={PROFILE_FIELD_CLASS}
                placeholder="Enter membership number"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="positionHeld"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Position Held</FormLabel>
            <FormControl>
              <Input
                className={PROFILE_FIELD_CLASS}
                placeholder="Type here"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="validFrom"
          render={({ field }) => (
            <FormItem>
            <FormLabel>Date Joined</FormLabel>
            <FormControl>
                <Input
                  type="date"
                  className={cn(PROFILE_FIELD_CLASS, "[&::-webkit-calendar-picker-indicator]:opacity-100")}
                  placeholder="Select joining date"
                  aria-label="Date joined"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="validTo"
          render={({ field }) => (
            <FormItem>
            <FormLabel>Expiration Date</FormLabel>
            <FormControl>
                <Input
                  type="date"
                  className={cn(PROFILE_FIELD_CLASS, "[&::-webkit-calendar-picker-indicator]:opacity-100")}
                  placeholder="Select expiration date"
                  aria-label="Expiration date"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1.5">
              Description
              <button
                type="button"
                className={cn("rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground", touchTargetMobileClasses, "size-4 md:size-4")}
                aria-label="Help with description field"
              >
                <FontAwesomeIcon name="circleQuestion" className="size-3.5" weight="regular" aria-hidden />
              </button>
            </FormLabel>
            <FormControl>
              <RichTextEditor
                placeholder="Type here"
                minHeight="100px"
                value={field.value ?? ""}
                onChange={field.onChange}
                aria-label="Membership description"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

function AccomplishmentsForm({
  value,
  onChange,
}: {
  value: { title: string; description: string; organization: string; year: string };
  onChange: React.Dispatch<React.SetStateAction<{ title: string; description: string; organization: string; year: string }>>;
}) {
  return (
    <>
      <FormFieldWithHint label="Honor or Award Name">
        <Input
          className={PROFILE_FIELD_CLASS}
          placeholder="Enter honor or award name"
          value={value.title}
          onChange={(e) => onChange((current) => ({ ...current, title: e.target.value }))}
        />
      </FormFieldWithHint>
      <FormFieldWithHint label="Description" hint>
        <RichTextEditor
          placeholder="Type here"
          minHeight="100px"
          value={value.description}
          onChange={(description) => onChange((current) => ({ ...current, description }))}
        />
      </FormFieldWithHint>
      <FormFieldWithHint label="Organization Name">
        <Input
          className={PROFILE_FIELD_CLASS}
          placeholder="Enter organization name"
          value={value.organization}
          onChange={(e) => onChange((current) => ({ ...current, organization: e.target.value }))}
        />
      </FormFieldWithHint>
      <FormFieldWithHint label="Receiving Date">
        <Input
          type="date"
          className={cn(PROFILE_FIELD_CLASS, "[&::-webkit-calendar-picker-indicator]:opacity-100")}
          placeholder="Select receiving date"
          value={value.year}
          onChange={(e) => onChange((current) => ({ ...current, year: e.target.value }))}
        />
      </FormFieldWithHint>
    </>
  );
}

function EducationForm({
  value,
  onChange,
}: {
  value: { school: string; degree: string; years: string };
  onChange: React.Dispatch<React.SetStateAction<{ school: string; degree: string; years: string }>>;
}) {
  return (
    <>
      <FormFieldWithHint label="School">
        <Input className={PROFILE_FIELD_CLASS} placeholder="Enter school name" value={value.school} onChange={(e) => onChange((current) => ({ ...current, school: e.target.value }))} />
      </FormFieldWithHint>
      <FormFieldWithHint label="Degree">
        <Input className={PROFILE_FIELD_CLASS} placeholder="Enter degree" value={value.degree} onChange={(e) => onChange((current) => ({ ...current, degree: e.target.value }))} />
      </FormFieldWithHint>
      <FormFieldWithHint label="Years">
        <Input className={PROFILE_FIELD_CLASS} placeholder="Enter years" value={value.years} onChange={(e) => onChange((current) => ({ ...current, years: e.target.value }))} />
      </FormFieldWithHint>
    </>
  );
}

function ClinicalForm({
  value,
  onChange,
}: {
  value: { title: string; organization: string; location: string; years: string; description: string };
  onChange: React.Dispatch<React.SetStateAction<{ title: string; organization: string; location: string; years: string; description: string }>>;
}) {
  return (
    <>
      <FormFieldWithHint label="Title">
        <Input className={PROFILE_FIELD_CLASS} placeholder="Enter title" value={value.title} onChange={(e) => onChange((current) => ({ ...current, title: e.target.value }))} />
      </FormFieldWithHint>
      <FormFieldWithHint label="Organization">
        <Input className={PROFILE_FIELD_CLASS} placeholder="Enter organization" value={value.organization} onChange={(e) => onChange((current) => ({ ...current, organization: e.target.value }))} />
      </FormFieldWithHint>
      <FormFieldWithHint label="Location">
        <Input className={PROFILE_FIELD_CLASS} placeholder="Enter location" value={value.location} onChange={(e) => onChange((current) => ({ ...current, location: e.target.value }))} />
      </FormFieldWithHint>
      <FormFieldWithHint label="Years">
        <Input className={PROFILE_FIELD_CLASS} placeholder="Enter years" value={value.years} onChange={(e) => onChange((current) => ({ ...current, years: e.target.value }))} />
      </FormFieldWithHint>
      <FormFieldWithHint label="Description">
        <RichTextEditor placeholder="Type here" minHeight="100px" value={value.description} onChange={(description) => onChange((current) => ({ ...current, description }))} />
      </FormFieldWithHint>
    </>
  );
}

function WorkForm({
  value,
  onChange,
}: {
  value: { title: string; organization: string; location: string; years: string; description: string };
  onChange: React.Dispatch<React.SetStateAction<{ title: string; organization: string; location: string; years: string; description: string }>>;
}) {
  return (
    <>
      <FormFieldWithHint label="Title">
        <Input className={PROFILE_FIELD_CLASS} placeholder="Enter title" value={value.title} onChange={(e) => onChange((current) => ({ ...current, title: e.target.value }))} />
      </FormFieldWithHint>
      <FormFieldWithHint label="Organization">
        <Input className={PROFILE_FIELD_CLASS} placeholder="Enter organization" value={value.organization} onChange={(e) => onChange((current) => ({ ...current, organization: e.target.value }))} />
      </FormFieldWithHint>
      <FormFieldWithHint label="Location">
        <Input className={PROFILE_FIELD_CLASS} placeholder="Enter location" value={value.location} onChange={(e) => onChange((current) => ({ ...current, location: e.target.value }))} />
      </FormFieldWithHint>
      <FormFieldWithHint label="Years">
        <Input className={PROFILE_FIELD_CLASS} placeholder="Enter years" value={value.years} onChange={(e) => onChange((current) => ({ ...current, years: e.target.value }))} />
      </FormFieldWithHint>
      <FormFieldWithHint label="Description">
        <RichTextEditor placeholder="Type here" minHeight="100px" value={value.description} onChange={(description) => onChange((current) => ({ ...current, description }))} />
      </FormFieldWithHint>
    </>
  );
}

function SummaryForm({ value, onChange }: { value: string; onChange: React.Dispatch<React.SetStateAction<string>> }) {
  return (
    <FormFieldWithHint label="Professional Summary" hint>
      <RichTextEditor placeholder="Type here" minHeight="120px" value={value} onChange={onChange} />
    </FormFieldWithHint>
  );
}

function InterestForm({
  values,
  inputValue,
  onInputChange,
  onValuesChange,
}: {
  values: string[];
  inputValue: string;
  onInputChange: React.Dispatch<React.SetStateAction<string>>;
  onValuesChange: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  return (
    <ChipEntryField
      label="Professional Interest"
      values={values}
      inputValue={inputValue}
      onInputChange={onInputChange}
      onValuesChange={onValuesChange}
      placeholder="Type an interest and press comma"
    />
  );
}

function VeteranForm({
  value,
  onChange,
}: {
  value: "yes" | "no" | "prefer-not";
  onChange: React.Dispatch<React.SetStateAction<"yes" | "no" | "prefer-not">>;
}) {
  return (
    <FormFieldWithHint label="Veteran Status">
      <Select value={value} onValueChange={(next) => onChange(next as "yes" | "no" | "prefer-not")}>
        <SelectTrigger className={PROFILE_FIELD_CLASS}>
          <SelectValue placeholder="Select veteran status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="yes">Yes</SelectItem>
          <SelectItem value="no">No</SelectItem>
          <SelectItem value="prefer-not">Prefer not to say</SelectItem>
        </SelectContent>
      </Select>
    </FormFieldWithHint>
  );
}

function ResumeForm() {
  return (
    <div className="space-y-4">
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-12 px-4",
          "hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer"
        )}
      >
        <div className="rounded-full bg-muted p-4">
          <FontAwesomeIcon name="plus" className="h-4 w-4 text-muted-foreground" weight="light" />
        </div>
        <p className="text-sm font-medium">Browse to upload</p>
        <p className="text-xs text-muted-foreground">Hover to see the supported formats</p>
      </div>
    </div>
  );
}

function JobPreferencesForm({
  value,
  onChange,
}: {
  value: {
    desiredRole: string;
    preferredLocation: string;
    patientCareAreas: string;
    workPriorities: string;
  };
  onChange: React.Dispatch<
    React.SetStateAction<{
      desiredRole: string;
      preferredLocation: string;
      patientCareAreas: string;
      workPriorities: string;
    }>
  >;
}) {
  return (
    <>
      <FormFieldWithHint label="Desired Role">
        <Input className={PROFILE_FIELD_CLASS} placeholder="Enter desired role" value={value.desiredRole} onChange={(e) => onChange((current) => ({ ...current, desiredRole: e.target.value }))} />
      </FormFieldWithHint>
      <FormFieldWithHint label="Preferred Location">
        <Input className={PROFILE_FIELD_CLASS} placeholder="Enter preferred location" value={value.preferredLocation} onChange={(e) => onChange((current) => ({ ...current, preferredLocation: e.target.value }))} />
      </FormFieldWithHint>
      <FormFieldWithHint label="Patient Care Areas">
        <Input className={PROFILE_FIELD_CLASS} placeholder="Enter patient care areas" value={value.patientCareAreas} onChange={(e) => onChange((current) => ({ ...current, patientCareAreas: e.target.value }))} />
      </FormFieldWithHint>
      <FormFieldWithHint label="Work Priorities">
        <Input className={PROFILE_FIELD_CLASS} placeholder="Enter work priorities" value={value.workPriorities} onChange={(e) => onChange((current) => ({ ...current, workPriorities: e.target.value }))} />
      </FormFieldWithHint>
    </>
  );
}
