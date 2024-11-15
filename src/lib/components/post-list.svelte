<script>
	import { fly, slide } from 'svelte/transition';
	import User from '$lib/components/user.svelte';

	let {
		data = $bindable(),
		postList = $bindable(),
		show_author = true
	} = $props();
	let postListSorted = $derived(postList ? postList.toSorted((a, b) => a.created_at - b.created_at) : []);
	let checked = false;
	let new_text;

</script>

<ul class="posts">
	{#if postListSorted}
		{#each postListSorted as post, index (post.id)}
			<li in:fly={{ y: 20 }} out:slide>
				<a href={'/post/'+post.id} class="post-link">
       <span>{post.text}
				 {#if show_author}
						<User data={data} user_id={post.user_id} />
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