"use client"

/**
 * "Home layout" block for the profile menu — switches between `/home/<variant>`
 * links (`use-home-variant`).
 *
 * Lives in the profile menu rather than on the page itself for the same reason
 * theme does: it is a standing preference about a surface, not an action on the
 * content in front of you, and putting a layout control in the page's own
 * header would spend the most valuable row on the page on a setting most people
 * set once.
 *
 * Choosing a layout navigates to that layout's URL and remembers it so bare
 * `/home` (post-login, All products) still lands on the last one you used.
 *
 * Rendered in both profile menus — the utility bar's avatar (the one that is
 * actually visible on `/home`, since the shell strips the sidebar there) and
 * the sidebar's `NavUser`, so someone who changes their mind from inside a
 * product does not have to go back to home to find the control.
 */

import { useLocation, useNavigate } from "react-router"

import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import {
  HOME_VARIANTS,
  homeVariantFromPathname,
  homeVariantPath,
  setHomeVariant,
  useHomeVariant,
  type HomeVariant,
} from "@/hooks/use-home-variant"

export function HomeLayoutMenu() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const preferred = useHomeVariant()
  const variant = homeVariantFromPathname(pathname) ?? preferred
  const active = HOME_VARIANTS.find(option => option.id === variant)

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <i className="fa-light fa-house" aria-hidden="true" />
        Home layout
        {/* Same trailing-value pattern the theme row uses, so the current
            setting is readable without opening the submenu. */}
        <span className="ms-auto pe-1 text-xs text-muted-foreground">{active?.label}</span>
      </DropdownMenuSubTrigger>
      {/* No `DropdownMenuPortal` around this. Radix supports it, but portalling
          the sub-content out of the parent menu's layer left it under the
          dismissable layer's `pointer-events: none`, so the options rendered
          and could not be clicked. The rest of the app's submenus don't portal
          either. */}
      <DropdownMenuSubContent className="w-64">
        <DropdownMenuRadioGroup
          value={variant}
          onValueChange={value => {
            const next = value as HomeVariant
            setHomeVariant(next)
            navigate(homeVariantPath(next))
          }}
        >
          {HOME_VARIANTS.map(option => (
            <DropdownMenuRadioItem
              key={option.id}
              value={option.id}
              className="items-start gap-2 py-2"
            >
              <span className="flex flex-col gap-0.5">
                <span className="font-medium">{option.label}</span>
                <span className="text-xs leading-snug text-muted-foreground">
                  {option.description}
                </span>
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
