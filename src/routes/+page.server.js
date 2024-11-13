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
					done: false,
					deleted: false,
					synced: true,
					user_agent: request.headers['user-agent']
				});
			} catch (e) {
				console.log('error when creating post', e);
			}
		}
	},
	deletePost: async function ({ locals, request }) {
		let user = locals.user;
		const formData = await request.formData();
		if (user) {
			// soft delete
			await db
				.update(posts)
				.set({ deleted: true })
				.where(eq(posts.id, formData.get('id')));
			// await db.delete(posts).where(eq(posts.id, formData.get('id')));
		}
	},
	deleteAllCompleted: async function ({ locals, request }) {
		let user = locals.user;
		const formData = await request.formData();
		if (user) {
			// soft delete
			await db.update(posts).set({ deleted: true }).where(eq(posts.done, true));
		}
	},
	editPost: async function ({ locals, request }) {
		let user = locals.user;
		const formData = await request.formData();
		if (user && formData.get('new_text')) {
			await db
				.update(posts)
				.set({ text: formData.get('new_text') })
				.where(eq(posts.id, formData.get('id')));
		}
	},
	togglePost: async function ({ locals, request }) {
		let user = locals.user;
		const formData = await request.formData();
		// const isChecked = formData.get('myCheckbox') === 'on';
		// let prev_done = formData.get('prev_done');
		if (user) {
			await db
				.update(posts)
				.set({
					done: not(posts.done)
				})
				.where(eq(posts.id, formData.get('id')));
		}
	}
};
