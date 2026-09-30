import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';

type FeatureCard = {
  title: string;
  description: string;
  to: string;
};

type FeatureCardGridProps = {
  cards: FeatureCard[];
};

export default function FeatureCardGrid({cards}: FeatureCardGridProps): ReactNode {
  return (
    <section className="councilCardSection">
      <div className="councilCardGrid">
        {cards.map((card) => (
          <Link key={card.to} className="councilCard" to={card.to}>
            <span className="councilCardTitle">{card.title}</span>
            <span className="councilCardDescription">{card.description}</span>
            <span className="councilCardLink">Read more →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
