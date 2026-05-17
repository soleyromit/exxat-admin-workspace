# scripts/build-ds-snapshot.test.py
import pytest
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from scripts.build_ds_snapshot import (
    extract_exports_from_index,
    extract_variants_from_component,
    extract_sizes_from_component,
    build_snapshot,
)

BUTTON_SOURCE = '''
const buttonVariants = cva("...", {
  variants: {
    variant: {
      default: "...", secondary: "...", outline: "...",
      ghost: "...", destructive: "...", link: "..."
    },
    size: {
      xs: "...", sm: "...", default: "...", lg: "...",
      "icon-xs": "...", "icon-sm": "...", icon: "...", "icon-lg": "..."
    },
  }
})
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive" | "link"
  size?: "xs" | "sm" | "default" | "lg"
  asChild?: boolean
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(...)
'''

INDEX_SOURCE = '''
export * from "./components/ui/button"
export * from "./components/ui/badge"
export * from "./components/ui/card"
'''

def test_extract_exports_from_index():
    exports = extract_exports_from_index(INDEX_SOURCE)
    assert 'button' in exports
    assert 'badge' in exports
    assert 'card' in exports

def test_extract_variants():
    variants = extract_variants_from_component(BUTTON_SOURCE, 'variant')
    assert 'default' in variants
    assert 'secondary' in variants
    assert 'destructive' in variants

def test_extract_sizes():
    sizes = extract_sizes_from_component(BUTTON_SOURCE)
    assert 'sm' in sizes
    assert 'icon-sm' in sizes
    assert 'lg' in sizes

def test_build_snapshot_structure():
    snapshot = build_snapshot('/fake/path', INDEX_SOURCE, {'button': BUTTON_SOURCE})
    assert 'generated' in snapshot
    assert 'components' in snapshot
    assert 'Button' in snapshot['components']
    btn = snapshot['components']['Button']
    assert 'importPath' in btn
    assert 'variants' in btn
    assert 'sizes' in btn
