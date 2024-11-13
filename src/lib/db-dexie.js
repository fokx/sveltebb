import Dexie from 'dexie';

export const dbDexie = new Dexie('sveltebb');

dbDexie.version(1).stores({
	todos:
		'&id, user_id, user_name, email, text, done, deleted, synced, user_agent, id_cloud, created_at, deleted_at, updated_at, done_at, synced_at'
});

