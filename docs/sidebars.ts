import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    {
      type: 'category',
      label: 'Introduction',
      collapsible: false,
      items: ['overview', 'getting-started'],
    },
    {
      type: 'category',
      label: 'Product',
      collapsible: false,
      items: ['problem-and-solution', 'moat', 'business-model', 'roadmap'],
    },
    {
      type: 'category',
      label: 'Concepts',
      collapsible: false,
      items: ['agent-roles-and-philosophy', 'debate-flow'],
    },
    {
      type: 'category',
      label: 'System Design',
      collapsible: false,
      items: ['architecture', 'repository-conventions'],
    },
  ],
};

export default sidebars;
