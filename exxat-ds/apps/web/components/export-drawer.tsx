"use client"

/**
 * ExportDrawer — floating right-side drawer with export form.
 *
 * Uses the same Sheet pattern as TablePropertiesDrawer:
 *  - showCloseButton={false}, showOverlay={false}
 *  - Rounded, floating, inset from viewport edges
 *  - Button + Tip from our own component library
 *
 * Form fields (shadcn Form + react-hook-form + zod):
 *   • File format  CSV · Excel · PDF  (SelectionTileGrid radio)
 *   • Date range   From / To          (DatePickerField — same as New Placement)
 *   • Columns      All · Visible only (radio)
 *   • Apply active filters            (checkbox)
 *
 * WCAG 2.1 AA:
 *   ✓ All inputs labelled via FormLabel linked to control id (1.3.1)
 *   ✓ Error messages linked via aria-describedby (3.3.1)
 *   ✓ Focus returns to trigger on close (2.4.3)
 */

import * as React from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { devLog } from "@/lib/dev-log"
import { Button }   from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label }    from "@/components/ui/label"
import { Tip }      from "@/components/ui/tip"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Shortcut } from "@/components/ui/dropdown-menu"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { DatePickerField } from "@/components/ui/date-picker-field"
import { SelectionTileGrid } from "@/components/ui/selection-tile-grid"
import type { SelectionTileOption } from "@/components/ui/selection-tile-grid"
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

// ── Validation schema ─────────────────────────────────────────────────────────

const EXPORT_FORMAT_OPTIONS: SelectionTileOption<"csv" | "excel" | "pdf">[] = [
  { value: "csv",   label: "CSV",   icon: "fa-file-csv" },
  { value: "excel", label: "Excel", icon: "fa-file-excel" },
  { value: "pdf",   label: "PDF",   icon: "fa-file-pdf" },
]

const exportSchema = z
  .object({
    format:         z.enum(["csv", "excel", "pdf"]),
    columns:        z.enum(["all", "visible"]),
    dateFrom:       z.date().optional(),
    dateTo:         z.date().optional(),
    includeFilters: z.boolean(),
  })
  .refine(
    d => {
      if (!d.dateFrom || !d.dateTo) return true
      return d.dateTo >= d.dateFrom
    },
    { message: "End date must be after start date", path: ["dateTo"] },
  )

type ExportForm = z.infer<typeof exportSchema>

// ── Component ─────────────────────────────────────────────────────────────────

export interface ExportDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  totalRows?: number
  visibleColumns?: number
}

