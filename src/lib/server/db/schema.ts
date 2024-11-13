import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { generateId } from '$lib/utils.js';
const common_timestamps = {
	created_at: integer({ mode: 'timestamp' }).$default(() => new Date()),
	deleted_at: integer({ mode: 'timestamp' }),
	updated_at: integer({ mode: 'timestamp' }).$onUpdate(() => new Date()),
};

const todo_extra_timestamps = {
	done_at: integer({ mode: 'timestamp' }),
	synced_at: integer({ mode: 'timestamp' })
};

export const todos = sqliteTable('todos', {
	id: text('id')
		.primaryKey()
		.notNull()
		.$default(() => generateId(64)),
	user_id: integer().notNull(),
	user_name: text({ length: 65535 }),
	email: text({ length: 65535 }),
	text: text({ length: 65535 }).notNull(),
	done: integer({ mode: 'boolean' }),
	deleted: integer({ mode: 'boolean' }),
	synced: integer({ mode: 'boolean' }),
	user_agent: text({ length: 65535 }),
	...common_timestamps,
	...todo_extra_timestamps
});
