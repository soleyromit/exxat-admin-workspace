/**
 * Page titles for the utility-bar breadcrumb. Labels are the prototype's page names (docs/source/prototype-text-dump.txt).
 * In the DS bar a top-level page shows only its title after the product switcher (starter "Dashboard"); the
 * "Skills & Competencies / Nursing" trail of the prototype is carried by the product switcher and scope switcher instead.
 * Longest matching prefix wins.
 */
const TITLES: Array<[prefix: string, title: string]> = [
  ["/home", "Home"],
  ["/attainment", "Attainment"],
  ["/skills/library", "Skills"],
  ["/skills", "Skills"],
  ["/courses", "Courses"],
  ["/reviews", "Reviews"],
  ["/my-skills", "My skills"],
  ["/student", "Student View"],
  ["/preceptor", "Preceptor Evaluation"],
  ["/dev", "Sample data"],
]

/** The student's course-skills URLs live under /courses but belong to the student view (see viewForPath). */
const STUDENT_COURSE_SKILLS = /^\/courses\/[^/]+\/skills(\/|$)/

export function pageTitleFor(pathname: string): string {
  if (STUDENT_COURSE_SKILLS.test(pathname)) return "Student View"
  const hit = TITLES.filter(([p]) => pathname === p || pathname.startsWith(`${p}/`)).sort((a, b) => b[0].length - a[0].length)[0]
  return hit ? hit[1] : "Home"
}
