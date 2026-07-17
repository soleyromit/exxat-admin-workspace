"use client"

import * as React from "react"

import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"

export function InputDefaultPreview() {
  return (
    <Field orientation="vertical">
      <FieldLabel htmlFor="ds-input">Search</FieldLabel>
      <Input id="ds-input" placeholder="Search patterns…" aria-label="Search" />
    </Field>
  )
}

export function TextareaDefaultPreview() {
  return (
    <Field orientation="vertical">
      <FieldLabel htmlFor="ds-textarea">Question stem</FieldLabel>
      <Textarea
        id="ds-textarea"
        rows={3}
        defaultValue="Which nerve innervates the diaphragm?"
        aria-label="Question stem"
      />
      <FieldDescription>Pair with FieldDescription in product forms.</FieldDescription>
    </Field>
  )
}

export function InputGroupPreview() {
  return (
    <InputGroup>
      <InputGroupAddon>
        <i className="fa-light fa-magnifying-glass" aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupInput placeholder="Search…" aria-label="Search with icon" />
    </InputGroup>
  )
}

export function LabelPreview() {
  return <Label htmlFor="ds-label-demo">Field label</Label>
}

export function SliderPreview() {
  const [slider, setSlider] = React.useState(40)
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Volume</span>
        <span className="tabular-nums">{slider}%</span>
      </div>
      <Slider
        value={[slider]}
        onValueChange={(values) => setSlider(values[0] ?? 0)}
        max={100}
        step={1}
        aria-label="Demo slider"
      />
    </div>
  )
}
