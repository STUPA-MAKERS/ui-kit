/**
 * Bare URLs in rendered, escaped HTML become links. The Markdown renderer and the chat
 * share this one implementation.
 */

/** A URL in escaped text. It ends before white space, a tag or an escaped quote or
 *  angle bracket, so no quote ever reaches an href. */
const URL_RE = /https?:\/\/(?:(?!&(?:quot|#39|lt|gt);)[^\s<])+/g;
/** Characters and entities at the end of a match that close the sentence, not the URL. */
const TRAILING = /(?:[.,;:!?)\]]|&gt;|&quot;|&#39;)$/;

/** Cut the punctuation that follows a URL in a sentence. */
function trimUrl(url: string): string {
  return TRAILING.test(url) ? trimUrl(url.replace(TRAILING, '')) : url;
}

/** The change of the link and code depth that a tag makes: +1 opens, -1 closes. */
function depthStep(tag: string): number {
  return /^<(a|code|pre)\b/.test(tag) ? 1 : /^<\/(a|code|pre)>/.test(tag) ? -1 : 0;
}

/** Link the bare URLs of one text part. */
function linkText(text: string): string {
  return text.replace(URL_RE, (match) => {
    const url = trimUrl(match);
    const rest = match.slice(url.length);
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>${rest}`;
  });
}

/**
 * Turn the bare URLs of rendered, escaped HTML into links. Text inside a link or a code
 * element stays as it is. The link shows the whole URL; it is never shortened.
 */
export function linkify(html: string): string {
  return html.split(/(<[^>]+>)/).reduce(
    (acc, part) =>
      part.startsWith('<')
        ? { depth: acc.depth + depthStep(part), out: acc.out + part }
        : { depth: acc.depth, out: acc.out + (acc.depth > 0 ? part : linkText(part)) },
    { depth: 0, out: '' },
  ).out;
}
