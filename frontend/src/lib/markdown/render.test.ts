import { describe, expect, it } from 'vitest';
import { renderMarkdown } from './render';

describe('renderMarkdown', () => {
	it('renders headings and paragraphs', () => {
		const html = renderMarkdown('# Titre\n\nParagraphe.');
		expect(html).toContain('<h1>Titre</h1>');
		expect(html).toContain('<p>Paragraphe.</p>');
	});

	it('renders ordered and unordered lists', () => {
		const html = renderMarkdown('- un\n- deux\n\n1. premier\n2. second');
		expect(html).toContain('<li>un</li>');
		expect(html).toContain('<ol');
		expect(html).toContain('<li>premier</li>');
	});

	it('renders emphasis, blockquotes and links', () => {
		const html = renderMarkdown('**gras** _italique_\n\n> citation\n\n[lien](https://example.com)');
		expect(html).toContain('<strong>gras</strong>');
		expect(html).toContain('<em>italique</em>');
		expect(html).toContain('<blockquote>');
		expect(html).toContain('<a href="https://example.com"');
	});

	it('renders tables', () => {
		const html = renderMarkdown('| a | b |\n| - | - |\n| 1 | 2 |');
		expect(html).toContain('<table>');
		expect(html).toContain('<th>a</th>');
		expect(html).toContain('<td>1</td>');
	});

	it('renders inline code and fenced code blocks', () => {
		const html = renderMarkdown('texte `inline` puis\n\n```go\nfunc main() {}\n```');
		expect(html).toContain('<code>inline</code>');
		expect(html).toContain('<pre');
		expect(html).toContain('func main()');
	});

	it('renders an unterminated fenced code block gracefully', () => {
		const html = renderMarkdown('Démarrage :\n\n```python\nprint("loop');
		expect(html).toContain('<pre');
		expect(html).toContain('print("loop');
	});

	it('adds safe external link attributes', () => {
		const html = renderMarkdown('[site](https://example.com)');
		expect(html).toContain('target="_blank"');
		expect(html).toContain('rel="noopener noreferrer nofollow"');
	});

	it('strips javascript urls from links', () => {
		const html = renderMarkdown('[clic](javascript:alert(1))');
		expect(html).not.toContain('href="javascript:');
		expect(html).not.toContain('javascript:alert');
	});

	it('removes inline event handlers', () => {
		const html = renderMarkdown('<img src="https://example.com/x.png" onerror="alert(1)">');
		expect(html).not.toContain('onerror');
	});

	it('removes script tags entirely', () => {
		const html = renderMarkdown('<script>alert(1)</script>du texte');
		expect(html).not.toContain('<script');
		expect(html).not.toContain('alert(1)</script');
	});

	it('removes iframes and forms', () => {
		const html = renderMarkdown(
			'<iframe src="https://example.com"></iframe><form><input type="text"></form>'
		);
		expect(html).not.toContain('<iframe');
		expect(html).not.toContain('<form');
		expect(html).not.toContain('<input');
	});

	it('keeps data-imageok protocol blocked as javascript', () => {
		const html = renderMarkdown('[x](data:text/html;base64,PHNjcmlwdD4=)');
		expect(html).not.toContain('href="data:');
	});
});
