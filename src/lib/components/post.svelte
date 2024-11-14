<script>
	let {
		post = $bindable(),
	} = $props();

</script>
<div class="post">
	{#if post}

		<span>{post.text}</span>
		<span style="font-size: x-small;">({post.user_id})</span>

	{:else}
		<p style="color: red">error: post {post} is null</p>
	{/if}

</div>

