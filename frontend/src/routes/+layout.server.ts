export const load = async ({ depends, locals }) => {
  depends('supabase:auth');

  const { session, user } = await locals.safeGetSession();

  return {
    session,
    user,
  };
};
