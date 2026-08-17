/**
 * The student landing.
 *
 * A student has a session but no product: nothing in the coordinator nav is
 * theirs to open, so the shell drops the primary sidebar here for the same
 * reason it drops it on the products home. The utility bar stays, because
 * identity and sign-out still belong to them.
 *
 * This is a role landing, not a product. Exxat has no student product today
 * (`exxat-student-success` is a coordinator analytics app despite the name), so
 * a shell-global route is the honest shape rather than inventing a product entry
 * that owns one page.
 */

export const STUDENT_HOME_PATH = "/student"

export function isStudentHomePath(pathname: string): boolean {
  return pathname === STUDENT_HOME_PATH || pathname.startsWith(`${STUDENT_HOME_PATH}/`)
}
