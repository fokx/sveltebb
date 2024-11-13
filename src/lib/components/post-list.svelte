<script>
	import { fly, slide } from 'svelte/transition';

	let {
		postList = $bindable(),
		user,
		isDeletedListPage = false,
		show_author=true,
		sync_status = $bindable()
	} = $props();
	let postListSorted = $derived(postList ? postList.toSorted((b, a) => new Date(a.created_at) - new Date(b.created_at)) : []);
	let checked = false;
	let new_text;

</script>

<ul class="posts">
	{#if postListSorted?.length}
		{#each postListSorted as post, index (post.id)}
			<!--			<li transition:fade={{  duration: 100}}>-->
			<li in:fly={{ y: 20 }} out:slide>

				<span>{post.text}
					{#if show_author}
						<span style="font-size: x-small;">({post.user_name})</span>
					{/if}
				</span>
				<!--<input class:checked={post.done} type="text" name="tmp" value={post.text}/>-->

			</li>
		{/each}
	{/if}
</ul>
