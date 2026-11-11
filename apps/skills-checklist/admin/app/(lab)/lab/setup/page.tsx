import { redirect } from "next/navigation"

/**
 * `/lab/setup`: the way into the setup flow (D-L46, Proposed). The landing Library on the new program, whose Set up skills opens
 * the wizard. A static segment, so it wins over `[persona]`.
 */
export default function LabSetupPage() {
  redirect("/flow/set-up-skills/library?set=1&program=new")
}
