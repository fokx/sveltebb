import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/client.js';
import { posts } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';

/** @type {import('./$types').RequestHandler} */
export async function POST(event) {
	const req = await event.request;
	const cookies = event.cookies;
	const user = event.locals.user;
	if (user) {
		await db.delete(posts).where(eq(posts.user_id, user.id));
		return json({ message: 'success' }, { status: 200 });
	} else {
		return json({ message: 'user not logged in' }, { status: 403 });
	}
}
