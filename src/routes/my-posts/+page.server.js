import { db } from '$lib/server/db/client.js';
import { posts } from '$lib/server/db/schema.ts';
import { eq } from 'drizzle-orm';

export const actions = {
	editPost: async function ({ locals, request }) {
		let user = locals.user;
		const formData = await request.formData();
		if (user) {
			await db
				.update(posts)
				.set({ text: formData.get('new_text') })
				.where(eq(posts.id, formData.get('id')));
		}
	}
};
