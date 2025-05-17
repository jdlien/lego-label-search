'use client'

import React from 'react'

type Pill = {
  text: string
  value?: string | number
  onClick?: (e: React.MouseEvent, value?: string | number) => void
}

type PillContainerProps = {
  pills: (Pill | string)[]
  size?: number
  color?: string
}

export default function PillContainer({ pills, size = 24, color = 'oklch(60% 0 300)' }: PillContainerProps) {
  // Normalize pills input to handle both strings and objects
  const normalizedPills = pills
    .map((pill): Pill => {
      if (typeof pill === 'string') {
        return { text: pill }
      }
      return {
        text: (pill as Pill).text || '',
        value: (pill as Pill).value,
        onClick: typeof (pill as Pill).onClick === 'function' ? (pill as Pill).onClick : undefined,
      }
    })
    .filter((pill) => pill.text) // Remove any pills with empty text

  if (normalizedPills.length === 0) return null

  // Define the container style with CSS variables
  const containerStyle: React.CSSProperties = {
    '--pill-height': `${size}px`,
    '--input-color': color,
  } as React.CSSProperties

  return (
    <div className="pill-container" style={containerStyle}>
      {normalizedPills.map((pill, index) => {
        const isFirst = index === 0
        const isLast = index === normalizedPills.length - 1
        const isMiddle = !isFirst && !isLast

        // Create class names for positioning
        const pillClassNames = [
          'pill',
          isFirst ? 'pill-left' : '',
          isMiddle ? 'pill-middle' : '',
          isLast ? 'pill-right' : '',
        ]
          .filter(Boolean)
          .join(' ')

        return (
          <button
            key={index}
            className={pillClassNames}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (pill.onClick) {
                pill.onClick(e, pill.value)
              }
            }}
          >
            {pill.text}
          </button>
        )
      })}
    </div>
  )
}
