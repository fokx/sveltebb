import { db } from '$lib/server/db/client.js';
import { posts } from '$lib/server/db/schema.ts';
import { eq, not } from 'drizzle-orm';

export const actions = {
	createpost: async function ({ locals, request }) {
		let user = locals.user;
		const formData = await request.formData();
		if (user) {
			try {
				await db.insert(posts).values({
					id: formData.get('id'),
					user_id: user.id,
					user_name: user.username,
					text: formData.get('content'),
					deleted: false,
					is_main_post: true,
					main_post_id: formData.get('id'),
				});
			} catch (e) {
				console.log('error when creating post', e);
			}
		}
	},
};
