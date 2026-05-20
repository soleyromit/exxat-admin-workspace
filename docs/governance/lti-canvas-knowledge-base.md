# LTI 1.3 + Canvas Integration — Knowledge Base
# Source: IMS Global LTI 1.3 spec + Canvas SIS CSV docs + Aarti/Vishaka raw transcripts May 2026
# Applies to: Exam Management, PCE, Course Evaluation, Patient Log, Skills Checklist, Learning Contracts

> **Why this doc exists:** Aarti (May 8 transcript): *"LMS integration is a prerequisite for even AI to offer that. That content-based question creation has dependency on it."* Vishaka (May 14): *"Most ExamSoft users have an integration with Canvas, Blackboard, whatever. Student registration is already taken care of."* This document ensures every future conversation about base entities, LTI, or Canvas never has to re-research from scratch.

---

## 1. Architecture Overview

### What LTI Does
LTI (Learning Tools Interoperability) 1.3 is an IMS Global standard that allows Canvas (the LMS) to launch Exxat tools with authenticated user + context identity. When a student or faculty clicks a link in Canvas, Canvas sends a signed JWT token to Exxat containing everything: who the user is, what course they're in, their role, their SIS IDs.

### What Canvas SIS Does
Canvas SIS (Student Information System) CSV import is the **batch data sync path** — Canvas accepts CSV files from the institution's SIS (Banner, Colleague, Peoplesoft, etc.) to populate users, terms, courses, sections, and enrollments. This is how all roster data enters Canvas before LTI can relay it to Exxat.

### Two Integration Paths

```
Prism Users (existing Prism institutions):
  SIS → Canvas → Prism → [Exam Mgmt / PCE / Course Eval]
                   ↕ LTI launch
Non-Prism Users (standalone module sale):
  SIS → Canvas → [Exam Mgmt / PCE / Course Eval]
                   ↕ LTI launch
```

**Aarti's principle (May 8):** *"Either I have sold just the exam management module to them and so when they log in, they're just directly logging into exam management. Or they have multiple modules and they're logging into Prism, and then they're clicking on something that takes them to exam management."* Both paths must work. Base entities are the same in both cases; the only difference is whether Prism enriches them with program-level metadata first.

### LTI 1.3 Launch Flow
1. Student/faculty clicks Exxat link in Canvas
2. Canvas initiates OIDC login (`/login` endpoint)
3. Exxat redirects back to Canvas with `state` + `nonce`
4. Canvas POSTs signed JWT to Exxat `/launch` endpoint
5. JWT contains identity + context claims (see §3)
6. Exxat validates JWT, extracts claims, looks up or creates user + course enrollment
7. Exxat can then call NRPS for full roster, AGS for grade passback

---

## 2. LTI 1.3 Standard Claims — Complete Reference

All fields are in the JWT token sent on every launch.

### 2.1 Authentication / Token Metadata
| Claim | Type | Description |
|---|---|---|
| `iss` | string | Issuer — Canvas's identity (e.g. `https://canvas.instructure.com`) |
| `sub` | string | **Stable user identifier** — unique per user per platform. Primary key for user lookup. |
| `aud` | string | Exxat client_id |
| `iat` | number | Issued-at timestamp (Unix) |
| `exp` | number | Expiry timestamp |
| `nonce` | string | Replay-attack prevention |
| `azp` | string | Authorized party |
| `https://purl.imsglobal.org/spec/lti/claim/deployment_id` | string | Identifies which Canvas-Exxat integration this is |
| `https://purl.imsglobal.org/spec/lti/claim/version` | string | `"1.3.0"` |
| `https://purl.imsglobal.org/spec/lti/claim/message_type` | string | `"LtiResourceLinkRequest"` (standard launch) |

### 2.2 User Identity Claims
| Claim | Type | Required | Description |
|---|---|---|---|
| `sub` | string | ✅ Always | Stable platform-scoped user ID. Use as primary user key. |
| `name` | string | Optional | Full display name |
| `given_name` | string | Optional | First name |
| `family_name` | string | Optional | Last name |
| `middle_name` | string | Optional | Middle name |
| `email` | string | Optional | Preferred email (usually institutional) |
| `picture` | string | Optional | Avatar image URL |
| `locale` | string | Optional | BCP47 language tag (e.g. `en-US`) — accessibility relevance |

### 2.3 Roles Claim
`https://purl.imsglobal.org/spec/lti/claim/roles` — Array of URIs.

