<script>
	import { dbDexie } from '$lib/db-dexie.js';
	import Post from '$lib/components/post.svelte';

	let { data, sync_status = $bindable() } = $props();

</script>

{#await dbDexie.posts.get(data.slug)}
	<p>loading post {data.slug}..</p>
{:then post}
	{#if post}
		{#if !post.is_main_post}
			<div>
				<a style="white-space: nowrap;" href={"/post/"+post.main_post_id}>Back to main post {post.main_post_id}</a>
			</div>
		{/if}
		<Post post={post} data={data} sync_status={sync_status} indent={0} />

	{:else}
		<p style="color: red">Post <code>{data.slug}</code> not found</p>
	{/if}
{:catch error}
	<p style="color: red">Post <code>{data.slug}</code> not found with {error.message}</p>
{/await}



