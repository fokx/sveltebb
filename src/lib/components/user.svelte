<script>
	import { getUser } from '$lib/utils.js';
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
		} else {
			return PUBLIC_AVATAR_HOST + a_t;
		}
	}


</script>

<a href={href ?? `/user/${user_id}`} style="font-size: x-small;">
	<div class="user">
		{#await getUser(user_id)}
			user: {user_id}
		{:then user}
			<img src={getAvatarUrl(user)} alt="User Avatar" width="16" height="16" />
			{user?.username}
		{:catch error}
			<div style="color: red">{error.message} user: {user_id}</div>
		{/await}

	</div>


</a>
