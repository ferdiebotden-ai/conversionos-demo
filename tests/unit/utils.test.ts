/**
 * Utility Function Tests
 * Tests for shared utility functions
 */

import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn (classname merge utility)', () => {
  it('merges single class string', () => {
    expect(cn('bg-red-500')).toBe('bg-red-500');
  });

  it('merges multiple class strings', () => {
    expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white');
  });

  it('handles conditional classes', () => {
    const isActive = true;
    const isDisabled = false;

    expect(
      cn('base-class', isActive && 'active-class', isDisabled && 'disabled-class')
    ).toBe('base-class active-class');
  });

  it('handles undefined and null values', () => {
    expect(cn('base-class', undefined, null, 'another-class')).toBe(
      'base-class another-class'
    );
  });

  it('merges tailwind classes with conflict resolution', () => {
    // Later classes should override earlier ones
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
    expect(cn('p-4', 'p-8')).toBe('p-8');
    expect(cn('text-sm', 'text-lg')).toBe('text-lg');
  });

  it('handles array of classes', () => {
    expect(cn(['bg-red-500', 'text-white'])).toBe('bg-red-500 text-white');
  });

  it('handles object with boolean values', () => {
    expect(
      cn({
        'bg-red-500': true,
        'text-white': true,
        'opacity-50': false,
      })
    ).toBe('bg-red-500 text-white');
  });

  it('handles complex nested combinations', () => {
    const result = cn(
      'base',
      ['array-class'],
      { 'object-true': true, 'object-false': false },
      undefined,
      'final'
    );

    expect(result).toContain('base');
    expect(result).toContain('array-class');
    expect(result).toContain('object-true');
    expect(result).not.toContain('object-false');
    expect(result).toContain('final');
  });

  it('resolves tailwind responsive prefixes correctly', () => {
    expect(cn('md:bg-red-500', 'md:bg-blue-500')).toBe('md:bg-blue-500');
  });

  it('handles empty inputs', () => {
    expect(cn()).toBe('');
    expect(cn('')).toBe('');
    expect(cn('', '', '')).toBe('');
  });

  it('handles hover states correctly', () => {
    expect(cn('hover:bg-red-500', 'hover:bg-blue-500')).toBe('hover:bg-blue-500');
  });

  it('preserves non-conflicting modifiers', () => {
    expect(cn('bg-red-500', 'hover:bg-blue-500')).toBe(
      'bg-red-500 hover:bg-blue-500'
    );
  });
});
