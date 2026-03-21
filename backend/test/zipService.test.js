import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeZipName } from '../src/services/zipService.js';

test('sanitizeZipName removes reserved filesystem characters', () => {
  assert.equal(sanitizeZipName(' bad:name*?.zip '), 'bad_name__.zip');
});

test('sanitizeZipName falls back when the name is empty', () => {
  assert.equal(sanitizeZipName('   '), 'frames');
  assert.equal(sanitizeZipName(''), 'frames');
});
