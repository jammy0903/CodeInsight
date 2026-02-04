import type { LanguageProfile } from './types';

export const javascriptProfile: LanguageProfile = {
  lang: 'javascript',
  name: 'JavaScript',
  variableModel: 'reference',

  modules: [
    { id: 'scope-chain',  position: 'left',   priority: 1 },
    { id: 'object-heap',  position: 'center', priority: 1 },
    { id: 'call-stack',   position: 'right',  priority: 1 },
  ],
};
