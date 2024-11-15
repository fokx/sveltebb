import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db/client.js';
import { posts } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { USER_ID_NOT_LOGGED_IN } from '$lib/utils.js';

export function load({ params }) {
	const slug = params.slug;

	return {
		slug
	};
}

