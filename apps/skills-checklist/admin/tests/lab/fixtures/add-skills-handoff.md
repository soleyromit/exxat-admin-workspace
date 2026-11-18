# Handoff Spec: Add skills to a skills list (Variant A, side panel)

Design canvas: https://claude.ai/artifact/8SAYuq4hV75ePNGCu1dR6K (board "Variant A (chosen)")

Source tags used below:
- **[Prototype]** confirmed in `prism-skills-prototype.html` (the clickable Prism Skills prototype)
- **[Live]** seen in the current Exxat "Clinical skills checklist" screen (screenshot)
- **[New]** introduced by this design, not in the prototype or Live yet

Instructions for Claude Code:
1. Build with `exxat-ds` components and tokens. Colors and sizes here are placeholders.
2. Reuse the prototype's logic where tagged [Prototype]; treat [New] items as new work.
3. Before writing code, list the open decisions in section 11 and ask the user about them.

---

## 1. Overview

Admins add skills to an existing skills list (e.g. "Clinical skills checklist"). Today [Live] this is a split button "Add a skill" with 4 menu items: Choose from library, Add several, Bulk upload, Starting points. This design replaces all of them with **one "Add skills" button** that opens **one side panel**.

What the panel covers:

| Old entry point [Live] | Where it goes now |
|---|---|
| Choose from library | Library tab (default) |
| Add several | Multi-select in the Library tab, plus "Select all" |
| Bulk upload | Import tab |
| Starting points | **Removed.** Not in the prototype; copying a list is covered by "A new list" (step 7) and the "from another list" source |
| (new) Add from another list | Source picker inside the search field [New] |
| (new) Create a skill while adding | One-click "Add as a new skill" from search [New] |

---

## 2. Flow

Main flow:

1. Skills list page: click **Add skills**
2. Side panel, Library tab: search, pick source, tick skills, a category, or select all
3. Search with no exact match: close matches first, then **Add "[typed text]" as a new skill**
4. New skill joins the selection with defaults (no form)
5. Review: set times needed and required/optional per skill; new skill's name, category and method are editable on its row; click **Add N skills**
6. Back on the list: added rows marked **Unsaved**; header shows "N unsaved changes", Discard, **Save changes** [Prototype]
7. If students already use the list: dialog **"Who gets these changes?"**, admin picks **A new list** [Prototype logic, New copy]
8. Dialog **"A new list"**: name, who gets it, **Create list** [Prototype logic, New layout]
9. The new list opens with the added skills; the original list is reset to its last saved version [Prototype]

Other ways in (both end at step 5):
- **From another list:** source picker set to another list; "Select all 7 not in this list"
- **Import:** upload a file or paste a list; review what was read; **Review N skills**

---

## 3. Screens

### 3.1 Skills list page (entry)

| Element | Spec |
|---|---|
| Header | Back arrow, list name (display serif), actions on the right |
| Actions | **Add skills** (primary, no dropdown), Export (secondary) [Live has Export] |
| Tabs | All / Active / Inactive with counts [Live] |
| Table | Grouped by category with count; columns Skill, Times needed, Evaluation method [Live] |
| Unsaved state | Header right becomes "N unsaved changes" + Discard (ghost) + Save changes (primary) [Prototype] |
| Unsaved rows | Light amber background + "Unsaved" tag; tab counts include them |

### 3.2 Side panel: shell

- Right-anchored, 440px desktop, full width under 640px; list behind a 35% scrim.
- Header: title "Add skills", subtitle "to [list name]", close (icon button, `aria-label="Close"`).
- Tabs: **Library** (default), **Import**.
- Footer: left "N selected", right primary **Review and add** (disabled at 0).
- Closing with a selection asks "Discard your selection?" [New].

### 3.3 Library tab

**Search field with source picker** (one control) [New]:
- Left segment: select "Show skills from": `Whole library` (default) or any other skills list in the program.
- Right segment: search input, placeholder "Search or type a new skill name".
- Picker max width 150px; long list names truncate with ellipsis, full name in the menu.

**Results**
- Grouped by category [Prototype: categories, then "No category"/"Uncategorised"].
- Top row: checkbox **"Select all N not in this list"** + muted "M already in list" [New]. Selects only what the current search and source show. Indeterminate when some are ticked.
- Category heading: name + **"Select all N"** link [Prototype has "Add all N"].
- Skill row: checkbox, name, right side muted text showing which list(s) it's in or "Not in a list" [Prototype shows this].
- Skills already in this list: checked + disabled, "In list" tag. Never re-added.
- Only active skills with an evaluation method are listed [Prototype rule `Fe()`]. If any are hidden, show at the bottom: "N skills are not listed because they have no evaluation method yet" [Prototype copy, shortened].

**Search behavior**
- Case-insensitive substring match on name [Prototype]. Recommended: also fuzzy/token match so "wound vac" surfaces "Wound Irrigation" under "Close matches in the library" [New].
- When the typed text is not an exact (case-insensitive) match of an existing skill, show at the bottom, under a divider: dashed button **Add "[typed text]" as a new skill** [New].
- When it is an exact match, do not offer Create; show the existing skill [Prototype duplicate rule: 'A skill called "X" already exists.'].

