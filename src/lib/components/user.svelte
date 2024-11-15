<script>
	import { dbDexie } from '$lib/db-dexie.js';
	import { PUBLIC_AVATAR_DEFAULT_URL, PUBLIC_AVATAR_HOST } from '$env/static/public';

	let {
		data = $bindable(),
		user_id = $bindable(),
		href = $bindable(null)
	} = $props();
	let cloud_users = $derived(data.cloud_users);

	function getAvatarUrl(user) {
		if (user === null || user === undefined) {
			return PUBLIC_AVATAR_DEFAULT_URL;
		}
		let a_t = user.avatar_template;
		if (a_t === null || a_t === undefined) {
			return PUBLIC_AVATAR_DEFAULT_URL;
		}
		// https://xjtu.app/user_avatar/xjtu.app/aicnal/%7Bsize%7D/9379_2.png
		if (a_t.startsWith('/letter_avatar_proxy')) {
			return PUBLIC_AVATAR_HOST + a_t.replace('{size}', '16');
		} else if (a_t.includes('{size}')) {
			return PUBLIC_AVATAR_HOST + a_t.replace('{size}', '288');
		} else{
			return PUBLIC_AVATAR_HOST + a_t;
		}
	}

	async function getUser(user_id) {
		try {
			return await dbDexie.users.get(parseInt(user_id));
		} catch (e) {
			console.log('getUser error', user_id, e);
		}
	}

</script>

<a href={href ?? `/user/${user_id}`} style="font-size: x-small;">
	<!--{#await getUserName(user_id)}-->
	<!--	{/await}-->
	{#await getUser(user_id)}
		<p>user: {user_id}</p>
	{:then user}
		<p>
			<img src={getAvatarUrl(user)} alt="User Avatar" width="16" height="16" />
			{user?.username}!
		</p>
	{:catch error}
		<p style="color: red">{error.message} user: {user_id}</p>
	{/await}
</a>
