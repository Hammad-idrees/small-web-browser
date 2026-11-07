import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'neon' | 'light' | 'solid' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * - `neon`: the main action, green with a black sweep.
   * - `light`: white with a black sweep, for dark surfaces.
   * - `solid`: follows the page's ink, so it suits light and dark pages alike.
   * - `outline`: a quieter second action beside one of the others.
   */
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
}

/**
 * The site's one button: a skewed slab that a colour sweeps across on hover and on
 * keyboard focus. The label is skewed back, so text and icons stay upright.
 */
export function Button({
  variant = 'solid',
  size = 'md',
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = [styles.button, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={classes} {...rest}>
      <span className={styles.label}>{children}</span>
    </button>
  );
}
