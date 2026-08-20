import type * as React from 'react'

export function outlineTreeBranchDepthStyle(depth: number): React.CSSProperties {
  return { paddingLeft: depth * 16 }
}
