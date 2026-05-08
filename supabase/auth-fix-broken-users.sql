-- ============================================================
-- AUTH FIX — usuários "quebrados" no auth.users
-- ============================================================
-- Resolve dois problemas comuns que aparecem quando users são
-- inseridos manualmente em auth.users (via SQL ou API antiga):
--
-- 1. Sem identity em auth.identities → cria a identity de email
-- 2. Colunas string com NULL em vez de '' → atualiza pra string
--    vazia, evitando o erro do GoTrue:
--      "Scan error on column index N: converting NULL to string"
--
-- Sintomas tratados:
--   - "Database error finding user"
--   - "500: Unable to process request" em /recover, /invite, etc.
--
-- Idempotente — pode ser re-rodado.
-- ============================================================

BEGIN;

-- 1) Cria identity faltante para todos os users que não têm
INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id,
  last_sign_in_at, created_at, updated_at
)
SELECT
  uuid_generate_v4(),
  u.id,
  jsonb_build_object(
    'sub', u.id::text,
    'email', u.email,
    'email_verified', COALESCE(u.email_confirmed_at IS NOT NULL, false),
    'phone_verified', false
  ),
  'email',
  u.id::text,
  NOW(), NOW(), NOW()
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM auth.identities i WHERE i.user_id = u.id
)
AND u.email IS NOT NULL
ON CONFLICT (provider, provider_id) DO NOTHING;

-- 2) Sanitiza colunas string que estão NULL (devem ser '')
UPDATE auth.users SET
  email_change                 = COALESCE(email_change, ''),
  email_change_token_new       = COALESCE(email_change_token_new, ''),
  email_change_token_current   = COALESCE(email_change_token_current, ''),
  recovery_token               = COALESCE(recovery_token, ''),
  confirmation_token           = COALESCE(confirmation_token, ''),
  reauthentication_token       = COALESCE(reauthentication_token, ''),
  phone_change                 = COALESCE(phone_change, ''),
  phone_change_token           = COALESCE(phone_change_token, ''),
  email_change_confirm_status  = COALESCE(email_change_confirm_status, 0)
WHERE email_change IS NULL
   OR email_change_token_new IS NULL
   OR email_change_token_current IS NULL
   OR recovery_token IS NULL
   OR confirmation_token IS NULL
   OR reauthentication_token IS NULL
   OR phone_change IS NULL
   OR phone_change_token IS NULL
   OR email_change_confirm_status IS NULL;

COMMIT;