**Core context roles (most relevant):**
| URI | Exxat Mapping |
|---|---|
| `http://purl.imsglobal.org/vocab/lis/v2/membership#Learner` | Student |
| `http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor` | Faculty (Course Coordinator or Instructor) |
| `http://purl.imsglobal.org/vocab/lis/v2/membership#Administrator` | Admin |
| `http://purl.imsglobal.org/vocab/lis/v2/membership#TeachingAssistant` | TA / Collaborator |
| `http://purl.imsglobal.org/vocab/lis/v2/membership#Mentor` | Observer / Adviser |

**Institution-level roles:**
| URI | Exxat Mapping |
|---|---|
| `http://purl.imsglobal.org/vocab/lis/v2/institution/person#Student` | Student |
| `http://purl.imsglobal.org/vocab/lis/v2/institution/person#Faculty` | Faculty |
| `http://purl.imsglobal.org/vocab/lis/v2/institution/person#Administrator` | Admin |
| `http://purl.imsglobal.org/vocab/lis/v2/institution/person#Staff` | Staff |

**Instructor sub-roles (from Canvas):**
`PrimaryInstructor`, `SecondaryInstructor`, `Lecturer`, `Grader`, `TeachingAssistant` — use to distinguish Course Coordinator vs. Instructor vs. TA.

### 2.4 Context Claim (Course)
`https://purl.imsglobal.org/spec/lti/claim/context`
| Field | Type | Description |
|---|---|---|
| `id` | string | Stable Canvas course/section identifier. Primary key for course lookup. |
| `label` | string | Course code (e.g. `PHAR101`) |
| `title` | string | Course full name (e.g. `Pharmacology I`) |
| `type` | array | Context types — `CourseOffering`, `CourseSection`, `CourseTemplate`, `Group` |

### 2.5 LIS (Learning Information Services) Claim
`https://purl.imsglobal.org/spec/lti/claim/lis`
| Field | Type | Description |
|---|---|---|
| `person_sourcedid` | string | SIS person identifier (maps to `sis_user_id` in Canvas) — use as Student/Faculty ID |
| `course_offering_sourcedid` | string | SIS course offering identifier (maps to Canvas `sis_course_id`) |
| `course_section_sourcedid` | string | SIS course section identifier |

### 2.6 Platform Claim
`https://purl.imsglobal.org/spec/lti/claim/tool_platform`
| Field | Description |
|---|---|
| `guid` | Stable Canvas instance identifier — use to identify the institution |
| `name` | Institution/platform name |
| `contact_email` | Admin contact |
| `url` | Canvas instance URL (e.g. `https://university.instructure.com`) |
| `product_family_code` | `"canvas"` for Canvas |
| `version` | Canvas version string |

### 2.7 LTI Substitution Variables (Custom Claims)
Sent under `https://purl.imsglobal.org/spec/lti/claim/custom` when configured. Canvas supports all standard LIS variables plus Canvas-specific extensions.

**User variables:**
| Variable | Description |
|---|---|
| `$User.id` | Platform user ID |
| `$User.username` | Login username |
| `$Person.sourcedId` | SIS person ID |
| `$Person.name.full/given/family/middle/prefix` | Name components |
| `$Person.email.primary` | Primary email |
| `$Person.email.personal` | Personal email |
| `$Person.phone.mobile/primary/home/work` | Phone numbers |
| `$Person.address.*` | Address fields |
| `$Person.gender` | Gender |
| `$Person.gender.pronouns` | Pronouns |

**Course variables:**
| Variable | Description |
|---|---|
| `$CourseOffering.sourcedId` | SIS course offering ID |
| `$CourseOffering.label` | Course code |
| `$CourseOffering.title` | Course name |
| `$CourseOffering.courseNumber` | Catalog course number |
| `$CourseOffering.credits` | Credit hours |
| `$CourseOffering.academicSession` | Academic session/term |
| `$CourseSection.sourcedId` | SIS section ID |
| `$CourseSection.label` | Section code |
| `$CourseSection.title` | Section name |
| `$CourseSection.courseNumber` | Section course number |
| `$CourseSection.credits` | Section credits |
| `$CourseSection.maxNumberOfStudents` | Enrollment cap |
| `$CourseSection.numberOfStudents` | Current enrollment count |
| `$CourseSection.dept` | Department |
| `$CourseSection.timeFrame.begin` | Section start date |
| `$CourseSection.timeFrame.end` | Section end date |

**Course template variables:**
| Variable | Description |
|---|---|
| `$CourseTemplate.sourcedId` | SIS master course ID |
| `$CourseTemplate.label` | Template code |
| `$CourseTemplate.title` | Template name |
| `$CourseTemplate.courseNumber` | Catalog number |
| `$CourseTemplate.credits` | Credit hours |
| `$CourseTemplate.shortDescription` | Brief description |
| `$CourseTemplate.longDescription` | Full description |

