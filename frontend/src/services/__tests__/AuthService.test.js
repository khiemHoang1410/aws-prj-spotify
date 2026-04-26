/**
 * Tests cho Cognito groups role parsing trong AuthService.login()
 * Feature: admin-panel-data-fetch-bug
 */
import { describe, it, expect } from 'vitest';

/**
 * Hàm parse role được extract từ AuthService.login() để test độc lập.
 * Logic này phải khớp chính xác với code trong AuthService.js.
 */
function parseRoleFromGroups(rawGroups) {
  if (Array.isArray(rawGroups) && rawGroups.length > 0) {
    return rawGroups[0];
  }
  if (typeof rawGroups === 'string' && rawGroups.trim().length > 0) {
    const parsed = rawGroups.replace(/^\[|\]$/g, '').split(',').map((s) => s.trim()).filter(Boolean);
    if (parsed.length > 0) return parsed[0];
  }
  return 'listener';
}

// ─── Bug condition: Cognito trả về string thay vì array ───────────────────────

describe('parseRoleFromGroups — bug condition (string format)', () => {
  it('[admin] → "admin" (không phải "[")', () => {
    expect(parseRoleFromGroups('[admin]')).toBe('admin');
  });

  it('[artist] → "artist"', () => {
    expect(parseRoleFromGroups('[artist]')).toBe('artist');
  });

  it('[admin, artist] → "admin" (lấy phần tử đầu tiên)', () => {
    expect(parseRoleFromGroups('[admin, artist]')).toBe('admin');
  });

  it('[listener] → "listener"', () => {
    expect(parseRoleFromGroups('[listener]')).toBe('listener');
  });

  it('string không có bracket → trả về nguyên giá trị', () => {
    expect(parseRoleFromGroups('admin')).toBe('admin');
  });
});

// ─── Preservation: input không bị bug vẫn hoạt động đúng ─────────────────────

describe('parseRoleFromGroups — preservation (non-buggy inputs)', () => {
  it('null → "listener"', () => {
    expect(parseRoleFromGroups(null)).toBe('listener');
  });

  it('undefined → "listener"', () => {
    expect(parseRoleFromGroups(undefined)).toBe('listener');
  });

  it('chuỗi rỗng → "listener"', () => {
    expect(parseRoleFromGroups('')).toBe('listener');
  });

  it('[] (empty brackets string) → "listener"', () => {
    expect(parseRoleFromGroups('[]')).toBe('listener');
  });

  it('native array ["admin"] → "admin"', () => {
    expect(parseRoleFromGroups(['admin'])).toBe('admin');
  });

  it('native array ["artist"] → "artist"', () => {
    expect(parseRoleFromGroups(['artist'])).toBe('artist');
  });

  it('native array rỗng [] → "listener"', () => {
    expect(parseRoleFromGroups([])).toBe('listener');
  });

  it('native array ["admin", "artist"] → "admin"', () => {
    expect(parseRoleFromGroups(['admin', 'artist'])).toBe('admin');
  });
});

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe('parseRoleFromGroups — edge cases', () => {
  it('khoảng trắng xung quanh tên group được trim', () => {
    expect(parseRoleFromGroups('[ admin ]')).toBe('admin');
    expect(parseRoleFromGroups('[  artist  ]')).toBe('artist');
  });

  it('số → "listener" (không phải string/array hợp lệ)', () => {
    expect(parseRoleFromGroups(0)).toBe('listener');
    expect(parseRoleFromGroups(123)).toBe('listener');
  });
});
