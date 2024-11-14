import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/client.js';
import { posts } from '$lib/server/db/schema.ts';
import { eq } from 'drizzle-orm';

/** @type {import('./$types').RequestHandler} */
export async function POST(event) {
	const user = event.locals.user;
	const arr = await event.request.json();
	try {
		if (user) {
			for (const a of arr) {
				let existing = await db.select().from(posts).where(eq(posts.id, a.id));
				if (existing.length === 0) {
					await db.insert(posts).values({
						id: a.id,
						user_id: user.id,
						text: a.text,
						deleted: a.deleted,
						is_main_post: a.is_main_post,
						main_post_id: a.main_post_id,
						reply_to: a?.reply_to,
					});
				} else {
					existing = existing[0];
					if (existing.user_id !== user.id) {
						throw new Error('you are not authorized to modify post not belonged to you');
					} else {
						await db
							.update(posts)
							.set({ text: a.text, done: a.done, delete: a.deleted })
							.where(eq(posts.id, a.id));
					}
				}
			}
		}
		return json({ message: 'success' }, { status: 200 });
	} catch (e) {
		return json({ message: e.message }, { status: 500 });
	}
}
