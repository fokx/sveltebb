<script>
	let {
		post = $bindable(),
	} = $props();

</script>
<div class="post">
	{#if post}
		<span>{post.text}</span>
		<span style="font-size: x-small;">({post.user_id})</span>
	<form>TODO: add reply form</form>
	{:else}
		# post is null
	{/if}

</div>

