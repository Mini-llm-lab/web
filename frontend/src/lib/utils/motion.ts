import gsap from 'gsap';

export function prefersReducedMotion(): boolean {
	return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

export function animateMessageIn(element: HTMLElement): void {
	if (prefersReducedMotion()) return;
	gsap.fromTo(
		element,
		{ opacity: 0, y: 10 },
		{ opacity: 1, y: 0, duration: 0.28, ease: 'power1.out', clearProps: 'all' }
	);
}

export function animateWelcomeStack(container: HTMLElement): void {
	if (prefersReducedMotion()) return;
	gsap.fromTo(
		container.children,
		{ opacity: 0, y: 14 },
		{ opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out', clearProps: 'all' }
	);
}

export function animatePress(element: HTMLElement): void {
	if (prefersReducedMotion()) return;
	gsap.fromTo(element, { scale: 0.94 }, { scale: 1, duration: 0.18, ease: 'power2.out' });
}