export function ExportDrawer({
  open,
  onOpenChange,
  totalRows = 0,
  visibleColumns,
}: ExportDrawerProps) {
  const form = useForm<ExportForm>({
    resolver: zodResolver(exportSchema),
    defaultValues: {
      format:         "csv",
      columns:        "visible",
      dateFrom:       undefined,
      dateTo:         undefined,
      includeFilters: true,
    },
  })

  const [isExporting, setIsExporting] = React.useState(false)

  async function onSubmit(values: ExportForm) {
    setIsExporting(true)
    await new Promise(r => setTimeout(r, 1200))
    devLog("Export:", {
      ...values,
      dateFrom: values.dateFrom?.toISOString(),
      dateTo:   values.dateTo?.toISOString(),
    })
    setIsExporting(false)
    onOpenChange(false)
    form.reset()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        showOverlay={false}
        className="w-80 sm:max-w-80 p-0 gap-0 flex flex-col border border-border shadow-xl rounded-xl overflow-hidden"
        style={{ top: "0.5rem", bottom: "0.5rem", right: "0.5rem", height: "calc(100vh - 1rem)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 pt-5 pb-3">
          <SheetTitle className="text-base font-semibold leading-tight">Export data</SheetTitle>
          <Tip label="Close" side="bottom">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Close"
              onClick={() => onOpenChange(false)}
            >
              <i className="fa-light fa-xmark text-[13px]" aria-hidden="true" />
            </Button>
          </Tip>
        </div>

        {/* Record count */}
        <p className="px-4 pb-3 text-sm text-muted-foreground -mt-1">
          {totalRows} record{totalRows !== 1 ? "s" : ""} available for export.
        </p>

        {/* Form body */}
        <Form {...form}>
          <form
            id="export-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1 overflow-y-auto"
          >
            <div className="px-4 pb-4 space-y-5">

              {/* File format */}
              <FormField
                control={form.control}
                name="format"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <SelectionTileGrid
                        sectionLabel="File format"
                        options={EXPORT_FORMAT_OPTIONS}
                        columns={3}
                        value={field.value}
                        onValueChange={field.onChange}
                        interaction="radio"
                        idPrefix="export-fmt"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date range */}
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium leading-none mb-2">
                  Date range{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </legend>
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="dateFrom"
                    render={({ field }) => (
                      <FormItem className="gap-1">
                        <FormLabel className="text-xs text-muted-foreground">From</FormLabel>
                        <FormControl>
                          <DatePickerField
                            value={field.value}
                            onChange={field.onChange}
                            triggerClassName="h-8 text-sm"
                          />
                        </FormControl>
                        <FormDescription className="text-[11px]">MM/DD/YYYY</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dateTo"
                    render={({ field }) => (
                      <FormItem className="gap-1">
                        <FormLabel className="text-xs text-muted-foreground">To</FormLabel>
                        <FormControl>
                          <DatePickerField
                            value={field.value}
                            onChange={field.onChange}
                            triggerClassName="h-8 text-sm"
                          />
                        </FormControl>
                        <FormDescription className="text-[11px]">MM/DD/YYYY</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </fieldset>

              {/* Columns */}
              <FormField
                control={form.control}
                name="columns"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Columns</FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="space-y-1.5 mt-1"
                      >
                        {([
                          { value: "all",     label: "All columns",          sub: null },
                          { value: "visible", label: "Visible columns only", sub: visibleColumns !== undefined ? `${visibleColumns} columns` : null },
                        ] as const).map(opt => (
                          <div
                            key={opt.value}
                            className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-interactive-hover has-[[data-state=checked]]:border-brand has-[[data-state=checked]]:bg-brand/10 cursor-pointer"
                          >
                            <RadioGroupItem value={opt.value} id={`col-${opt.value}`} />
                            <Label htmlFor={`col-${opt.value}`} className="text-sm cursor-pointer flex-1 leading-none">
                              {opt.label}
                              {opt.sub && (
                                <span className="text-muted-foreground ml-1.5 font-normal">({opt.sub})</span>
                              )}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Include filters */}
              <FormField
                control={form.control}
                name="includeFilters"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-start gap-3 rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-interactive-hover has-[[data-state=checked]]:border-primary">
                      <FormControl>
                        <Checkbox
                          id="include-filters"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="mt-0.5 shrink-0"
                        />
                      </FormControl>
                      <div className="min-w-0">
                        <Label htmlFor="include-filters" className="text-sm cursor-pointer font-medium leading-none">
                          Apply active filters
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Export only rows matching current filters
                        </p>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </div>
          </form>
        </Form>

        {/* Global bindings — only active while the drawer is open (Sheet unmounts content on close) */}
        <Shortcut keys="Enter" disabled={isExporting} onInvoke={() => form.handleSubmit(onSubmit)()} />

        {/* Footer */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-border">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Cancel
            <KbdGroup className="ml-1.5"><Kbd variant="bare">Esc</Kbd></KbdGroup>
          </Button>
          <Button
            type="submit"
            form="export-form"
            className="flex-1"
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <i className="fa-light fa-spinner-third fa-spin text-[13px]" aria-hidden="true" />
                Exporting…
              </>
            ) : (
              <>
                <i className="fa-light fa-arrow-down-to-line text-[13px]" aria-hidden="true" />
                Export
                <KbdGroup className="ml-1.5"><Kbd variant="bare">⏎</Kbd></KbdGroup>
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
