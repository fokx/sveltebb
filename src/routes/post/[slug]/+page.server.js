import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db/client.js';
import { posts } from '$lib/server/db/schema.ts';
import { eq } from 'drizzle-orm';
import { USER_ID_NOT_LOGGED_IN } from '$lib/utils.js';

export function load({ params }) {
	const slug = params.slug;

	return {
		slug
	};
}

export const actions = {
	create_reply: async function ({ locals, request }) {
		let user = locals.user;
		const formData = await request.formData();
		let user_id = user ? user.id : USER_ID_NOT_LOGGED_IN;
		console.log(formData.get('reply_to_post_id'));
		console.log(formData.get('id'));
		console.log(formData.get('main_post_id'));
		console.log(formData.get('content'));
		try {
			await db.insert(posts).values({
				id: formData.get('id'),
				user_id: user_id,
				text: formData.get('content'),
				deleted: false,
				is_main_post: false,
				main_post_id: formData.get('main_post_id'),
				reply_to_post_id: formData.get('reply_to_post_id'),
			});
		} catch (e) {
			console.log('error when creating post', e);
		}
	}
};
