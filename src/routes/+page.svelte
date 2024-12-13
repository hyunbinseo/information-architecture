<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { createFormHelper } from 'svelte-form-enhanced';

	let { data, form } = $props();

	let type = $state<'news' | 'custom'>('news');

	$effect(() => {
		if (!data.newsLinks) type = 'custom';
		if (form?.error) window.alert(form.error);
	});

	const f = createFormHelper({ updateOptions: { reset: false } });
</script>

<form
	use:enhance={f.submitFunction}
	method="post"
	class="mx-auto mt-8 flex w-full max-w-md flex-col gap-y-5 max-sm:px-4 md:mt-16"
>
	{#if !form?.rewrittenLyric}
		<h1 class="text-2xl font-bold">어떤 내용으로 개사할까요?</h1>
		<ul class="space-y-1">
			<li>
				<label>
					<input
						type="radio"
						name="type"
						value="news"
						required
						bind:group={type}
						disabled={!data.newsLinks}
					/>
					<span>
						{#if data.newsLinks}
							<span>이 시각 주요 뉴스</span>
							(<a href="https://news.daum.net/" target="_blank" class="text-blue-600">출처</a>)
						{:else}
							<span>뉴스를 불러오지 못했습니다.</span>
						{/if}
					</span>
				</label>
			</li>
			<li>
				<label>
					<input type="radio" name="type" value="custom" required bind:group={type} />
					<span>내용 직접 입력하기</span>
				</label>
			</li>
		</ul>
		<hr />
		{#if type === 'news' && data.newsLinks}
			<div class="flex justify-between">
				<span>{data.date.toLocaleTimeString()} 기준</span>
				<button type="button" onclick={() => invalidateAll()} class="w-fit">목록 갱신</button>
			</div>
			<ul class="space-y-5">
				{#each data.newsLinks as { title, href, img }, index (href)}
					<li>
						<label>
							<input type="radio" name="news" value={href} checked={!index} required />
							<!-- svelte-ignore a11y_missing_attribute -->
							<img src={img} width="112" height="72" />
							<span>{title}</span>
						</label>
					</li>
				{/each}
			</ul>
		{:else}
			<textarea
				name="input"
				class="w-full"
				placeholder="내용을 입력해 주세요."
				required
				minlength="40"
				rows="20"
			></textarea>
		{/if}
		<div class="sticky bottom-0 bg-white pb-5">
			<button
				class="w-full rounded bg-blue-600 p-2 text-center text-white disabled:animate-pulse disabled:bg-gray-600"
				disabled={f.state === 'submitting'}
			>
				{f.state === 'submitting' ? '개사 중입니다' : '개사하기'}
			</button>
		</div>
	{:else}
		<h1 class="text-2xl font-bold">이렇게 개사해봤어요:</h1>
		<ol start={form.rewrittenLyric.range[0]} class="space-y-5 text-lg">
			{#each form.rewrittenLyric.new as line, index}
				<li>
					<span class="text-gray-300">{form.rewrittenLyric.original[index]}</span>
					<br />
					<span class="font-bold">{line}</span>
				</li>
			{/each}
		</ol>
		<button
			type="button"
			onclick={() => (form = null)}
			class="w-full rounded bg-blue-600 p-2 text-center text-white"
		>
			다시 해보기
		</button>
	{/if}
</form>

<style lang="postcss">
	label:has(input[type='radio']) {
		@apply flex items-center gap-x-2;
	}
</style>