**Membership (Enrollment) variables:**
| Variable | Description |
|---|---|
| `$Membership.sourcedId` | SIS enrollment ID |
| `$Membership.personSourcedId` | SIS user ID of the member |
| `$Membership.status` | Enrollment status |
| `$Membership.role` | Role in context |
| `$Membership.createdTimestamp` | When enrolled |

---

## 3. Canvas-Specific Extensions

### 3.1 Canvas Custom Substitution Variables
Canvas exposes these via LTI custom parameter substitution (prefix all with `$Canvas.`):

| Variable | Description | Exxat Use |
|---|---|---|
| `$Canvas.user.id` | Canvas internal user ID | User lookup |
| `$Canvas.user.sisSourcedId` | SIS user ID (e.g. student/faculty ID) | Primary identity |
| `$Canvas.user.loginId` | Canvas login username | Authentication |
| `$Canvas.user.isRootAccountAdmin` | Admin flag | Role check |
| `$Canvas.user.prefersHighContrast` | High-contrast accessibility | Accommodation hint |
| `$Canvas.course.id` | Canvas internal course ID | Course lookup |
| `$Canvas.course.name` | Course name | Pre-populate |
| `$Canvas.course.sisSourcedId` | SIS course ID | Course deduplication |
| `$Canvas.course.startAt` | Course start date | Pre-populate |
| `$Canvas.course.workflowState` | available / completed | Status mapping |
| `$Canvas.enrollment.enrollmentState` | active / inactive | Enrollment status |
| `$Canvas.enrollment.lastActivityAt` | Last login in course | Engagement data |
| `$Canvas.term.name` | Term display name | Term pre-populate |
| `$Canvas.term.startAt` | Term start date | Term pre-populate |
| `$Canvas.term.endAt` | Term end date | Term pre-populate |
| `$Canvas.term.sisSourcedId` | SIS term ID | Term deduplication |
| `$Canvas.account.id` | Canvas account (sub-institution) | Multi-tenant |
| `$Canvas.account.name` | Account name | Institution display |
| `$Canvas.account.sisSourcedId` | SIS account ID | Institution ID |
| `$Canvas.rootAccount.id` | Top-level Canvas instance | Tenant key |

### 3.2 Canvas SIS CSV — Complete Field Reference

**This is the authoritative mapping for what Canvas accepts from institutional SIS systems.**

#### users.csv (→ Student + Faculty)
| Canvas Field | Exxat Entity Field | Notes |
|---|---|---|
| `user_id` | `sis_user_id` / Student ID / Faculty ID | Primary SIS identifier |
| `integration_id` | `integration_id` | Secondary ID for complex integrations |
| `login_id` | email / login | Canvas username |
| `first_name` | First name component | |
| `last_name` | Last name component | |
| `full_name` | Full name | |
| `sortable_name` | Sort key | |
| `short_name` | Display name | |
| `email` | Email | |
| `pronouns` | Pronouns | Accessibility |
| `declared_user_type` | `student`, `teacher`, `staff`, `administrator`, `observer` | Role hint |
| `status` | `active` / `suspended` / `deleted` | Status badge source |

#### terms.csv (→ Term entity)
| Canvas Field | Exxat Term Field | Notes |
|---|---|---|
| `term_id` | SIS Term ID | Primary key |
| `name` | Term label | e.g. "Fall 2025" |
| `status` | `active` / `deleted` | Term status |
| `integration_id` | Integration ID | |
| `start_date` | Start Date | ISO 8601 |
| `end_date` | End Date | ISO 8601 |

#### courses.csv (→ Course Offering + Master Course)
| Canvas Field | Exxat Field | Notes |
|---|---|---|
| `course_id` | SIS Course ID | Primary key |
| `short_name` | Course code / Course Number | e.g. "PHAR101" |
| `long_name` | Course name | |
| `account_id` | Department / Program | |
| `term_id` | Term (FK to terms) | Links offering to term |
| `status` | `active` / `completed` / `published` | Status badge |
| `integration_id` | Integration ID | |
| `start_date` | Start Date | |
| `end_date` | End Date | |
| `course_format` | `on_campus` / `online` / `blended` | Course format |
| `blueprint_course_id` | Master course reference | Master course → offering link |

#### sections.csv (→ Course Offering sections / cohort grouping)
| Canvas Field | Exxat Field | Notes |
|---|---|---|
| `section_id` | SIS Section ID | |
| `course_id` | Parent course | |
| `name` | Section / Cohort name | Canvas sections can map to Exxat cohorts |
| `start_date` | Section start | |
| `end_date` | Section end | |

