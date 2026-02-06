import { describe, expect, it } from 'vitest'

import { defaultEdges, defaultNodes } from '../utils/graphDefaults'

describe('smoke', () => {
  it('has default nodes and edges', () => {
    expect(defaultNodes.length).toBeGreaterThan(0)
    expect(defaultEdges.length).toBeGreaterThan(0)
  })
})
