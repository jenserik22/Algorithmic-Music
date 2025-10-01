-- pgTAP tests for basic schema presence and RLS policies
BEGIN;
SELECT plan(10);

-- Tables exist
SELECT has_table('public', 'generations', 'generations table exists');
SELECT has_table('public', 'folders', 'folders table exists');
SELECT has_table('public', 'presets', 'presets table exists');

-- Enums exist
SELECT has_type('public', 'algorithm', 'algorithm enum exists');
SELECT has_type('public', 'audio_format', 'audio_format enum exists');

-- RLS enabled on key tables
SELECT policies_are_enabled('public', 'generations', 'RLS enabled on generations');
SELECT policies_are_enabled('public', 'folders', 'RLS enabled on folders');
SELECT policies_are_enabled('public', 'presets', 'RLS enabled on presets');

-- Owner policies present (names may vary; ensure at least one policy exists)
SELECT policies('public', 'generations') IS NOT NULL AS ok, 'generations has policies' AS description; 
SELECT policies('public', 'folders') IS NOT NULL AS ok, 'folders has policies' AS description; 

SELECT finish();
ROLLBACK;
