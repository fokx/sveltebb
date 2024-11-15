import { db } from '$lib/server/db/client.js';
import { posts } from '$lib/server/db/schema.js';
import { USER_ID_NOT_LOGGED_IN } from '$lib/utils.js';

export const actions = {
	create_post: async function ({ locals, request }) {
		let user = locals.user;
		const formData = await request.formData();
		let user_id = user ? user.id : USER_ID_NOT_LOGGED_IN;
		try {
			await db.insert(posts).values({
				id: formData.get('id'),
				user_id: user_id,
				text: formData.get('content'),
				deleted: false,
				is_main_post: true,
				main_post_id: formData.get('id')
			});
		} catch (e) {
			console.log('error when creating post', e);
		}
	}
};
