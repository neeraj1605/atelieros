import { test } from 'node:test';
import assert from 'node:assert/strict';
import { issueToken, verifyToken, hmacSign, sha256Hex, newProjectId } from '../src/session.js';

const SECRET = 'test-secret-please-ignore';

test('issues and verifies a token', async () => {
  const id = 'proj-123';
  const token = await issueToken(SECRET, id);
  const res = await verifyToken(SECRET, token);
  assert.equal(res.ok, true);
  assert.equal(res.projectId, id);
});

test('rejects a tampered token', async () => {
  const token = await issueToken(SECRET, 'proj-1');
  const tampered = token.replace(/\.[^.]+$/, '.deadbeef');
  const res = await verifyToken(SECRET, tampered);
  assert.equal(res.ok, false);
});

test('rejects a token signed with a different secret', async () => {
  const token = await issueToken('other-secret', 'proj-1');
  const res = await verifyToken(SECRET, token);
  assert.equal(res.ok, false);
  assert.equal(res.reason, 'bad_signature');
});

test('rejects an expired token', async () => {
  const token = await issueToken(SECRET, 'proj-1', -1000);
  const res = await verifyToken(SECRET, token);
  assert.equal(res.ok, false);
  assert.equal(res.reason, 'expired');
});

test('rejects malformed tokens', async () => {
  assert.equal((await verifyToken(SECRET, 'nope')).ok, false);
  assert.equal((await verifyToken(SECRET, 'a.b')).ok, false);
  assert.equal((await verifyToken(SECRET, null)).ok, false);
});

test('hmacSign is deterministic and sha256Hex works', async () => {
  const a = await hmacSign(SECRET, 'data');
  const b = await hmacSign(SECRET, 'data');
  assert.equal(a, b);
  const h = await sha256Hex('abc');
  assert.equal(h, 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});

test('newProjectId returns a uuid', () => {
  const id = newProjectId();
  assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
});
