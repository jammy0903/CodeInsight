import type { LanguageProfile } from './types';

export const javaProfile: LanguageProfile = {
  lang: 'java',
  name: 'Java',
  variableModel: 'reference',

  modules: [
    { id: 'stack-frame',  position: 'left',   priority: 1 },
    { id: 'object-heap',  position: 'center', priority: 1 },
    { id: 'call-stack',   position: 'right',  priority: 1 },
  ],
};
