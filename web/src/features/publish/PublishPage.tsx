'use client';

import {
  MAX_PAGE_HTML,
  MAX_TITLE,
  type Person,
  publishSchema,
} from '@small-web/contracts';
import {
  type SubmitEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { Button } from '@/components/Button';
import { PageBanner } from '@/components/PageBanner';
import { ApiRequestError, publishPage } from '@/lib/api-client';
import {
  clearDraft,
  loadDraft,
  type PublishDraft,
  saveDraft,
} from './publish-draft';
import styles from './PublishPage.module.css';

const EXAMPLE_HTML = `<style>
  body { font-family: Georgia, serif; max-width: 36em; margin: 2em auto; padding: 0 1em; line-height: 1.7; }
  h1 { color: #2f6b5e; }
</style>
<h1>Driftwood</h1>
<p>Found on the strandline after the storm: a plank, worn smooth and silver.</p>
<p>Walk on to <a href="tidepool.zz">the tide pools</a>, or wander somewhere that
never existed, like <a href="lost-boat.zz">the lost boat</a>.</p>`;

const SCROLL_REPORT_MS = 100;

type Field = 'address' | 'title' | 'html' | 'authorId';

interface PublishPageProps {
  readonly people: readonly Person[];
  readonly personId: string;
  readonly scrollY: number;
  readonly onScroll: (y: number) => void;
  readonly onPublished: (address: string) => void;
  readonly onHome: () => void;
}

export function PublishPage({
  people,
  personId,
  scrollY,
  onScroll,
  onPublished,
  onHome,
}: PublishPageProps) {
  const htmlFieldId = useId();
  const form = useRef<HTMLFormElement>(null);
  const pane = useRef<HTMLDivElement>(null);
  const [draft] = useState<PublishDraft | null>(loadDraft);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Coming back to the form puts it where it was left.
  const [initialScroll] = useState(scrollY);
  useEffect(() => {
    if (pane.current) pane.current.scrollTop = initialScroll;
  }, [initialScroll]);

  useEffect(
    () => () => {
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
    },
    [],
  );

  const reportScroll = () => {
    if (scrollTimer.current !== null) return;
    scrollTimer.current = setTimeout(() => {
      scrollTimer.current = null;
      if (pane.current) onScroll(Math.round(pane.current.scrollTop));
    }, SCROLL_REPORT_MS);
  };

  const read = (): PublishDraft => {
    const data = new FormData(form.current ?? undefined);
    const text = (name: Field) => String(data.get(name) ?? '');
    return {
      address: text('address'),
      title: text('title'),
      html: text('html'),
      authorId: text('authorId'),
    };
  };

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFailure(null);

    const parsed = publishSchema.safeParse(read());
    if (!parsed.success) {
      const found: Partial<Record<Field, string>> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as Field;
        found[field] ??= issue.message;
      }
      setErrors(found);
      return;
    }

    setErrors({});
    setSending(true);
    try {
      const result = await publishPage(parsed.data);
      clearDraft();
      onPublished(result.address);
    } catch (error) {
      setSending(false);
      setFailure(describeFailure(error));
    }
  };

  const fillExample = () => {
    const html = form.current?.elements.namedItem('html');
    if (html instanceof HTMLTextAreaElement) {
      html.value = EXAMPLE_HTML;
      saveDraft(read());
    }
  };

  return (
    <div className={styles.pane} ref={pane} onScroll={reportScroll}>
      <PageBanner
        title="Publish"
        subtitle="Put a page on the small web"
        crumb="Publish"
        onHome={onHome}
      />

      <div className={styles.page}>
        <p className={styles.lede}>
          Choose an address, write a page of HTML, and it is live the moment you
          publish. Publishing again at an address of your own adds a new
          version. Anyone who was reading the old one still has it.
        </p>

        <div className={styles.layout}>
          <form
            ref={form}
            className={styles.form}
            onSubmit={(event) => {
              void submit(event);
            }}
            onInput={() => {
              saveDraft(read());
            }}
            noValidate
          >
            <label className={styles.field}>
              <span className={styles.label}>Publishing as</span>
              <select
                name="authorId"
                className={styles.select}
                defaultValue={draft?.authorId || personId}
                onChange={() => {
                  saveDraft(read());
                }}
              >
                {people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
              <FieldError message={errors.authorId} />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Address</span>
              <input
                name="address"
                className={`${styles.input} ${styles.mono}`}
                defaultValue={draft?.address ?? ''}
                placeholder="yourname.zz"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                aria-invalid={errors.address ? true : undefined}
              />
              <FieldError message={errors.address} />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Title</span>
              <input
                name="title"
                className={styles.input}
                defaultValue={draft?.title ?? ''}
                placeholder="What the page is called"
                maxLength={MAX_TITLE}
                aria-invalid={errors.title ? true : undefined}
              />
              <FieldError message={errors.title} />
            </label>

            {/*
              Not wrapped in a <label>: a button inside one would be named "Page",
              and the box would lose its label. The label points at the box instead.
            */}
            <div className={styles.field}>
              <span className={styles.labelRow}>
                <label htmlFor={htmlFieldId} className={styles.label}>
                  Page
                </label>
                <button
                  type="button"
                  className={styles.example}
                  onClick={fillExample}
                >
                  Start from an example
                </button>
              </span>
              <textarea
                id={htmlFieldId}
                name="html"
                className={`${styles.input} ${styles.mono} ${styles.textarea}`}
                defaultValue={draft?.html ?? ''}
                placeholder="<h1>Hello</h1>&#10;<p>Your page, in HTML.</p>"
                spellCheck={false}
                maxLength={MAX_PAGE_HTML}
                aria-invalid={errors.html ? true : undefined}
              />
              <FieldError message={errors.html} />
            </div>

            {failure ? (
              <p className={styles.failure} role="alert">
                {failure}
              </p>
            ) : null}

            <div className={styles.actions}>
              <Button
                type="submit"
                variant="neon"
                size="lg"
                disabled={sending}
              >
                {sending ? 'Publishing…' : 'Publish'}
              </Button>
            </div>
          </form>

          <aside className={styles.rules} aria-label="What a page can contain">
            <h2 className={styles.rulesTitle}>What a page can be</h2>
            <p className={styles.rulesLede}>
              Pages are written by strangers, so they are shown in a sealed
              frame.
            </p>
            <h3 className={styles.rulesHeading}>Kept</h3>
            <ul className={styles.kept}>
              <li>Headings, paragraphs, lists and tables</li>
              <li>Links to any address, even ones that lead nowhere</li>
              <li>
                Your own CSS, in <code>&lt;style&gt;</code> or{' '}
                <code>style=&quot;…&quot;</code>
              </li>
            </ul>
            <h3 className={styles.rulesHeading}>Removed</h3>
            <ul className={styles.removed}>
              <li>Scripts and event handlers</li>
              <li>Forms, frames and embeds</li>
              <li>Images, fonts and anything loaded from elsewhere</li>
            </ul>
          </aside>
        </div>
      </div>
    </div>
  );
}

function FieldError({ message }: { readonly message: string | undefined }) {
  return message ? <span className={styles.fieldError}>{message}</span> : null;
}

function describeFailure(error: unknown): string {
  if (!(error instanceof ApiRequestError)) {
    return 'The small web could not be reached. Your page is still here; try again.';
  }
  switch (error.status) {
    case 409:
      return 'That address already belongs to someone else. Choose another.';
    case 413:
      return 'That page is too large to publish.';
    case 429:
      return 'Too many pages published just now. Wait a minute and try again.';
    default:
      return error.message;
  }
}
