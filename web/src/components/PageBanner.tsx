import Image from 'next/image';
import styles from './PageBanner.module.css';

interface PageBannerProps {
  /** Set huge and in capitals, like a section title on a poster. */
  readonly title: string;
  /** A softer line under it, in italics. */
  readonly subtitle?: string;
  /** Where this page sits, after Home. */
  readonly crumb: string;
  readonly onHome: () => void;
}

/** The top of an inner page: white, a big title, a turning gear, and a way home. */
export function PageBanner({ title, subtitle, crumb, onHome }: PageBannerProps) {
  return (
    <header className={styles.banner}>
      <div className={styles.grid} aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className={styles.inner}>
        <div className={styles.words}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </div>

        <div className={styles.side}>
          <Image
            className={styles.gear}
            src="/hero/rotating_gear.png"
            alt=""
            aria-hidden="true"
            width={607}
            height={581}
            sizes="120px"
            priority
          />
          <nav className={styles.crumbs} aria-label="Breadcrumb">
            <button type="button" className={styles.crumbHome} onClick={onHome}>
              Home
            </button>
            <span className={styles.crumbSep} aria-hidden="true">
              /
            </span>
            <span aria-current="page">{crumb}</span>
          </nav>
        </div>
      </div>

      <div className={styles.bar} aria-hidden="true" />
    </header>
  );
}
