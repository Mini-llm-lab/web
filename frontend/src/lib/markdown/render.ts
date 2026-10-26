import DOMPurify from 'dompurify';
import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: true });

const SAFE_LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);

const allowedAttributes = [
	'href',
	'title',
	'target',
	'rel',
	'abbr',
	'class',
	'align',
	'start',
	'colspan',
	'rowspan'
];

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
	if (node.nodeType !== 1) return;
	const element = node as HTMLElement;
	switch (element.tagName.toLowerCase()) {
		case 'a': {
			const href = element.getAttribute('href') ?? '';
			if (!href || !isSafeHref(href)) {
				element.removeAttribute('href');
			} else if (!href.startsWith('mailto:')) {
				element.setAttribute('target', '_blank');
				element.setAttribute('rel', 'noopener noreferrer nofollow');
			} else {
				element.removeAttribute('target');
				element.setAttribute('rel', 'noopener noreferrer');
			}
			break;
		}
		case 'img': {
			const src = element.getAttribute('src') ?? '';
			if (!isSafeHref(src)) {
				element.remove();
			} else {
				element.setAttribute('loading', 'lazy');
			}
			break;
		}
	}
});

export function renderMarkdown(source: string): string {
	const rawHtml = marked.parse(source, { async: false });
	return DOMPurify.sanitize(rawHtml, {
		ALLOWED_ATTR: allowedAttributes,
		FORBID_TAGS: ['style', 'form', 'input', 'textarea', 'iframe', 'button', 'object', 'embed']
	}).toString();
}

function isSafeHref(href: string): boolean {
	try {
		const url = new URL(href, 'https://miniweb.invalid');
		return SAFE_LINK_PROTOCOLS.has(url.protocol);
	} catch {
		return false;
	}
}
