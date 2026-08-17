"use client"

/**
 * Edit UI delivery fields for one registry item (comment + Storybook URL).
 */

import * as React from "react"

import {
  FloatingSheetPanel,
  FloatingSheetPanelBody,
  FloatingSheetPanelContent,
  FloatingSheetPanelFooter,
  FloatingSheetPanelHeader,
  FloatingSheetPanelToolbar,
} from "@/lib/floating-sheet-panel"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Shortcut } from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  UI_DELIVERY_LABEL,
  type DeliveryTrackerRow,
  type UiDeliveryStatus,
} from "@/lib/delivery-tracker"

export interface DeliveryTrackerEditSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  row: DeliveryTrackerRow | null
  onSave: (values: {
    delivery: UiDeliveryStatus
    comment: string
    storybookUrl: string
  }) => void
}

export function DeliveryTrackerEditSheet({
  open,
  onOpenChange,
  row,
  onSave,
}: DeliveryTrackerEditSheetProps) {
  const [delivery, setDelivery] = React.useState<UiDeliveryStatus>("not_started")
  const [comment, setComment] = React.useState("")
  const [storybookUrl, setStorybookUrl] = React.useState("")

  React.useEffect(() => {
    if (!row || !open) return
    setDelivery(row.delivery)
    setComment(row.comment)
    setStorybookUrl(row.storybookUrl)
  }, [row, open])

  const handleSave = React.useCallback(() => {
    onSave({
      delivery,
      comment: comment.trim(),
      storybookUrl: storybookUrl.trim(),
    })
    onOpenChange(false)
  }, [comment, delivery, onOpenChange, onSave, storybookUrl])

  const title = row ? `Edit ${row.name}` : "Edit delivery"

  return (
    <FloatingSheetPanel open={open} onOpenChange={onOpenChange}>
      <FloatingSheetPanelContent contentSlot="delivery-tracker-edit">
        <FloatingSheetPanelToolbar />
        <FloatingSheetPanelHeader title={title} />
        <FloatingSheetPanelBody className="gap-6 px-4 pb-4">
          {row ? (
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="delivery-status">UI delivery</FieldLabel>
                <Select
                  value={delivery}
                  onValueChange={value => setDelivery(value as UiDeliveryStatus)}
                >
                  <SelectTrigger id="delivery-status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(UI_DELIVERY_LABEL) as UiDeliveryStatus[]).map(status => (
                      <SelectItem key={status} value={status}>
                        {UI_DELIVERY_LABEL[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="delivery-storybook">Storybook URL</FieldLabel>
                <Input
                  id="delivery-storybook"
                  type="url"
                  inputMode="url"
                  value={storybookUrl}
                  onChange={e => setStorybookUrl(e.target.value)}
                  placeholder="https://storybook.example.com/?path=/docs/button"
                  autoComplete="off"
                />
                <FieldDescription>
                  Full URL including https:// and the Storybook path.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="delivery-comment">Comment</FieldLabel>
                <Textarea
                  id="delivery-comment"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={4}
                  placeholder="Notes for the team"
                />
              </Field>
            </FieldGroup>
          ) : null}
        </FloatingSheetPanelBody>
        <FloatingSheetPanelFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
            <KbdGroup className="ml-1.5">
              <Kbd variant="bare">Esc</Kbd>
            </KbdGroup>
          </Button>
          <Button type="button" onClick={handleSave} disabled={!row}>
            Save
            <KbdGroup className="ml-1.5">
              <Kbd variant="bare">⏎</Kbd>
            </KbdGroup>
          </Button>
          {open ? <Shortcut keys="Enter" onInvoke={handleSave} /> : null}
        </FloatingSheetPanelFooter>
      </FloatingSheetPanelContent>
    </FloatingSheetPanel>
  )
}
