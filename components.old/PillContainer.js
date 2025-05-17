/** @format */

import React from 'react'
import styles from './PillContainer.module.css'

const PillContainer = ({ pills, size = 24, color = 'oklch(60% 0 300)' }) => {
  // Normalize pills input to handle both strings and objects
  const normalizedPills = pills
    .map((pill) => {
      if (typeof pill === 'string') {
        return { text: pill }
      }
      return {
        text: pill.text || '',
        value: pill.value,
        onClick: typeof pill.onClick === 'function' ? pill.onClick : undefined,
      }
    })
    .filter((pill) => pill.text) // Remove any pills with empty text

  if (normalizedPills.length === 0) return null

  const containerStyle = {
    '--pill-height': `${size}px`,
    '--input-color': color,
  }

  return (
    <div className={styles.pillContainer} style={containerStyle}>
      {normalizedPills.map((pill, index) => {
        const isFirst = index === 0
        const isLast = index === normalizedPills.length - 1
        const isMiddle = !isFirst && !isLast

        return (
          <button
            key={index}
            className={`${styles.pill} ${isFirst ? styles.left : ''} ${isMiddle ? styles.middle : ''} ${
              isLast ? styles.right : ''
            }`}
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

export default PillContainer
