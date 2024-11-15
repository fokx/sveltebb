import Dexie from 'dexie';

export const dbDexie = new Dexie('sveltebb');

dbDexie.version(1).stores({
	posts:
		'&id, user_id, text, deleted, is_main, main_post_id, reply_to_post_id, created_at, deleted_at, updated_at',
	users:
		'&id, username, name, admin, staged, active, moderator, trust_level, avatar_template, title, groups, locale, silenced_till, created_at, updated_at, deleted_at'
});
