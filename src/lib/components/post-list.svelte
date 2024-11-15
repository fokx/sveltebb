<script>
	import { fly, slide } from 'svelte/transition';
	import { GetEnumName, SetOnlineIndicator, SyncStatus, USER_ID_NOT_LOGGED_IN, GetUserName } from '$lib/utils.js';

	let {
		data = $bindable(),
		postList = $bindable(),
		user,
		show_author = true,
	} = $props();
	let postListSorted = $derived(postList ? postList.toSorted((b, a) => new Date(a.created_at) - new Date(b.created_at)) : []);
	let cloud_users = $derived(data.cloud_users);
	let checked = false;
	let new_text;

</script>

<ul class="posts">
	{#if postListSorted?.length}
		{#each postListSorted as post, index (post.id)}
			<li in:fly={{ y: 20 }} out:slide>
				<a href={'/post/'+post.id} class="post-link">
       <span>{post.text}
				 {#if show_author}
         <span style="font-size: x-small;">({GetUserName(cloud_users, post.user_id)})</span>
        {/if}
       </span>
				</a>
			</li>
		{/each}
	{/if}
</ul>

<style>
    .post-link {
        display: block;
        width: 100%;
        height: 100%;
        text-decoration: none;
        color: inherit;
    }
</style>