import type { LanguageProfile } from './types';

export const cProfile: LanguageProfile = {
  lang: 'c',
  name: 'C',
  variableModel: 'allocation',

  modules: [
    { id: 'stack-frame',   position: 'left',   priority: 1 },
    { id: 'heap-memory',   position: 'center', priority: 2 },
    { id: 'call-stack',    position: 'right',  priority: 1 },
    { id: 'pointer-graph', position: 'center', priority: 3 },
  ],
};
