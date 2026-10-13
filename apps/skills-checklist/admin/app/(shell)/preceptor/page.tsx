import { PreceptorView } from "@/components/preceptor/preceptor-view"

/**
 * Preceptor Evaluation (prototype page): the "Evaluations sent" mailbox and the form an evaluator opens from the
 * emailed link. The real link target is the shell-free /e/[token] (EV-01); this page renders the same form inside
 * the shell so a program can see what an evaluator sees.
 */
export default function Page() {
  return <PreceptorView />
}
