import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BREAKPOINTS, MEDIA, widthClass } from './breakpoints';

const SCSS = readFileSync(join(__dirname, '../../styles/_breakpoints.scss'), 'utf8');

describe('breakpoints', () => {
  it('classifies a viewport width', () => {
    expect(widthClass(390)).toBe('phone');
    expect(widthClass(768)).toBe('phone');
    expect(widthClass(769)).toBe('narrow');
    expect(widthClass(960)).toBe('narrow');
    expect(widthClass(1199)).toBe('narrow');
    expect(widthClass(1200)).toBe('wide');
    expect(widthClass(1440)).toBe('wide');
  });

  it('keeps the TypeScript values in step with the SCSS mixins', () => {
    expect(SCSS).toContain(`$phone-max: ${BREAKPOINTS.phoneMax}px;`);
    expect(SCSS).toContain(`$wide-min: ${BREAKPOINTS.wideMin}px;`);
    expect(SCSS).toContain('$narrow-min: 768.02px;');
    expect(SCSS).toContain('$narrow-max: 1199.98px;');
    expect(MEDIA.phone).toBe('(max-width: 768px)');
    expect(MEDIA.narrow).toBe('(min-width: 768.02px) and (max-width: 1199.98px)');
    expect(MEDIA.wide).toBe('(min-width: 1200px)');
    expect(MEDIA.notPhone).toBe('(min-width: 768.02px)');
    expect(MEDIA.belowWide).toBe('(max-width: 1199.98px)');
  });
});
