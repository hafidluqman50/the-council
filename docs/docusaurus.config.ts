import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import {themes} from 'prism-react-renderer';

const repositoryUrl = 'https://github.com/hafidluqman50/the-council';
const registryAddress = '0x92a06ba0D228dDf790578DD8A27C101dD640B84E';

const config: Config = {
  title: 'The Council Docs',
  tagline: 'Your idea, cross-examined by AI, verified on-chain.',
  favicon: 'img/logo-mark.svg',

  url: 'https://the-council-dapp-docs.vercel.app',
  baseUrl: '/',
  organizationName: 'hafidluqman50',
  projectName: 'the-council',

  onBrokenLinks: 'throw',
  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },
  themes: ['@docusaurus/theme-mermaid'],

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  headTags: [
    {tagName: 'link', attributes: {rel: 'preconnect', href: 'https://fonts.googleapis.com'}},
    {
      tagName: 'link',
      attributes: {rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous'},
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Outfit:wght@500;600&display=swap',
      },
    },
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          path: 'content',
          routeBasePath: 'docs',
          sidebarPath: './sidebars.ts',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'The Council',
      logo: {
        alt: 'The Council',
        src: 'img/logo-mark.svg',
        srcDark: 'img/logo-mark-light.svg',
        width: 28,
        height: 28,
      },
      items: [
        {to: '/docs/overview', label: 'Docs', position: 'left'},
        {to: '/docs/problem-and-solution', label: 'Product', position: 'left'},
        {to: '/docs/architecture', label: 'Architecture', position: 'left'},
        {href: repositoryUrl, label: 'GitHub', position: 'right'},
        {
          href: `https://testnet.bscscan.com/address/${registryAddress}`,
          label: 'Contract',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'light',
      links: [
        {
          title: 'Docs',
          items: [
            {label: 'Overview', to: '/docs/overview'},
            {label: 'Getting Started', to: '/docs/getting-started'},
            {label: 'Architecture', to: '/docs/architecture'},
          ],
        },
        {
          title: 'Product',
          items: [
            {label: 'Problem & Solution', to: '/docs/problem-and-solution'},
            {label: 'Business Model', to: '/docs/business-model'},
            {label: 'Roadmap', to: '/docs/roadmap'},
          ],
        },
        {
          title: 'Live',
          items: [
            {label: 'App', href: 'https://the-council-dapp.vercel.app'},
            {label: 'API', href: 'https://the-council-api.fly.dev'},
            {label: 'Repository', href: repositoryUrl},
          ],
        },
      ],
      copyright: `Copyright ${new Date().getFullYear()} The Council.`,
    },
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    prism: {
      theme: themes.dracula,
      darkTheme: themes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
