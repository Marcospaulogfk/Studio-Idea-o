'use client'

import Image from 'next/image'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const BLACK_LOGO = '/img/logo-studio.svg'        // logo preta — para fundo claro
const WHITE_LOGO = '/img/logo-studio-white.svg'  // logo branca — para fundo escuro
const ASPECT = 866 / 173                          // proporção do wordmark

interface LogoProps {
  /**
   * Contexto do fundo onde a logo será exibida.
   * - `auto`  → detecta do tema (light → preta, dark → branca)
   * - `light` → fundo claro, usa a versão preta
   * - `dark`  → fundo escuro, usa a versão branca
   */
  bg?: 'auto' | 'light' | 'dark'
  /** Altura em px (largura é calculada pela proporção 5:1). Default: 36 */
  height?: number
  className?: string
  priority?: boolean
}

export function Logo({
  bg = 'auto',
  height = 36,
  className,
  priority,
}: LogoProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  let src: string
  if (bg === 'light') {
    src = BLACK_LOGO
  } else if (bg === 'dark') {
    src = WHITE_LOGO
  } else {
    // auto: até hidratar, default light (logo preta)
    src = mounted && resolvedTheme === 'dark' ? WHITE_LOGO : BLACK_LOGO
  }

  const width = Math.round(height * ASPECT)

  return (
    <Image
      src={src}
      alt="Studio Ideação"
      width={width}
      height={height}
      priority={priority}
      className={cn('w-auto', className)}
      style={{ height }}
    />
  )
}
