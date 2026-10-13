import { EvaluatorForm } from "@/components/evaluator/evaluator-form"

/**
 * S-16. The token is the only input. No login, no shell (see the layout). The data behind it is read client-side from the
 * local store in this demo; a real backend would resolve the token server-side and return only this request (OD-18 open).
 */
export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return <EvaluatorForm token={token} />
}
