"use client"

import * as React from "react"
import { ButtonSegmentedControl } from "@exxatdesignux/ui/components/ui/button-segmented-control"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { Textarea } from "@exxatdesignux/ui/components/ui/textarea"
import * as C from "@/lib/copy"
import { r2c } from "@/lib/copy/r2-configure"
import { createTaxon } from "@/lib/store"
import { useActions } from "@/lib/store/react"
import { describedBy, Errors } from "./section-card"
import { useConfigure } from "./context"
import { TagChips } from "./tag-chips"

const NONE = "__none__"
const t = r2c.step1

/**
 * Step 1, Skill definition (SL-02..SL-06): name, description, category with an inline "New", tags as chips with "New tag",
 * and the Active / Inactive status. Creating a category or tag here is immediate and selects it (SL-05).
 */
export function DefinitionSection() {
  const { db, def, setDef, visible, touch, announce } = useConfigure()
  const { run } = useActions()
  const [adding, setAdding] = React.useState<"category" | "tag" | null>(null)
  const [newName, setNewName] = React.useState("")
  const [addError, setAddError] = React.useState<string | null>(null)
  const nameErrors = visible("name")

  const reset = () => {
    setAdding(null)
    setNewName("")
    setAddError(null)
  }
  const create = (kind: "category" | "tag") => {
    const r = run((d) => createTaxon(d, kind, { name: newName }))
    if (!r.ok) {
      setAddError(r.error.code === "duplicate" ? `A ${kind} with this name already exists.` : C.validation.required(kind === "category" ? "Category name" : "Tag name"))
      return
    }
    if (kind === "category") setDef((d) => ({ ...d, categoryId: r.value.id }))
    else setDef((d) => ({ ...d, tagIds: [...d.tagIds, r.value.id] }))
    announce(`${kind === "category" ? "Category" : "Tag"} ${newName.trim()} created and selected.`)
    reset()
  }

  const currentCat = db.categories.find((c) => c.id === def.categoryId)
  const categoryOptions = db.categories.filter((c) => c.active || c.id === def.categoryId)

  return (
    <div className="flex flex-col gap-4" id="sec-skill">
      <Field>
        <FieldLabel htmlFor="cfg-name">{t.name} *</FieldLabel>
        <Input id="cfg-name" value={def.name} aria-required="true" aria-invalid={nameErrors.length > 0} aria-describedby={describedBy(nameErrors, "cfg-name")} onChange={(e) => setDef((d) => ({ ...d, name: e.target.value }))} onBlur={() => touch("skill")} />
        <Errors issues={nameErrors} for="cfg-name" />
      </Field>
      <Field>
        <FieldLabel htmlFor="cfg-description">{t.description}</FieldLabel>
        <Textarea id="cfg-description" value={def.description} rows={2} onChange={(e) => setDef((d) => ({ ...d, description: e.target.value }))} />
      </Field>
      <Field>
        <FieldLabel htmlFor="cfg-category">{t.category}</FieldLabel>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={def.categoryId ?? NONE} onValueChange={(v) => setDef((d) => ({ ...d, categoryId: v === NONE ? null : v }))}>
            <SelectTrigger id="cfg-category" className="w-64" aria-label="Category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>{r2c.add.noCategory}</SelectItem>
              {categoryOptions.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                  {c.active ? "" : " (inactive)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {adding !== "category" ? (
            <Button type="button" variant="outline" size="sm" onClick={() => setAdding("category")}>
              {t.newCategory}
            </Button>
          ) : null}
        </div>
        {currentCat && !currentCat.active ? <FieldDescription>This category is inactive. It stays on the skill until you remove it.</FieldDescription> : <FieldDescription>{t.categoryHelp}</FieldDescription>}
        {adding === "category" ? <NewTaxon kind="category" value={newName} error={addError} onChange={setNewName} onCreate={() => create("category")} onCancel={reset} /> : null}
      </Field>
      <Field>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <FieldLabel id="cfg-tags-label">{t.tags}</FieldLabel>
          {adding !== "tag" ? (
            <Button type="button" variant="outline" size="sm" onClick={() => setAdding("tag")}>
              {t.newTag}
            </Button>
          ) : null}
        </div>
        <TagChips tags={db.tags} value={def.tagIds} onChange={(tagIds) => setDef((d) => ({ ...d, tagIds }))} labelledBy="cfg-tags-label" />
        <FieldDescription>{t.tagsHelp}</FieldDescription>
        {def.tagIds.some((id) => db.tags.find((x) => x.id === id && !x.active)) ? <FieldDescription>An inactive tag stays on the skill until you remove it. Select it again to remove it.</FieldDescription> : null}
        {adding === "tag" ? <NewTaxon kind="tag" value={newName} error={addError} onChange={setNewName} onCreate={() => create("tag")} onCancel={reset} /> : null}
      </Field>
      <Field>
        <FieldLabel id="cfg-status-label">{t.status}</FieldLabel>
        <ButtonSegmentedControl
          aria-label={t.status}
          aria-describedby="cfg-status-help"
          value={def.active ? "active" : "inactive"}
          onValueChange={(v) => setDef((d) => ({ ...d, active: v === "active" }))}
          options={[
            { value: "active", label: t.active },
            { value: "inactive", label: t.inactive },
          ]}
        />
        <FieldDescription id="cfg-status-help">{t.statusHelp}</FieldDescription>
      </Field>
    </div>
  )
}

function NewTaxon({ kind, value, error, onChange, onCreate, onCancel }: { kind: "category" | "tag"; value: string; error: string | null; onChange: (v: string) => void; onCreate: () => void; onCancel: () => void }) {
  const label = kind === "category" ? "New category" : "New tag"
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={label}>
      <Input aria-label={`${label} name`} className="w-64" value={value} onChange={(e) => onChange(e.target.value)} />
      <Button type="button" variant="outline" size="sm" onClick={onCreate}>
        Create {kind}
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
        Cancel
      </Button>
      {error ? <p className="basis-full text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
