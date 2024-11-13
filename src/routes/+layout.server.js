import { db } from '$lib/server/db/client.js';
import { posts } from '$lib/server/db/schema.ts';
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
			.from(posts)
			.orderBy(desc(posts.id));
	}
	return {
		user: event.locals.user,
		cloud_posts: cloud_posts
	};
}