### 3.4 New skill (one click) [New]

- Clicking the Create button adds a selected row at the top under "Selected", with a green **New skill** tag.
- Defaults: name = typed text; category = the category being browsed, else none; evaluation method = program default.
- No form here. Name, category and method are edited in the review (3.5).
- **Replaces** the prototype's separate "Add a skill" dialog (name, category, method, times needed). Reason: times needed belongs to the list, not the skill, and a separate dialog loses the browsing context.

### 3.5 Review step (inside the panel)

- Header: back arrow (returns to Library with selection kept), title "N skills to add", close.
- Column labels: Skill, Times needed, Required.
- Each row: name + meta ("Category · Method"), stepper for times needed (default = skill's method default [Prototype `_y()`]), Required checkbox (default on).
- New skill row: name is an input; second line shows "New skill" tag, Category select, Evaluation method select ("[default] (default)").
- Footer: left link "Keep browsing", right primary **Add N skills**.
- Add closes the panel and applies the selection to the list **as a draft** (3.1 unsaved state).

### 3.6 Save: "Who gets these changes?" dialog

Shown on **Save changes** only when all are true [Prototype `qe` + `r2`]:
- the list has students on it, and
- the list already had skills, and
- its skills or settings changed.

Otherwise save directly and show "Saved." [Prototype].

| Element | Copy |
|---|---|
| Title | Who gets these changes? |
| Subtitle | [N] students already use this list. |
| Option 1 | **Everyone on this list**: All [N] students get the changes. Their past evaluations still count. |
| Option 2 | **A new list**: Current students keep this list as it is. Next, you choose who gets the new one. |
| Close | Icon button; returns to the list with changes still unsaved |

Copy is simplified from the prototype ("[N] students are on [list]" / "Update it for everyone on it" / "Save as a new skills list"). Behavior is the same.

### 3.7 "A new list" dialog

Single column, ~500px.

| Element | Spec |
|---|---|
| Title | A new list |
| Subtitle | Current students keep [list name] as it is. |
| Name | Required. Prefilled "[list name], new intake" [Prototype prefills "[name] — new intake"] |
| Who gets it | One field with chips for chosen cohorts/groups, input "Add a cohort or group" (multi-select) [Prototype `a2` multi-select over cohorts and groups] |
| Summary line | "[N] students · each needs [M] skills" [Prototype shows a "Students on this list" count] |
| Overlap warning | Under the field, only when it applies: "[N] of these students use [other list] today. Saving moves them to this list." [Prototype copy] |
| All students | Hidden here when another list already covers all students; shown as an option otherwise [Prototype disables it with "[list] already covers all students. Edit that one, or pick a group."] |
| More | Collapsed link "Description, due date and status": Description (prefilled "Changes to [list], for students from here on." [Prototype]), Complete by (date, optional), Status (In use / Archived) [Prototype] |
| Footer | Back (to 3.6), primary **Create list**, disabled until name + at least one cohort/group |

On Create [Prototype `be`]:
1. Save the new list with the draft's skills and settings.
2. Reset the original list's draft to its saved version.
3. Navigate to the new list.

The prototype shows no confirmation after this. Recommended [New]: a toast "New list created. [Original] is unchanged."

### 3.8 Import tab

Reuse the prototype importer (`B1` + parser `E1`):
- Source: upload (csv, tsv, txt, md, xlsx, xls, doc, docx, pdf) or paste. "No particular template or column order is needed." [Prototype]
- Parsing [Prototype]: detects comma/tab delimiters and a header row (skill/name/title, desc/detail/notes, categ/group/domain/section); strips bullets and numbering; skips lines with no name, names under 3 characters, and single-column lines that look like section headings.
- Review inside the panel: file name + "N lines read" + Replace; summary chips "N to add", "N already in this list", "N skipped" (amber).
- Each row: checkbox, name, category or status. Rows already in this list: disabled, "In list".
- Skipped lines listed, e.g. 'Line 9 skipped: "SECTION 2, ADVANCED PROCEDURES" looks like a heading' [Prototype: "Shown so nothing is lost silently"].
- New categories from the file: checkbox "Create categories D, E, F from the file" (default on) [Prototype].
- Footer primary: **Review N skills**, which goes to 3.5.

### 3.9 From another list

- Source picker set to another list; results show that list's skills grouped by category.
- Top row "Select all N not in this list" (checked by default when arriving this way) + "M already in list".
- Footer primary: **Review N skills**, which goes to 3.5.
- The prototype's empty list state already says "Add skills from other lists or create new ones", but has no picker for it.

---

## 4. Rules and data

```js
// Skills list (prototype "requirementSet")
{
  id, name, description, dueBy, status: "active" | "archived",
  assignments: [{ type: "programme" | "cohort" | "group", targetId }],
  skills: { [skillId]: "mandatory" | "optional" },   // required / optional per list
  settings: { /* per-list numbers: times needed, patient minimum, per skill */ }
}
// Skill (library)
{ id, name, description, categoryId, tagIds, methodId, status, ... }
```

- Evaluation method belongs to the **skill**, the same in every list [Prototype]. Times needed and required/optional belong to the **list** [Prototype].
- Only `status === "active"` skills with an evaluation method can be added [Prototype].
- New skills created in this flow: **open decision** on when they are written to the library (section 11).
- Unsaved change count = number of skills/settings that differ from the saved list.

---

## 5. States and interactions

| Element | State | Behavior |
|---|---|---|
| Add skills button | Click | Opens panel, focus to search |
| Search | Typing | Results update after 150ms debounce |
| Select all (top) | Some ticked | Indeterminate; click selects all shown |
| Category "Select all N" | All ticked | Label becomes "Clear" [Prototype] |
| Create row | Exact match exists | Hidden |
| Review and add | 0 selected | Disabled |
| Review rows | Remove | Removes from selection; stays visible in Library unticked |
| Add N skills | Click | Panel closes, rows appear as Unsaved, focus to first added row |
| Save changes | No students on list | Save, toast "Saved." |
| Save changes | Students on list | Open 3.6 |
| Discard | Click | Revert draft to saved version, no prompt if 0 changes |
| Create list | Invalid | Disabled with field-level hints |
| Any save | Server error | Inline banner "Couldn't save. Try again." Keep the draft |

---

## 6. Design tokens

| Role | Canvas value | Usage |
|---|---|---|
| ink / primary | #1A1A1A | Primary buttons, selected chips, focus border |
| text muted | #5F5F5F | Helper text, meta |
| border | #CFCFCB inputs, #E2E2DF cards | |
| surface subtle | #F2F1EC / #F7F6F3 | Chips, category headings, picker segment |
| success | #E7F3EB / #1E6B3E | New skill tag, added rows |
| warning | #FDF0E1 / #8A4B0B | Unsaved tag, skipped lines, hidden-skills note |
| scrim | rgba(26,26,26,.35); dialogs .45 | |
| display font | Source Serif 4, 600 | Page and panel titles |
| body font | Inter / system | Everything else |

---

## 7. Responsive

| Width | Change |
|---|---|
| ≥1024px | Panel 440px over the list |
| 640 to 1023px | Panel 440px; list scrolls behind |
| <640px | Panel full screen; source picker becomes its own row above search; footer sticky |

---

## 8. Edge cases

- **Everything already in the list:** "Every skill is already in this list" + "Create a new skill, or import a file of skills." [Prototype copy]
- **No search results:** "No skills match" + the Create row.
- **Large library (500+ skills):** virtualize the results list; category headings sticky.
- **Long skill names:** wrap to 2 lines in the panel, ellipsis in table with tooltip.
- **Name typed that differs only by case from an existing skill:** treat as existing (no Create).
- **Import with 0 readable lines:** stay on the Import source with "We couldn't find any skills in this file."
- **Another admin saved the list meanwhile:** on Save, show "This list changed since you opened it. Reload to see the latest." [New]

---

## 9. Accessibility

- Panel: `role="dialog"`, `aria-modal="true"`, labelled by its title; focus trap; Esc closes (with discard prompt if a selection exists); focus returns to Add skills.
- Source picker and search are two labelled controls in one visual field: `aria-label="Show skills from"` and `aria-label="Search or type a new skill name"`.
- Results: native checkboxes with labels; category "Select all" buttons name the category ("Select all 2 in Airway & breathing").
- Create row is a `<button>` with full text.
- Live region (`aria-live="polite"`) announces "N selected" and result counts.
- Steppers: buttons labelled "Fewer: [skill]" / "More: [skill]", input labelled "Times needed: [skill]" [Prototype pattern].
- Dialogs 3.6 and 3.7: `role="dialog"`; option cards are buttons/radios with visible focus.

---

## 10. Motion

| Element | Trigger | Animation | Duration | Easing |
|---|---|---|---|---|
| Panel | Open / close | Slide from right + scrim fade | 200ms / 160ms | ease-out / ease-in |
| Library ↔ Review | Navigate | Cross-fade + 8px slide | 160ms | ease-out |
| Added rows | After Add | Amber background stays until saved | none | none |
| Dialogs | Open | Fade + scale 0.98 to 1 | 160ms | ease-out |

Respect `prefers-reduced-motion`: fades only.

---

## 11. Open decisions

1. **When a new skill is written to the library:** prototype creates it immediately; this design recommends creating it only when the list is saved, so discarding leaves nothing behind.
2. **Starting points:** removed. Confirm nobody depends on it in Live.
3. **Confirmation after "Create list":** prototype shows none; recommended toast.
4. **Search matching:** keep prototype substring match, or add fuzzy "close matches".
5. **Dialog copy in 3.6 and 3.7:** simplified from the prototype; confirm with content/UX writing.
