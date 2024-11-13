import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { generateRandomString } from '@oslojs/crypto/random';

const random = {
	read(bytes) {
		crypto.getRandomValues(bytes);
	}
};

function generateId(length) {
	const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
	return generateRandomString(random, alphabet, length);
}

const common_timestamps = {
	created_at: integer({ mode: 'timestamp' }).$default(() => new Date()),
	deleted_at: integer({ mode: 'timestamp' }),
	updated_at: integer({ mode: 'timestamp' }).$onUpdate(() => new Date())
};



export const posts = sqliteTable('posts', {
	id: text('id')
		.primaryKey()
		.notNull()
		.$default(() => generateId(64)),
	user_id: integer().notNull(),
	user_name: text({ length: 65535 }),
	text: text({ length: 65535 }).notNull(),
	deleted: integer({ mode: 'boolean' }),
	is_main: integer({ mode: 'boolean' }),
	main_post_id: text({ length: 64 }),
	reply_to_post_id: text({ length: 64 }),
	...common_timestamps
});
