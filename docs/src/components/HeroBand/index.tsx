import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';

type HeroAction = {
  label: string;
  to: string;
};

type HeroBandProps = {
  title: string;
  subtitle: string;
  primaryAction: HeroAction;
  secondaryAction: HeroAction;
};

export default function HeroBand({
  title,
  subtitle,
  primaryAction,
  secondaryAction,
}: HeroBandProps): ReactNode {
  return (
    <header className="councilHero">
      <div className="councilHeroInner">
        <h1 className="councilHeroTitle">{title}</h1>
        <p className="councilHeroSubtitle">{subtitle}</p>
        <div className="councilHeroActions">
          <Link className={clsx('button', 'councilButtonAccent')} to={primaryAction.to}>
            {primaryAction.label}
          </Link>
          <Link className={clsx('button', 'councilButtonOutline')} to={secondaryAction.to}>
            {secondaryAction.label}
          </Link>
        </div>
      </div>
    </header>
  );
}