#### enrollments.csv (→ Student ↔ Course + Faculty ↔ Course)
| Canvas Field | Exxat Field | Notes |
|---|---|---|
| `course_id` | Course Offering FK | |
| `user_id` | Student ID / Faculty ID | |
| `section_id` | Section / Cohort | |
| `role` | `student`, `teacher`, `ta`, `observer`, `designer` | Maps to Exxat roles |
| `role_id` | Custom role | Maps to Course Coordinator / Instructor |
| `status` | `active` / `completed` / `inactive` | Enrollment state |
| `start_date` | Enrollment start | |
| `end_date` | Enrollment end | |
| `limit_section_privileges` | Section-scoped access | |

---

## 4. LTI Services — NRPS and AGS

### 4.1 Names and Roles Provisioning Service (NRPS)
NRPS allows Exxat to **pull the full course roster** from Canvas for any context where we have a valid LTI deployment.

**Endpoint:** `https://purl.imsglobal.org/spec/lti-nrps/claim/namesroleservice`

**Response per member:**
- `user_id` — Canvas user ID (matches LTI `sub`)
- `status` — Active / Inactive / Deleted
- `name`, `given_name`, `family_name`, `email`, `picture`
- `roles` — Array of role URIs (Learner / Instructor / etc.)
- `lis_person_sourcedid` — SIS person ID

**When to use:** When creating a new Course Offering in Exxat, call NRPS to import all enrolled students and assigned faculty without manual input. This is the mechanism Aarti referenced: *"From Blackboard itself, they pull it out. This course has five faculty."*

### 4.2 Assignment and Grade Services (AGS)
AGS allows Exxat to **push exam scores back to Canvas** grade book.

**Line Items (Assessments):**
- `label` — Assessment title
- `scoreMaximum` — Max possible score
- `dueAt` — Due date
- `submissionType` — Submission type

**Score payload (Exxat → Canvas):**
- `userId` — Canvas user ID
- `scoreGiven` — Student's raw score
- `scoreMaximum` — Total possible
- `comment` — Optional feedback
- `gradingProgress` — `FullyGraded` / `PendingManual`
- `activityProgress` — `Submitted` / `Completed`
- `timestamp` — ISO 8601

**Note:** Canvas stores individual assessment scores from Exxat. Final course grades are calculated in Canvas from all submissions (Exxat + any other LMS assignments). Vishaka (May 14): *"Course grades are not saved in exam management. They are always saved in LMS."*

---

## 5. Entity-Level Field Mapping + Gap Analysis

### Status legend
- ✅ **Covered** — field exists in current UI and has a clear LTI/Canvas source
- ⚠️ **Partial** — field exists but label/source needs clarification
- ❌ **Missing** — field not in current UI but available from LTI/Canvas
- 🔒 **Lock when active** — field should be read-only when Canvas integration is live
- 🔵 **Exxat-native** — field has no LTI/Canvas equivalent; Exxat or Prism is the source

---

### 5.1 Student Entity

**List columns:**
| Field | LTI Source | Canvas SIS Source | Status |
|---|---|---|---|
| Student name | `name` / `given_name` + `family_name` | `users.csv: full_name` / `first_name` + `last_name` | ✅ 🔒 |
| Email | `email` | `users.csv: email` | ✅ 🔒 |
| Cohort | — | `sections.csv: name` (Canvas sections map to cohorts) | ⚠️ Map Canvas section → cohort |
| Status badge | `$Canvas.enrollment.enrollmentState` | `enrollments.csv: status` | ✅ 🔒 |
| # Courses registered | NRPS (count memberships) | Derived from `enrollments.csv` | ✅ derived |
| Adviser | — | — | 🔵 Prism/Exxat only |
| Cumulative GPA | — | — | 🔵 LMS/Prism only |
| Annotation tags | — | — | 🔵 Exxat only |

**Detail header:**
| Field | LTI Source | Canvas SIS Source | Status |
|---|---|---|---|
| Full name | `name` | `users.csv: full_name` | ✅ 🔒 |
| Student ID | `lis.person_sourcedid` / `$Canvas.user.sisSourcedId` | `users.csv: user_id` | ⚠️ Label as "SIS ID" when Canvas-sourced |
| Cohort + Program | — | `sections.csv: name` + Prism program data | 🔵 + ⚠️ |
| Academic standing badge | — | — | 🔵 Exxat computed |
| Adviser name | — | — | 🔵 Prism only |

