<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { createFormHelper } from 'svelte-form-enhanced';

	let { form } = $props();

	$effect(() => {
		if (form?.error) window.alert(form.error);
	});

	const f = createFormHelper({ updateOptions: { reset: false } });
</script>

<form use:enhance={f.submitFunction} method="post">
	<h1 class="text-xl font-bold">어떤 내용으로 개사할까요?</h1>
	<textarea name="input" required minlength="20"></textarea>
	<br />
	<button>제출하기</button>
</form>

{#if $page.status >= 400}
	<span>{form?.error || '알 수 없는 오류가 발생했습니다.'}</span>
{/if}

{#if form?.rewrittenLyric}
	<hr class="my-10" />
	<a
		href="https://vibe.naver.com/track/{form.rewrittenLyric.split('\n')[0]}"
		target="_blank"
		class="text-blue-700"
	>
		곡 들으러 가기
	</a>
	<pre>{form.rewrittenLyric}</pre>
{/if}
