import type {ReactNode} from 'react';
import Layout from '@theme/Layout';
import FeatureCardGrid from '@site/src/components/FeatureCardGrid';
import HeroBand from '@site/src/components/HeroBand';

const featureCards = [
  {
    title: 'Product',
    description: 'The problem founders face, how the council solves it, and how the protocol earns.',
    to: '/docs/problem-and-solution',
  },
  {
    title: 'Concepts',
    description: 'Five agents with opposed mandates, and the two-round debate they run.',
    to: '/docs/agent-roles-and-philosophy',
  },
  {
    title: 'System Design',
    description: 'How the frontend, API, agents, and smart contracts fit together.',
    to: '/docs/architecture',
  },
  {
    title: 'Getting Started',
    description: 'Run the contracts, backend, and frontend locally.',
    to: '/docs/getting-started',
  },
];

export default function Home(): ReactNode {
  return (
    <Layout
      title="The Council Docs"
      description="Adversarial AI idea validation, verified on-chain.">
      <HeroBand
        title="Your idea, cross-examined by AI, verified on-chain."
        subtitle="Five AI agents debate your startup idea adversarially. The verdict is recorded permanently on BNB Chain."
        primaryAction={{label: 'Read the Docs', to: '/docs/overview'}}
        secondaryAction={{label: 'View on GitHub', to: 'https://github.com/hafidluqman50/the-council'}}
      />
      <main>
        <FeatureCardGrid cards={featureCards} />
      </main>
    </Layout>
  );
}
