"use client"

import type { ComponentDocSpec } from "@/lib/design-system/component-doc-types"
import {
  ModeSwitchSearchBarPreview,
  ModeSwitchSearchBarSearchingPreview,
} from "@/components/design-system/mode-switch-search-previews"

function ex(
  section: Omit<ComponentDocSpec["sections"][number], "children" | "description">,
  children: React.ReactNode,
  description?: string,
) {
  return { ...section, children, description }
}

export const modeSwitchSearchComponentDoc: ComponentDocSpec = {
  slug: "mode-switch-search",
  summary:
    "Airbnb-style search pill that switches between Basic filters and Leo AI search. Mode changes via the under-bar exit link; product hubs also persist the preference in the profile menu.",
  sections: [
    ex(
      { id: "interactive", title: "Basic and Leo" },
      <ModeSwitchSearchBarPreview />,
      "Try the under-bar link to flip modes. Submit briefly shows the Searching state.",
    ),
    ex(
      { id: "searching", title: "Searching" },
      <ModeSwitchSearchBarSearchingPreview />,
      "The question is already typed. Send it to watch the state run: in-bar Leo blobs and dots clipped to the pill, locked controls, working star, and Searching submit, then the bar back at rest. The question stays in the pill the whole time, because it is what the search is running on.",
    ),
  ],
  anatomy: [
    {
      part: "ModeSwitchSearchBar",
      description: "Orchestrator that renders Basic or Leo and owns the under-bar exit link.",
    },
    {
      part: "LibraryBasicSearchBar",
      description:
        "Facet pill: Keyword, Type, Difficulty, Search. Accepts searching for the in-flight state.",
    },
    {
      part: "LibraryAskSearchBar",
      description:
        "AskLeoComposer wrapped in searchBarShellClassName. Passes isSearching through to the composer.",
    },
    {
      part: "LibrarySearchModeMenu",
      description: "Profile preference that persists basic vs leo via useLibrarySearchMode.",
    },
  ],
  api: [
    {
      prop: "mode",
      type: `"basic" | "leo"`,
      description: "Active search mode.",
    },
    {
      prop: "onModeChange",
      type: "(next: LibrarySearchMode) => void",
      description: "Called from the under-bar exit link.",
    },
    {
      prop: "basic",
      type: "(footer: ReactNode) => ReactNode",
      description: "Render prop for the Basic bar; pass footer into LibraryBasicSearchBar.",
    },
    {
      prop: "leo",
      type: "(footer: ReactNode) => ReactNode",
      description: "Render prop for the Leo bar; pass footer into LibraryAskSearchBar.",
    },
    {
      prop: "searching",
      type: "boolean",
      defaultValue: "false",
      description:
        "On LibraryBasicSearchBar / LibraryAskSearchBar. Locks fields and shows Searching on the submit control.",
    },
    {
      prop: "clearOnSubmit",
      type: "boolean",
      defaultValue: "false on the search bars",
      description:
        "AskLeoComposer prop. A conversation empties on send; a search bar keeps its query, because the query names the results below it. Search surfaces pass false.",
    },
  ],
  ux: {
    job: "Let coordinators choose filter search or plain-language Leo search without leaving the discovery hero.",
    principles: ["P3", "P5", "P8"],
    modernReferences: ["Airbnb search pill (M1, M4)", "Notion AI search (M4, M7)"],
    whenToUse: [
      "Discovery hubs that offer both structured filters and AI search.",
      "When mode should stay out of the pill and use an under-bar exit plus profile preference.",
    ],
    whenNotToUse: [
      "URL-only dedicated search landing without a Basic facet half. Use DedicatedSearchUrlComposer.",
      "In-pill segmented controls for Basic vs Leo. Prefer the under-bar exit pattern.",
    ],
  },
  guidelines: {
    do: [
      "Compose ModeSwitchSearchBar with LibraryBasicSearchBar and LibraryAskSearchBar.",
      "Share searchBarShellClassName so both modes match one pill geometry.",
      "Persist product preference with useLibrarySearchMode and LibrarySearchModeMenu.",
      "Pass searching while navigation or fetch is in flight (for example useTransition).",
    ],
    dont: [
      "Do not put a segmented control inside the pill for mode.",
      "Do not invent a second Leo entry that opens the Ask Leo sidebar from this bar.",
      "Do not leave the bar editable while searching is true.",
    ],
  },
  extraImports: [
    { label: "LibraryBasicSearchBar", path: "@/components/library-basic-search-bar" },
    { label: "LibraryAskSearchBar", path: "@/components/library-ask-search-bar" },
    { label: "useLibrarySearchMode", path: "@/hooks/use-library-search-mode" },
    { label: "LibrarySearchModeMenu", path: "@/components/library-search-mode-menu" },
  ],
  relatedSlugs: ["dedicated-search", "ask-leo-composer", "discovery-hub-template"],
}