**❌ Fields missing from current UI that LTI/Canvas provides:**
| Missing Field | Source | Add To |
|---|---|---|
| `declared_user_type` / `pronouns` | `users.csv` | Student detail Profile section |
| LTI `sub` (internal reference) | LTI `sub` claim | Hidden (stored, not displayed) |
| Canvas login ID | `$Canvas.user.loginId` | Hidden (stored for lookup) |
| Enrollment status per course | `enrollments.csv: status` | Courses tab row |
| `$Canvas.enrollment.lastActivityAt` | LTI custom | Student detail engagement hint |

**On create — mandatory when Canvas/LTI active:**
```
Required to accept a new student record via LTI:
  - sub (LTI user ID) — internal key
  - lis.person_sourcedid (SIS ID) — displayed as Student ID
  - name OR given_name + family_name
  - email
  - roles must include Learner URI
  - enrollment context ID (which course they're being enrolled in)
```

---

### 5.2 Faculty Entity

**List columns:**
| Field | LTI Source | Canvas SIS Source | Status |
|---|---|---|---|
| Name | `name` | `users.csv: full_name` | ✅ 🔒 |
| Email | `email` | `users.csv: email` | ✅ 🔒 |
| Status | `$Canvas.enrollment.enrollmentState` | `enrollments.csv: status` | ✅ 🔒 |
| Administrative Position | — | `users.csv: declared_user_type` (teacher/staff) — partial | ⚠️ |
| Faculty Rank | — | — | 🔵 HR / Prism only |
| Faculty/Staff type | Roles: Instructor / TA sub-roles | `enrollments.csv: role` (teacher/ta/designer) | ⚠️ Map enrollment role → Faculty type |
| Courses assigned (count) | NRPS | Derived from `enrollments.csv` | ✅ derived |
| Last Updated | — | — | 🔵 Exxat metadata |

**Detail header:**
| Field | LTI Source | Canvas SIS Source | Status |
|---|---|---|---|
| Full name | `name` | `users.csv: full_name` | ✅ 🔒 |
| Faculty ID | `lis.person_sourcedid` / `$Canvas.user.sisSourcedId` | `users.csv: user_id` | ⚠️ Label as "SIS ID" |
| Administrative Position | — | `users.csv: declared_user_type` | ⚠️ |
| Faculty Rank | — | — | 🔵 |
| Status | Enrollment state | `users.csv: status` | ✅ 🔒 |

**❌ Fields missing from current UI that LTI/Canvas provides:**
| Missing Field | Source | Add To |
|---|---|---|
| Enrollment role per course (teacher/ta) | `enrollments.csv: role` or `role_id` | Teaching tab — show course role |
| Course section assignments | `sections.csv` via NRPS | Teaching tab — section column |
| Canvas login ID | `$Canvas.user.loginId` | Profile section (stored) |
| `declared_user_type` | `users.csv` | Profile tab |

**On create — mandatory when Canvas/LTI active:**
```
Required to accept a new faculty record via LTI:
  - sub (LTI user ID)
  - lis.person_sourcedid (SIS ID)
  - name OR given_name + family_name
  - email
  - roles must include Instructor URI (or TA/TeachingAssistant)
  - enrollment context ID (which course they teach)
  - enrollment role (teacher vs ta → Course Coordinator vs Instructor)
```

---

### 5.3 Course Offering Entity

**List columns:**
| Field | LTI Source | Canvas SIS Source | Status |
|---|---|---|---|
| Course number | `$Context.label` / `$CourseOffering.courseNumber` | `courses.csv: short_name` | ✅ 🔒 |
| Course name | `$Context.title` / `$CourseOffering.title` | `courses.csv: long_name` | ✅ 🔒 |
| Academic Year | Derived from term dates | Derived from `terms.csv` | ⚠️ Derived; not direct |
| Term | `$Canvas.term.name` / `$CourseOffering.academicSession` | `courses.csv: term_id` → `terms.csv: name` | ✅ 🔒 |
| Cohort | — | `sections.csv: name` (section = cohort) | ⚠️ Map Canvas section |
| Start Date | `$CourseSection.timeFrame.begin` | `courses.csv: start_date` | ✅ 🔒 |
| End Date | `$CourseSection.timeFrame.end` | `courses.csv: end_date` | ✅ 🔒 |
| Registered Students | `$CourseSection.numberOfStudents` | Counted from `enrollments.csv` | ✅ 🔒 |
| Professional Year | — | — | 🔵 Exxat/Prism program metadata |
| Faculty/Staff | NRPS (roles = Instructor) | `enrollments.csv: role=teacher` | ✅ via NRPS |
| Status | `$Canvas.course.workflowState` | `courses.csv: status` | ⚠️ Map: available→Ongoing, completed→Completed |

