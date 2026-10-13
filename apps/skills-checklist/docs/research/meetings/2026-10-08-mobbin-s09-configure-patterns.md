# Mobbin pattern research — S-09 Skill configure

Date: 2026-10-08 · Tool: Mobbin MCP (web, deep mode) · Scope: S-09 only (ux/12 queries M-2, M-3 plus four more)
Method: 5 screen searches + 1 flow search. Patterns only, no pixel copying. **None of these products is a skills, rubric or clinical-education tool**; they are analogues for a *structure*, not for the domain. `[INFER]` applies to every "so what".

## 1. Config with dependent sections and a live preview (SC-17, SC-19)
| Reference | What it shows | So what for S-09 |
|---|---|---|
| [Chatbase](https://mobbin.com/screens/40f0d048-7bb2-486c-875c-e0b82dacd5fc) | Settings left, live preview right, sticky bar "You have unsaved changes. Discard / Save changes" | Full-page configure with a side preview; unsaved-changes bar instead of a modal |
| [Featurebase](https://mobbin.com/screens/2d0bfc59-1f36-4c41-ada6-912496f1f1bd) | Accordion sections left (one open), preview right, Save at top | Sections as accordion keep a long config scannable; lineage panel could sit where the preview does |
| [Linktree](https://mobbin.com/screens/96ccc87e-9d08-4b8c-a725-ca9ee77cb7d0) | One long page, "Jump to" selector, preview pinned right | Anchored sections + jump control is the alternative to a stepper |
| [HubSpot form styles](https://mobbin.com/screens/cc107af2-474f-4e8b-bb71-1485a2b51d5b) | Settings panel left, form canvas right | Same split; preview is the real form |
| [Copilot: Preview a form](https://mobbin.com/flows/77e78c20-5671-4355-91fa-45f13a1e3f96) | Header toggle "Preview" opens a preview pane beside the builder | Preview as a toggle keeps narrow screens usable |
| [Fresha: Preview form](https://mobbin.com/flows/b1c12f96-e76f-43cb-ab72-098db2c4d3c1) | Builder / Preview segmented control, preview has Previous/Next | Student and evaluator views could be a two-way toggle inside the preview |
| [Greptile](https://mobbin.com/screens/a677c843-8d23-4cfb-817f-c1f1da00161e) | Top step tabs + preview illustration | Counter-example: a stepper hides downstream consequences, which SC-17 wants visible |

## 2. Model picker (SC-02: explicit, no default)
[User Interviews](https://mobbin.com/screens/a1af67c3-ddd5-4e2e-9155-fe6b3cd08108) (four tiles, icon + title + description), [Zendesk](https://mobbin.com/screens/5c348225-b549-4606-8a17-b5f890b04051) (selected = check + underline), [HubSpot](https://mobbin.com/screens/c4f3dd08-ca1e-4c94-8bb4-ca4f7b4373ae) (radio dot in card), [Airbnb](https://mobbin.com/screens/f99f5466-e3f5-4ade-a5d6-8d1f840f6e23) (stacked cards).
So what: four described tiles with a non-colour selected state (check or radio dot). Nothing preselected. Matches `SelectionTileGrid interaction="radio"` `[docs/ux/10]`.

## 3. Rule / qualification builder (SC-05, SC-07)
- [Vercel firewall rule](https://mobbin.com/screens/0aeb1fb3-c1ee-4d61-a64b-e407ff3bb634): multi-select checklist popover with search, plus a footer sentence that states how the selection is combined. Good for the "named subset": say in words what the rule will mean.
- [Typeform logic](https://mobbin.com/screens/fdf84866-8ef3-466a-b72d-3d5c1618bd28): operator dropdown ("is equal to", "greater than or equal") then a value. Fits "average at or above N".
- [Calendly](https://mobbin.com/screens/f27f91d5-32e8-4771-81de-cb8b8a2d7461) and [Zoom](https://mobbin.com/screens/94c70e95-8fcb-45a0-9009-7c7e5866c868): IF / THEN blocks with and/or. Heavier than needed here; our rule has three fixed shapes, not free logic.
- [ClickUp](https://mobbin.com/screens/a46d689b-a3fc-46fc-bba6-652fde9bdbe6): "10 sources selected" trigger, Select all / Deselect all. Fits a large question set (SC-06).
- [Melio](https://mobbin.com/screens/979651dd-a57e-47aa-b28c-b375c9d59e67): "When this happens / Then do this" sentence layout.
So what: render the rule as a sentence with variables, three fixed shapes, with a plain-language restatement underneath. Do not build a free-form logic editor.

## 4. Ordered levels / scale (SC-08, AE-07)
[Juicebox "Edit Status List"](https://mobbin.com/screens/01028d24-0e2e-4ae8-81b3-c5f8c09117a0) is the closest analogue: drag handle, label, remove, "Add new". Also [Circle](https://mobbin.com/screens/a0684ada-0fe1-410b-a8e6-f4109d3c33a7) and [Behance](https://mobbin.com/screens/9a1794fa-e921-4dca-beab-137ff95a49c6) reorder lists, [Workable](https://mobbin.com/screens/b5314bf9-1ffc-4465-8125-288efd3a2cee) item blocks.
So what: inline list, drag handle, remove with a consequence note (AE-07 says rules referencing it are updated). Reordering must also have a non-drag path `[a11y]`.

## 5. Save-blocking validation (SC-18, SC-06)
- [Deel](https://mobbin.com/screens/14397653-8147-46e8-ac32-39a1f18a92a4): summary banner "8 required fields are not filled", grouped by section, with a way to leave and return. Best match: group errors by configure section.
- [Felt](https://mobbin.com/screens/67df3510-506f-4084-a147-7501b8135bc7), [Copy.ai](https://mobbin.com/screens/4ab58eec-6cef-4abc-b172-e8943044e1ae): inline field errors with red outline.
- [Square](https://mobbin.com/screens/2d04b11c-f3d4-4937-a056-1e1898bec97d): inline error plus a floating toast. **Do not copy the toast** (workspace rule: LocalBanner).
So what: a LocalBanner summary at the top grouped by section, each item jumps to its field, plus inline errors. Colour alone must not carry severity.

## Not found
No reference for a *lineage* panel (model to evidence to rule to criteria) or for per-level and per-setting minimum editors. These stay hand-rolled with no external precedent `[docs/ux/10 C-1, C-5, C-6]`.

## Flow reference
[beehiiv: Creating a survey](https://mobbin.com/flows/7f227beb-90bd-43de-b543-6f9323c333ab): Draft badge, Builder / Responses / Settings tabs, Preview and Publish in the header. Sections as tabs is the third option beside accordion and anchored scroll.
