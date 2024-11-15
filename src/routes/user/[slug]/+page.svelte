<script>
	import PostList from '$lib/components/post-list.svelte';
	import { dbDexie } from '$lib/db-dexie.js';

	let { data } = $props();
	async function get_post_list() {
		if (Number.isInteger(Number(data.slug))) {
			let user = await dbDexie.users.get(Number(data.slug));
			if (user) {
				return await dbDexie.posts.filter(t => t.user_id === user.id).toArray();
			}
		}
	}

</script>
{#await get_post_list()}
	<p></p>
{:then user_post_list}
	<h2>Posts by user {data.slug}</h2>
	<PostList data={data} postList={user_post_list} show_author={false} />
{:catch error}
	<p style="color: red">User <code>{data.slug}</code> not found with {error.message}</p>
{/await}

