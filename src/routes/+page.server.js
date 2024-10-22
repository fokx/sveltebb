import { lucia } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db/client.js';
import { todos } from '$lib/server/db/schema.ts';
import { eq, not } from 'drizzle-orm';

export const actions = {
	logout: async (event) => {
		if (!event.locals.session) {
			return fail(401);
		}
		await lucia.invalidateSession(event.locals.session.id);
		const sessionCookie = lucia.createBlankSessionCookie();
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});
		// return redirect(302, '/logout');
	},
	login: async (event) => {
		await redirect(302, '/login/github');
	},
	createpost: async function ({ locals, request }) {
		let user = locals.user;
		const formData = await request.formData();
		if (user) {
			const newPost = await db.insert(todos).values({
				user_source: 'github',
				username: user.username,
				text: formData.get('content'),
				done: false,
				deleted: false,
				synced: true,
				user_agent: request.headers['user-agent']
			});
		}
	},
	deleteTodo: async function ({ locals, request }) {
		let user = locals.user;
		const formData = await request.formData();
		if (user) {
			// soft delete
			await db
				.update(todos)
				.set({ deleted: true })
				.where(eq(todos.id, formData.get('id')));
			// await db.delete(todos).where(eq(todos.id, formData.get('id')));
		}
	},
	editTodo: async function ({ locals, request }) {
		let user = locals.user;
		const formData = await request.formData();
		if (user) {
			await db
				.update(todos)
				.set({ text: formData.get('new_text') })
				.where(eq(todos.id, formData.get('id')));
		}
	},
	toggleTodo: async function ({ locals, request }) {
		let user = locals.user;
		const formData = await request.formData();
		const isChecked = formData.get('myCheckbox') === 'true';
		console.log('isChecked', isChecked);
		let prev_done = formData.get('prev_done');
		console.log('prev_done', prev_done);
		if (user) {
			await db
				.update(todos)
				.set({
					done: not(todos.done),
				})
				.where(eq(todos.id, formData.get('id')));
;
		}
	}
};