**Detail header:**
| Field | LTI Source | Canvas SIS Source | Status |
|---|---|---|---|
| Course number + name | `$Context.label/title` | `courses.csv: short_name/long_name` | ✅ 🔒 |
| Academic Year | Derived | Derived | ⚠️ |
| Professional Year | — | — | 🔵 |
| Term | `$Canvas.term.name` | `courses.csv: term_id` | ✅ 🔒 |
| Cohort | — | `sections.csv: name` | ⚠️ |
| Registered students count | NRPS / `$CourseSection.numberOfStudents` | `enrollments.csv` count | ✅ |

**❌ Fields missing from current UI that LTI/Canvas provides:**
| Missing Field | Source | Add To |
|---|---|---|
| SIS Course ID | `lis.course_offering_sourcedid` / `$Canvas.course.sisSourcedId` | Course detail header (stored; show if Canvas-sourced) |
| Canvas Course ID | `$Context.id` | Hidden (stored for NRPS/AGS calls) |
| SIS Section ID | `lis.course_section_sourcedid` | Hidden (stored) |
| Credit hours | `$CourseOffering.credits` / `$CourseSection.credits` | Course Details tab |
| Course format | `courses.csv: course_format` | Course Details tab |
| Blueprint course ID | `courses.csv: blueprint_course_id` | Links to Master Course |
| Max enrollment | `$CourseSection.maxNumberOfStudents` | Course Details tab |
| Department | `$CourseSection.dept` | Course Details tab |

**On create — mandatory when Canvas/LTI active:**
```
Required fields populated from Canvas when creating a Course Offering:
  - context.id (Canvas course ID) — internal key for NRPS/AGS
  - lis.course_offering_sourcedid (SIS course ID)
  - context.label (course code / short name)
  - context.title (course full name)
  - Canvas.term.name + Canvas.term.startAt + Canvas.term.endAt
  - CourseSection.numberOfStudents
  - Course Coordinator: enrollment with teacher role (from NRPS)
  
Fields still requiring manual input (not from Canvas):
  - Cohort (Exxat concept — map from Canvas section name OR manual)
  - Professional Year (Exxat concept — manual)
```

---

### 5.4 Term Entity

**Grid + drawer fields:**
| Field | LTI Source | Canvas SIS Source | Status |
|---|---|---|---|
| Term label / name | `$Canvas.term.name` | `terms.csv: name` | ✅ 🔒 |
| Academic Year | Derived from start/end dates | Derived | ⚠️ |
| Start Date | `$Canvas.term.startAt` | `terms.csv: start_date` | ✅ 🔒 |
| End Date | `$Canvas.term.endAt` | `terms.csv: end_date` | ✅ 🔒 |
| Status | Derived (active if now between start/end) | `terms.csv: status` | ✅ 🔒 |
| Notes | — | — | 🔵 Exxat only |

**❌ Fields missing from current UI that LTI/Canvas provides:**
| Missing Field | Source | Add To |
|---|---|---|
| SIS Term ID | `$Canvas.term.sisSourcedId` | `terms.csv: term_id` | Drawer (stored; lock if Canvas-sourced) |
| Canvas Term ID | Internal | Hidden (stored) |
| Integration ID | `terms.csv: integration_id` | Hidden |

**LMS locked behaviour:** When Canvas integration is active, ALL Term fields except Notes should be read-only. Aarti (May 8): *"When Canvas integration is active, terms are imported automatically and fields are locked."* The drawer should show a banner: *"Terms are imported from Canvas — editing is disabled while integration is active."*

**On create — mandatory when Canvas/LTI active:**
```
All term fields are Canvas-sourced when integration is active.
Manual creation is only for non-Canvas institutions (direct manual entry).
SIS Term ID should be stored on every term imported from Canvas.
```

---

### 5.5 Master Course Entity (Course Catalog)

**Grid + drawer fields:**
| Field | LTI Source | Canvas SIS Source | Status |
|---|---|---|---|
| Course number | `$CourseTemplate.courseNumber` | `courses.csv: short_name` (blueprint) | ✅ |
| Course name | `$CourseTemplate.title` | `courses.csv: long_name` (blueprint) | ✅ |
| Credits | `$CourseTemplate.credits` | — (not in SIS CSV) | ⚠️ LTI variable but no SIS CSV equivalent |
| Type (Core/Elective) | — | — | 🔵 Exxat concept |
| Department | `$CourseSection.dept` (indirect) | `courses.csv: account_id` hierarchy | ⚠️ Map account hierarchy |
| Description | `$CourseTemplate.shortDescription` | — | ❌ Not shown in current UI |
| Prerequisites | — | — | 🔵 Exxat only |

