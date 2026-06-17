-- El hook custom_access_token_hook corre como supabase_auth_admin.
-- Sin estos grants, Supabase Auth devuelve 500 "Database error querying schema".

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
GRANT SELECT ON TABLE public.usuarios TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;
