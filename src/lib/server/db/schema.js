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
	created_at: integer({ mode: 'timestamp' }),
	deleted_at: integer({ mode: 'timestamp' }),
	updated_at: integer({ mode: 'timestamp' }).$onUpdate(() => new Date())
};

export const posts = sqliteTable('posts', {
	id: text('id')
		.primaryKey()
		.notNull()
		.$default(() => generateId(64)),
	user_id: integer().notNull(),
	text: text({ length: 65535 }).notNull(),
	deleted: integer({ mode: 'boolean' }).notNull(),
	is_main_post: integer({ mode: 'boolean' }).notNull(),
	main_post_id: text({ length: 64 }).notNull(),
	reply_to_post_id: text({ length: 64 }),
	...common_timestamps
});

export const users = sqliteTable('users', {
	id: integer().primaryKey().notNull(),
	username: text({ length: 65535 }).notNull(),
	name: text({ length: 65535 }),
	admin: integer({ mode: 'boolean' }).notNull(),
	staged: integer({ mode: 'boolean' }).notNull(),
	active: integer({ mode: 'boolean' }).notNull(),
	moderator: integer({ mode: 'boolean' }).notNull(),
	trust_level: integer().notNull(),
	avatar_template: text({ length: 65535 }).notNull(),
	title: text({ length: 65535 }),
	groups: text({ length: 65535 }).notNull(),
	// "groups":["trust_level_0","trust_level_2","admins","trust_level_3","trust_level_4","staff","trust_level_1","INTL"],
	locale: text({ length: 65535 }),
	silenced_till: integer({ mode: 'timestamp' }),
	created_at: integer({ mode: 'timestamp' }),
	updated_at: integer({ mode: 'timestamp' })
});
