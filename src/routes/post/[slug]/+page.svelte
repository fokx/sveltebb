<script>
	import { dbDexie } from '$lib/db-dexie.js';
	import Post from '$lib/components/post.svelte';

	let { data, sync_status = $bindable() } = $props();

	async function getPost() {
		try {
			return await dbDexie.posts.get(data.slug);
		} catch (e) {
			console.log('getPost error', e);
		}
	}

</script>

{#await getPost()}
	<p></p>
{:then post}
	<Post post={post} data={data} sync_status={sync_status} indent={0} />
{:catch error}
	<p style="color: red">Post <code>{data.slug}</code> not found with {error.message}</p>
{/await}



