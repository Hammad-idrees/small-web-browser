import { BrowserApp } from '@/features/BrowserApp';

/**
 * Every URL is this one page. Where the browser actually is comes from the trail, and
 * the URL only reflects it, so moving between sites never remounts the app.
 */
export default function BrowserPage() {
  return <BrowserApp />;
}
