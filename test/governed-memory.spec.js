import { describe, expect, it } from 'vitest';
import {
	classifyMemoryCapture,
	isExplicitFirstPersonStatement,
} from '../src/services/governed-memory';

describe('governed memory capture policy', () => {
	it('confirms explicit standard first-person facts', () => {
		expect(classifyMemoryCapture(
			'preference',
			'I prefer quiet cafés when I need to focus.',
		)).toMatchObject({
			category: 'preference',
			status: 'confirmed',
			sensitivity: 'standard',
			explicit: true,
		});
	});

	it('keeps sensitive facts as candidates even when explicitly stated', () => {
		expect(classifyMemoryCapture(
			'health',
			'I take medication every morning.',
		)).toMatchObject({
			status: 'candidate',
			sensitivity: 'sensitive',
			explicit: true,
		});
	});

	it('does not confirm questions or third-person model inferences', () => {
		expect(isExplicitFirstPersonStatement('Do I prefer quiet cafés?')).toBe(false);
		expect(classifyMemoryCapture(
			'preference',
			'The user probably prefers concise answers.',
		).status).toBe('candidate');
	});

	it('does not auto-confirm a statement unsupported by the source turn', () => {
		expect(classifyMemoryCapture(
			'preference',
			'I prefer quiet cafés when I need to focus.',
			'I live in Manchester and own three cats.',
		).status).toBe('candidate');
	});
});
