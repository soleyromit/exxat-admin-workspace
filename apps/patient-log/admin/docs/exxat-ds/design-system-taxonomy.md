# Design System catalog taxonomy

The catalog uses two axes:

1. **Kind** answers what the artifact is.
2. **Domain** answers where it is used.

Do not use complexity as the test for a pattern. A reusable React implementation remains a component even when it composes many primitives.

## Kinds

| Kind | Definition | Repository signal | Example |
|---|---|---|---|
| Design token | A named design decision consumed by components and surfaces. | CSS custom property or token index | Color, spacing, typography |
| Component, primitive | A reusable implementation with a focused UI responsibility. | Importable TypeScript or TSX module | Button, Input, Badge |
| Component, composition | A reusable implementation assembled from multiple primitives. | Importable TypeScript or TSX module | UtilityBarSlot, DataTable, PageHeader |
| Template | A reusable page or workflow structure with regions or slots. | Importable page shell | ListPageTemplate |
| Pattern | Decision guidance for solving a recurring user or interaction problem. | Markdown guidance, normally no primary import | Sheet panel versus dialog |
| Live example | A working reference implementation showing several artifacts together. | Product or showcase route | Question bank |
| Rule | Machine enforced contributor guidance. | `.cursor/rules/*.mdc` | Token discipline |
| Skill | Agent procedure for a specialized task. | `SKILL.md` | Accessibility checklist |
| Agent guide | Maintainer or agent orientation. | Markdown or YAML guide | Component selection guide |

## Domains

`group` is the domain axis in `DesignSystemRegistryEntry`. Domains describe use, not implementation depth. Examples include Actions, Forms, Navigation, Data views, Page chrome, Overlays, Search, People, Focus, and Leo.

The same domain may contain several kinds. Page chrome can contain the `UtilityBarSlot` component, the shell utility bar pattern, and a shell reference example without conflating them.

## Classification test

Use the first matching rule:

1. Is it a named visual value? Design token.
2. Can product code import and render it? Component.
3. Does the component primarily coordinate several reusable parts? Component with `componentType: "composition"`.
4. Does it define page regions or workflow slots for consumers to fill? Template.
5. Does it explain when and why to combine artifacts for a recurring task? Pattern.
6. Is it a working route intended to demonstrate the system? Live example.
7. Is it contributor or agent guidance? Rule, skill, or agent guide.

`UtilityBarSlot` passes rule 2 and rule 3. It is therefore a Component, subtype Composition, in the Page chrome domain. `shell-utility-bar-pattern.md` is the related Pattern because it defines placement, variants, and usage decisions.

## Registry authoring

Use the helper that matches the classification:

| Helper | Catalog kind |
|---|---|
| `tok()` | Design token |
| `c()` or `cell()` | Component, primitive |
| `comp()` | Component, composition |
| `tpl()` | Template |
| `p()` | Pattern |
| `ex()` | Live example |
| `rule()` | Cursor rule |
| `skill()` | Agent skill |
| `agent()` | Agent guide |

The registry gate rejects a `p()` row whose source is TypeScript or TSX. This prevents importable components from drifting back into Patterns.

## Enterprise design system alignment

The model follows the shared boundary across major enterprise systems:

- [Atlassian Design System components](https://atlassian.design/components/) catalogs reusable implementations such as navigation and page chrome as components.
- [Carbon Design System patterns](https://carbondesignsystem.com/patterns/overview/) separates recurring experience guidance from its component library.
- [Adobe Spectrum components](https://spectrum.adobe.com/page/components/) treats complex reusable UI as components while foundations hold visual decisions.
- [Shopify Polaris patterns](https://polaris.shopify.com/patterns) documents task solutions separately from components and tokens.
- [Microsoft Fluent 2 components](https://fluent2.microsoft.design/components/web/react/core-concepts) groups reusable controls and composed UI under components.
- [SAP Fiori design guidelines](https://experience.sap.com/fiori-design-web/) distinguishes controls, floorplans, and interaction patterns.
- [Salesforce Lightning Design System](https://www.lightningdesignsystem.com/) separates components, design tokens, and implementation guidance.

Names differ across systems, but the stable rule is the same: implementation belongs in the component or template inventory; patterns describe reusable decisions.
