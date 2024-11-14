<script>
	let { children, data } = $props();
	let user = $derived(data.user);
	let postListCloud = $derived(data.cloud_posts);
</script>
<style>
    @import '$lib/styles.css';
</style>
<nav class="title">
	<a href="/" style="display: inline;">SvelteBB</a>
	{#if user}
		<span style="display: inline; margin-left: 15px;">logged in as: <a
			href="/my-posts">{user.id}</a> </span>
	{:else}
		<span>You are a guest.</span>
<!--		<a href="/login" style="display: inline; margin-left: 15px;">login</a>-->
	{/if}

</nav>
{@render children()}
