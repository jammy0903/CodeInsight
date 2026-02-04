import type { LanguageProfile } from './types';

export const pythonProfile: LanguageProfile = {
  lang: 'python',
  name: 'Python',
  variableModel: 'binding',

  modules: [
    { id: 'name-binding', position: 'left',   priority: 1 },
    { id: 'object-heap',  position: 'center', priority: 1 },
    { id: 'call-stack',   position: 'right',  priority: 1 },
  ],
};
