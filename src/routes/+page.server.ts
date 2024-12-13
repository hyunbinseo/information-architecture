import { OPEN_AI_API_KEY } from '$env/static/private';
import { collection, embeddingFunction } from '$lib/index.server';
import { formDataToObject } from '@hyunbinseo/tools';
import { error, fail } from '@sveltejs/kit';
import * as cheerio from 'cheerio';
import OpenAI from 'openai';
import {
	array,
	digits,
	integer,
	minLength,
	nullable,
	number,
	object,
	parse,
	pipe,
	safeParse,
	startsWith,
	string,
	transform,
	trim,
	tuple,
	url
} from 'valibot';
import songs from './crawled.json';
import prompt from './prompt.txt?raw';

export const load = async () => {
	const response = await fetch('https://news.daum.net/');
	if (!response.ok) return { newsLinks: null };

	const $ = cheerio.load(await response.text());
	const anchorElements = $('ul.list_newsheadline2 > li > a');

	const links = new Array<Record<'title' | 'href' | 'img', string>>();

	for (const a of anchorElements) {
		const href = $(a).attr('href');
		const title = $(a).find('.tit_txt').text();
		const img = $(a).find('.img_g').attr('src');
		if (title && href && img) links.push({ title, href, img });
	}

	return {
		date: new Date(),
		newsLinks: links.length ? links : null
	};
};

const openAi = new OpenAI({ apiKey: OPEN_AI_API_KEY });

export const actions = {
	default: async ({ request }) => {
		const formData = await request.formData();

		const form = parse(
			object({
				news: nullable(pipe(string(), url(), startsWith('https://v.daum.net/v/'))),
				input: nullable(pipe(string(), trim(), minLength(1)))
			}),
			formDataToObject(formData, { get: ['news', 'input'] })
		);

		const rawInput = await (async () => {
			if (form.input) return form.input;
			if (!form.news) return null;

			const response = await fetch(form.news);
			if (!response.ok) return null;

			const $ = cheerio.load(await response.text());
			const paragraphElements = $('p[dmcf-ptype="general"]');

			let text = '';
			for (const p of paragraphElements) text += $(p).text();

			return text;
		})();

		if (!rawInput) return fail(400, { error: '입력값이 잘못되었습니다.' });

		const response0 = await openAi.chat.completions.create({
			model: 'gpt-4o-mini-2024-07-18',
			messages: [
				{
					role: 'system',
					content: '다음 내용을 최대한 간결하게 요약해줘. 요약하지 못하면 [불가]라고 네 글자로 답해'
				},
				{ role: 'user', content: rawInput }
			]
		});

		const condensedInput = parse(
			pipe(
				string(),
				transform((input) => (input === '[불가]' ? null : input))
			),
			response0.choices[0]?.message.content
		);

		const input = condensedInput || rawInput;

		const tracks = await collection.query({
			queryEmbeddings: await embeddingFunction.generate([input]),
			nResults: 10
		});

		const ids = tracks.ids[0];
		const documents = tracks.documents[0];

		if (!ids || !documents) error(500);

		const systemPrompt = prompt.replace(
			'--곡 정보--',
			documents
				.map(
					(lyric, index) =>
						`---
${ids[index]}
${
	!lyric
		? ''
		: lyric
				.split('\n')
				.map((line, index) => `${index + 1}. ${line}`)
				.join('\n')
}`
				)
				.join('\n\n')
		);

		const response1 = await openAi.chat.completions.create({
			model: 'chatgpt-4o-latest',
			messages: [
				{
					role: 'system',
					content: systemPrompt
				},
				{
					role: 'user',
					content: `인간: 안녕,

AI: 반갑습니다! 저는 개사가입니다. 어떤 내용으로 개사를 하면 될까요?

인간: 다음 내용을 요약해서 그 주제와 정서가 담기도록 개사해줘

---
${input}
---

AI: {
	"id": "`
				}
			]
		});

		const rewrittenLyric = (() => {
			const { content } = response1.choices[0]?.message;
			if (!content) return null;

			try {
				const parsed = safeParse(
					object({
						id: pipe(string(), digits()),
						range: tuple([
							pipe(number(), integer()), //
							pipe(number(), integer())
						]),
						original: array(string()),
						new: array(string())
					}),
					JSON.parse(content)
				);
				if (!parsed.success) return null;
				return parsed.output;
			} catch {
				return null;
			}
		})();

		if (!rewrittenLyric) return fail(400, { error: '개사에 실패했습니다.' });

		const song = songs[rewrittenLyric.id as keyof typeof songs];
		if (!song) return fail(400, { error: '개사에 실패했습니다.' });

		return { song, rewrittenLyric };
	}
};
