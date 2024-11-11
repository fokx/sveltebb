import { db } from '$lib/server/db/client.js';
import { todos } from '$lib/server/db/schema.ts';
import { desc, eq } from 'drizzle-orm';

/** @type {import('./$types').PageServerLoad} */
export async function load(event) {
	let cloud_posts;
	let user = event.locals.user;
	if (!user) {
		// return redirect(302, '/login');
	} else {
		cloud_posts = await db
			.select()
			.from(todos)
			.where(eq(todos.user_id, user.id))
			.orderBy(desc(todos.id));
	}
	return {
		user: event.locals.user,
		cloud_posts: cloud_posts
	};
}
