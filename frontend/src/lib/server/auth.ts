import { redirect } from '@sveltejs/kit';

export const requireUser = async (locals: App.Locals) => {
  const { user } = await locals.safeGetSession();

  if (!user) {
    redirect(303, '/login');
  }

  return user;
};
