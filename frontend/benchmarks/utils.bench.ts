import { describe, bench } from 'vitest'
import { cn, cva, nanoId } from '../src/lib/utils'

describe('cn() performance', () => {
  bench('single class', () => {
    cn('text-red-500')
  })

  bench('5 classes', () => {
    cn('text-red-500', 'bg-blue-100', 'p-4', 'rounded-lg', 'shadow-md')
  })

  bench('10 classes with falsy', () => {
    cn('a', false, undefined, null, 'b', 'c', false, 'd', null, 'e', undefined, 'f')
  })

  bench('20 classes (worst case)', () => {
    cn(...Array.from({ length: 20 }, (_, i) => `class-${i}`))
  })
})

describe('cva() performance', () => {
  const instance = cva('base-class', {
    variants: {
      color: {
        red: 'text-red',
        blue: 'text-blue',
        green: 'text-green',
      },
      size: {
        sm: 'text-sm',
        md: 'text-md',
        lg: 'text-lg',
      },
    },
    defaultVariants: { color: 'red', size: 'md' },
  })

  bench('resolve default variants', () => {
    instance()
  })

  bench('resolve with overrides', () => {
    instance({ color: 'blue', size: 'lg' })
  })

  bench('resolve with one override', () => {
    instance({ color: 'green' })
  })
})

describe('nanoId() performance', () => {
  bench('UUID generation (no args)', () => {
    nanoId()
  })

  bench('hex string (length 16)', () => {
    nanoId(16)
  })

  bench('hex string (length 32)', () => {
    nanoId(32)
  })

  bench('hex string (length 8)', () => {
    nanoId(8)
  })
})
