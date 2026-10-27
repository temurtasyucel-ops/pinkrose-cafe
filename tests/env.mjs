import assert from 'node:assert/strict';
import {supabaseUrl,supabasePublishableKey,supabaseSecretKey} from '../lib/env.ts';

process.env.NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='test-publishable-key';
process.env.SUPABASE_SECRET_KEY='test-secret-key';
delete process.env.SUPABASE_SERVICE_ROLE_KEY;
assert.equal(supabaseUrl(),'https://example.supabase.co');
assert.equal(supabasePublishableKey(),'test-publishable-key');
assert.equal(supabaseSecretKey(),'test-secret-key');

process.env.NEXT_PUBLIC_SUPABASE_URL='http://127.0.0.1:3102';
assert.equal(supabaseUrl(),'http://127.0.0.1:3102');
for(const value of ['', 'not-a-url', 'ftp://example.com', 'http://example.com']){
  process.env.NEXT_PUBLIC_SUPABASE_URL=value;
  assert.throws(()=>supabaseUrl(),/NEXT_PUBLIC_SUPABASE_URL/);
}
process.env.NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=' ';
assert.throws(()=>supabasePublishableKey(),/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
delete process.env.SUPABASE_SECRET_KEY;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;
assert.throws(()=>supabaseSecretKey(),/SUPABASE_SECRET_KEY/);
process.env.SUPABASE_SERVICE_ROLE_KEY='legacy-service-role-key';
assert.equal(supabaseSecretKey(),'legacy-service-role-key');

console.log('PASS: Supabase environment validation, local HTTP allowance, invalid URL rejection and legacy key fallback.');
