/** @format */

import React from 'react'
import styles from './PillContainer.module.css'

const PillContainer = ({ pills, size = 24 }) => {
  // Filter out any undefined or null values
  const validPills = pills.filter((pill) => pill != null)

  return (
    <div className={styles.pillContainer} style={{ '--pill-height': `${size}px` }}>
      {validPills.map((pill, index) => {
        const isLeft = index === 0
        const isRight = index === validPills.length - 1
        const pillClass = isLeft ? styles.left : isRight ? styles.right : styles.middle

        return (
          <div key={index} className={`${styles.pill} ${pillClass}`}>
            {pill}
          </div>
        )
      })}
    </div>
  )
}

export default PillContainer