**❌ Fields missing from current UI that LTI/Canvas provides:**
| Missing Field | Source | Add To |
|---|---|---|
| SIS Course Template ID | `$CourseTemplate.sourcedId` | Drawer (stored; show if Canvas-sourced) |
| Short description | `$CourseTemplate.shortDescription` | Drawer: Description field |
| Long description | `$CourseTemplate.longDescription` | Drawer: Full description |
| Blueprint course flag | `courses.csv: blueprint_course_id` | Grid column (badge) |

**Exam Management behaviour:** Creating an offering from a master course auto-generates a QB shell. When a Canvas blueprint course maps to a master course, the `blueprint_course_id` is the connector.

---

### 5.6 Enrollment (Student ↔ Course Offering Relationship)

Not shown as its own entity page, but enrollment data from Canvas SIS is critical.

| Canvas Field | Exxat Use |
|---|---|
| `enrollments.csv: user_id` | Links student to course |
| `enrollments.csv: course_id` | The course offering |
| `enrollments.csv: section_id` | The cohort/section |
| `enrollments.csv: role` | student / teacher / ta / observer / designer |
| `enrollments.csv: role_id` | Custom role (maps to Course Coordinator / Instructor distinction) |
| `enrollments.csv: status` | active / completed / inactive — enrollment state badge |
| `enrollments.csv: start_date` / `end_date` | Enrollment window |
| `enrollments.csv: limit_section_privileges` | Whether faculty see only their section |

---

## 6. Mandatory Fields Summary — "What Must Be Present Before Creating Each Entity"

### When Canvas integration is active, Exxat must enforce:

**Student (new or imported):**
- SIS User ID (`users.csv: user_id` / LTI `lis.person_sourcedid`) — **mandatory**
- Full name — **mandatory**
- Email — **mandatory**
- Enrollment status — **mandatory** (from `enrollments.csv: status`)
- Role must resolve to Learner — **mandatory**

**Faculty (new or imported):**
- SIS User ID — **mandatory**
- Full name — **mandatory**
- Email — **mandatory**
- `declared_user_type`: teacher/ta/staff — **mandatory** (determines role in courses)
- Canvas enrollment role per course (teacher/ta/designer) — **mandatory** to set Course Coordinator vs. Instructor

**Course Offering (new or imported):**
- SIS Course ID (`courses.csv: course_id` / LTI `lis.course_offering_sourcedid`) — **mandatory**
- Course code (short_name) — **mandatory**
- Course name (long_name) — **mandatory**
- Term ID (links to `terms.csv`) — **mandatory**
- Start/end dates — **mandatory**
- Cohort — **mandatory** (map from Canvas section OR require manual input)

**Term (imported from Canvas):**
- SIS Term ID — **mandatory** for deduplication
- Name, start_date, end_date — **mandatory**
- All other fields locked from editing when Canvas-active

**Master Course:**
- Course number — **mandatory**
- Course name — **mandatory**
- Credits — recommended (from LTI `$CourseTemplate.credits`)
- Department — recommended (from Canvas account hierarchy)

---

## 7. Prism vs. Non-Prism Users

### Prism User Path
```
Institution SIS → Canvas (via SIS CSV import)
                → Prism (enriched with program metadata: cohorts, professional years, competencies, adviser)
                → LTI launch → Exam Mgmt / PCE / Course Eval
```
In this path:
- Prism enriches base entities with fields Canvas doesn't have: cohort, professional year, academic standing, adviser, program, competency mappings
- LTI `sub` + `lis.person_sourcedid` map to Prism user record
- When a Prism user clicks through to Exam Management: all base entities already exist (pre-populated from Prism)
- "View full profile in Prism" link is shown as fallback for HR/compliance data

### Non-Prism User Path (standalone module sale)
```
Institution SIS → Canvas (via SIS CSV import)
                → LTI launch → Exam Mgmt directly (no Prism)
```
In this path:
- Exxat **must** accept bare LTI/Canvas data without Prism enrichment
- Fields like cohort, professional year, adviser — require manual input OR canvas section/group mapping
- Canvas sections can substitute as cohort groupings for non-Prism institutions
- Exxat creates local user/course records on first LTI launch ("just-in-time provisioning")
- The "View full profile in Prism" fallback is hidden for non-Prism users

