'use client'

import React from 'react'
import ServiceLogo from './ServiceLogos'

type ExternalLinksProps = {
  partNum: string
}

// External link icon
const ExternalLinkIcon = () => (
  <svg className="ml-1 inline size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
    />
  </svg>
)

const externalServices = [
  {
    // Tom Alphin's affiliate link:
    // https://click.linksynergy.com/deeplink?id=fSDxeNci4lA&mid=13923&murl=${encodeURIComponent(`https://www.lego.com/en-us/pick-and-build/pick-a-brick?query=${partNum}`)}
    name: 'LEGO Pick a Brick',
    getUrl: (partNum: string) => `https://www.lego.com/en-us/pick-and-build/pick-a-brick?query=${partNum}`,
  },
  {
    name: 'Rebrickable',
    getUrl: (partNum: string) => `https://rebrickable.com/parts/${partNum}`,
  },
  {
    name: 'Bricklink',
    getUrl: (partNum: string) => `https://www.bricklink.com/v2/catalog/catalogitem.page?P=${partNum}`,
  },
  {
    name: 'Brickset',
    getUrl: (partNum: string) => `https://brickset.com/parts/design-${partNum}`,
  },
  {
    name: 'LDraw',
    getUrl: (partNum: string) => `https://library.ldraw.org/parts/list?tableSearch=${partNum}.dat`,
  },
]

export default function ExternalLinks({ partNum }: ExternalLinksProps) {
  return (
    <div>
      <h4 className="mb-3 text-lg font-semibold text-gray-700 dark:text-gray-300">External Links</h4>
      <div className="flex flex-col space-y-2 text-sm">
        {externalServices.map((service) => (
          <a
            key={service.name}
            href={service.getUrl(partNum)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-blue-600 transition-colors hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <ServiceLogo serviceName={service.name} className="mr-2 h-4 w-4" />
            {service.name}
            <ExternalLinkIcon />
          </a>
        ))}
      </div>
    </div>
  )
}
