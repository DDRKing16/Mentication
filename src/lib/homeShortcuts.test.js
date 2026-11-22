import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
const html = readFileSync('design/home-source/index.html', 'utf8');
const app = readFileSync('design/home-source/app.js', 'utf8');
const week = html.slice(html.indexOf('<section class="week-panel"'), html.indexOf('<section class="parking-return"'));
const shortcuts = html.slice(html.indexOf('<div class="home-shortcuts"'), html.indexOf('<section class="needs"'));
const wellness = html.slice(html.indexOf('<dialog id="wellness-dialog"'), html.indexOf('<dialog id="accessibility-dialog"'));
describe('Home weekly content and independent daily shortcuts', () => {
  it('keeps the seven-day track, status and Begin while removing unrelated cards from Your Week', () => {
    expect(week).toContain('id="week-heading"');
    expect(week.match(/class="week-day/g)).toHaveLength(7);
    expect(week).toContain('id="week-status"');
    expect(week).toContain('data-route="begin"');
    expect(week).not.toMatch(/wellness|palace|Oura|today-card/);
  });
  it('keeps the conditional recommendation followed by separately named Oura and Palace buttons', () => {
    expect(shortcuts).toContain('class="today" id="today-card" hidden');
    expect(shortcuts).toContain('data-route="recommended"');
    expect(shortcuts).toContain('id="today-title"');
    expect(shortcuts).toContain('aria-label="Oura scores"');
    expect(shortcuts).toContain('aria-controls="wellness-dialog"');
    expect(shortcuts).toContain('data-route="palace"');
    expect(shortcuts.indexOf('today-card')).toBeLessThan(shortcuts.indexOf('wellness-open'));
    expect(shortcuts.indexOf('wellness-open')).toBeLessThan(shortcuts.indexOf('palace-badge-icon'));
  });
  it('moves the actual score summary into the existing consent-aware dialog', () => {
    expect(wellness).toContain('id="wellness-summary"');
    expect(wellness).toContain('id="wellness-sources"');
    expect(html.match(/id="wellness-summary"/g)).toHaveLength(1);
    expect(shortcuts).not.toContain('id="wellness-summary"');
    expect(app).not.toContain('has-wellness-connection');
    expect(app).toContain("openDialog('wellness-dialog', event.currentTarget)");
  });
  it('retains live level artwork and progress details without static claims while history loads', () => {
    for (const id of ['palace-badge-art', 'palace-badge-level', 'palace-badge-next']) expect(shortcuts).toContain(`id="${id}"`);
    expect(shortcuts).toContain('History not checked');
    expect(shortcuts).toContain('aria-describedby="palace-badge-next"');
    expect(app).toContain("document.getElementById('palace-badge-level').textContent = levelText");
  });
});
