import { db } from '$lib/server/db/client.js';
import { posts } from '$lib/server/db/schema.ts';
import { eq } from 'drizzle-orm';

export const actions = {
	NOOP: async function ({ locals, request }) {
		let user = locals.user;
		const formData = await request.formData();
	}
};
