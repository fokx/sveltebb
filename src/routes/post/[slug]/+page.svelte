<script>
	import { dbDexie } from '$lib/db-dexie.js';
	import { liveQuery } from 'dexie';
	import Post from '$lib/components/post.svelte';


	let { data, sync_status = $bindable() } = $props();
	console.log('sync_status',sync_status);
	console.log(data.slug);

	let postLocal = liveQuery(() =>
		dbDexie.posts.filter(t => t.id === data.slug).first()
	);


</script>
{#if (!$postLocal)}
	<p>Post <code>{data.slug}</code> not found</p>
{:else}
	<Post post={$postLocal} data={data} sync_status={sync_status} indent={0}/>
{/if}

