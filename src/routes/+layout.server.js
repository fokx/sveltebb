import { db } from '$lib/server/db/client.js';
import { posts, users } from '$lib/server/db/schema.js';
import { desc, asc } from 'drizzle-orm';

/** @type {import('./$types').PageServerLoad} */
export async function load(event) {
	let cloud_posts, cloud_users;
	let user = event.locals.user;
	if (!user) {
		// return redirect(302, '/login');
	} else {
		cloud_posts = await db.select().from(posts).orderBy(desc(posts.id));
		cloud_users = await db.select().from(users).orderBy(asc(users.id));
	}
	return {
		user: event.locals.user,
		cloud_posts: cloud_posts,
		cloud_users: cloud_users
	};
}