**Aarti (May 8):** *"Either I have sold just the exam management module to them and so when they log in, they're just directly logging into exam management... But once I'm in my exam management... my menu items have to only be limited to the entities that I care about in this section."*

### Field availability by path

| Field | Prism path | Non-Prism path |
|---|---|---|
| Student ID | Prism SIS ID (pre-exists) | LTI `person_sourcedid` — first-launch created |
| Cohort | Prism program cohort | Manual input OR Canvas section name |
| Professional Year | Prism program year | Manual input only |
| Adviser | Prism advising record | Not available |
| Academic standing | Prism computed | Not available (Exxat can compute from exam scores only) |
| Competency mapping | Prism + Exam Mgmt | Exam Mgmt only (from question tagging) |
| Annotation tags | Prism | Not available |

---

## 8. Cross-Product Applicability

All five base entities are shared across products. This LTI/Canvas mapping applies identically to:

| Product | Notes |
|---|---|
| **Exam Management** | Primary use case. LTI launch for assessment taking. AGS for grade passback. |
| **PCE** | Same student/faculty entities. Course Offering maps to clinical placement offering. Term same. |
| **Course Evaluation** | Same course/faculty entities. LTI used to launch surveys from Canvas module. |
| **Patient Log** | Student-centric. LTI launch for logging entries. Course Offering = clinical rotation. |
| **Skills Checklist** | Student/faculty. Instructor role launches checklist per student. |
| **Learning Contracts** | Student/adviser. Observer role in LTI covers adviser relationship. |

**Key rule:** Any field added to BASE-ENTITIES.md as "sourced from LTI/Canvas" automatically applies to ALL products. Do not create product-specific entity schemas for fields that are universal Canvas data.

---

## 9. UI/UX Implications

### Locked field pattern (Canvas-active)
When Canvas integration is live for an institution, fields sourced from Canvas should:
1. Show the value (not empty)
2. Show a lock icon + "Synced from Canvas" tooltip on hover
3. Not be editable inline
4. Show in the drawer with a `read-only` input state

```
Currently implemented partially: Terms drawer has LMS info banner.
Needs to be applied to: Student name/email, Faculty name/email, Course name/dates/term.
```

### Canvas integration status indicator
Each entity page needs a banner (or header chip) indicating:
- **"Canvas integration active"** → fields are pre-populated, locked ones cannot be edited
- **"No Canvas integration"** → all fields are manual; encourage SIS setup for large cohorts

### Just-in-time provisioning
For non-Prism users arriving via LTI for the first time:
- Exxat creates the user record from LTI claims automatically
- Student is auto-enrolled in the course context from the LTI launch
- Admin sees the student on the roster immediately without manual import
- Missing fields (cohort, professional year) shown as empty with "Set manually" CTA

---

## 10. Implementation Notes for Engineering

### Token storage
- Store `sub` + `lis.person_sourcedid` + `$Canvas.user.sisSourcedId` on every user record
- Use `sub` as the LTI primary key; `sis_user_id` as the cross-system display ID
- Store `$Context.id` (Canvas course ID) on every Course Offering for NRPS/AGS calls
- Store `tool_platform.guid` to identify which Canvas instance (tenant key for multi-institution)

### NRPS call trigger points
- On first LTI launch in a course context → auto-import full roster
- On admin "Sync from Canvas" action → refresh roster
- Nightly scheduled sync for active courses (optional, Phase 2)

### AGS grade passback
- After exam submission in assessment-taker → POST score to AGS immediately
- Score = `scoreGiven / scoreMaximum * 100`
- `gradingProgress: FullyGraded` for auto-scored; `PendingManual` for essay

### Canvas SIS CSV import UI
For non-LTI path (batch import):
- Accept ZIP of CSV files matching the Canvas SIS format
- Users, terms, courses, sections, enrollments — in dependency order
- Validate: user_id uniqueness, term_id references, course-term FK, enrollment-course FK

---

## Sources
- IMS Global LTI 1.3 Implementation Guide: https://www.imsglobal.org/spec/lti/v1p3/impl/
- IMS Global LTI 1.3 Specification: https://www.imsglobal.org/spec/lti/v1p3/
- Canvas SIS CSV Documentation: https://developerdocs.instructure.com/services/canvas/sis/file.sis_csv
- Aarti, May 8 2026 — "Exam management and course evaluation — curriculum mapping, base entities, and product alignment" (raw Granola transcript)
- Vishaka, May 14 2026 — "Assessment builder — base entities, student experience, and PRD workflow" (raw Granola transcript)
- BASE-ENTITIES.md — `/Users/romitsoley/Work/docs/BASE-ENTITIES.md`
