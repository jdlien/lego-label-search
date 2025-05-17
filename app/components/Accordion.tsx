'use client'

import React, { useState, ReactNode } from 'react'

export interface AccordionItemDef {
  id: string
  title: ReactNode
  childrenItems?: AccordionItemDef[]
  content?: ReactNode
}

interface AccordionProps {
  items: AccordionItemDef[]
  allowMultiple?: boolean
  defaultOpenIds?: string[]
  className?: string
  itemClassName?: string
  titleClassName?: string
  contentClassName?: string
  icon?: ReactNode
  openIcon?: ReactNode
}

const ChevronDownIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="transition-transform duration-200"
  >
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
)

const AccordionItem: React.FC<{
  item: AccordionItemDef
  isOpen: boolean
  onToggle: () => void
  titleClassName?: string
  contentClassName?: string
  icon?: ReactNode
  openIcon?: ReactNode
}> = ({ item, isOpen, onToggle, titleClassName, contentClassName, icon, openIcon }) => {
  const hasSubItems = item.childrenItems && item.childrenItems.length > 0
  const hasContent = !!item.content

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className={`flex items-center justify-between w-full p-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75 ${
          titleClassName || ''
        }`}
        aria-expanded={isOpen}
      >
        <span className="flex-1">{item.title}</span>
        <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
          {isOpen && openIcon ? openIcon : icon ? icon : <ChevronDownIcon />}
        </span>
      </button>
      {isOpen && (hasSubItems || hasContent) && (
        <div className={`p-3 bg-white dark:bg-gray-800/50 ${contentClassName || ''}`}>
          {item.content}
          {hasSubItems && (
            <Accordion
              items={item.childrenItems!} // Asserting non-null as we checked hasSubItems
              allowMultiple // Inherit from parent or make it configurable
              // Pass down other relevant props if deep customization is needed
              titleClassName={titleClassName}
              contentClassName={contentClassName}
              icon={icon}
              openIcon={openIcon}
            />
          )}
        </div>
      )}
    </div>
  )
}

const Accordion: React.FC<AccordionProps> = ({
  items,
  allowMultiple = true,
  defaultOpenIds = [],
  className,
  itemClassName,
  titleClassName,
  contentClassName,
  icon,
  openIcon,
}) => {
  const [openItemIds, setOpenItemIds] = useState<Set<string>>(new Set(defaultOpenIds))

  const toggleItem = (id: string) => {
    setOpenItemIds((prevOpenIds) => {
      const newOpenIds = new Set(prevOpenIds)
      if (newOpenIds.has(id)) {
        newOpenIds.delete(id)
      } else {
        if (!allowMultiple) {
          newOpenIds.clear()
        }
        newOpenIds.add(id)
      }
      return newOpenIds
    })
  }

  if (!items || items.length === 0) {
    return <div className="p-4 text-center text-gray-500 dark:text-gray-400">No items to display.</div>
  }

  return (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-md ${className || ''}`}>
      {items.map((item) => (
        <AccordionItem
          key={item.id}
          item={item}
          isOpen={openItemIds.has(item.id)}
          onToggle={() => toggleItem(item.id)}
          titleClassName={titleClassName}
          contentClassName={contentClassName}
          icon={icon}
          openIcon={openIcon}
        />
      ))}
    </div>
  )
}

export default Accordion
