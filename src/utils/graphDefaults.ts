export const defaultNodes = [
  {
    id: 'Alice',
    data: {},
    type: 'default',
  },
  {
    id: 'Lily',
    data: {},
    type: 'default',
  },
  {
    id: 'Rose',
    data: {},
    type: 'default',
  },
];

export const defaultEdges = [
  {
    id: 'Alice->Lily',
    source: 'Alice',
    target: 'Lily',
    type: 'smoothstep',
    data: { label: '' },
    directed: true,
  },
  {
    id: 'Lily--Rose',
    source: 'Lily',
    target: 'Rose',
    type: 'smoothstep',
    data: { label: '' },
    directed: false,
  },
]; 