import { OPEN_AI_API_KEY } from '$env/static/private';
import { collection, embeddingFunction } from '$lib/index.server';
import { error, fail } from '@sveltejs/kit';
import OpenAI from 'openai';
import { minLength, parse, pipe, safeParse, string, transform, trim } from 'valibot';
import prompt from './prompt.txt?raw';

const openAi = new OpenAI({ apiKey: OPEN_AI_API_KEY });

export const actions = {
	default: async ({ request }) => {
		const response = await request.formData();

		const parsedInput = safeParse(
			pipe(string(), trim(), minLength(1)), //
			response.get('input')
		);

		if (!parsedInput.success) return fail(400, { error: '입력값이 잘못되었습니다.' });

		const response0 = await openAi.chat.completions.create({
			model: 'gpt-4o-mini-2024-07-18',
			messages: [
				{
					role: 'system',
					content: '다음 내용을 최대한 간결하게 요약해줘. 요약하지 못하면 [불가]라고 네 글자로 답해'
				},
				{ role: 'user', content: parsedInput.output }
			]
		});

		const condensedInput = parse(
			pipe(
				string(),
				transform((input) => (input === '[불가]' ? null : input))
			),
			response0.choices[0]?.message.content
		);

		const input = condensedInput || parsedInput.output;

		const tracks = await collection.query({
			queryEmbeddings: await embeddingFunction.generate([input]),
			nResults: 10
		});

		const ids = tracks.ids[0];
		const documents = tracks.documents[0];
		const metadatas = tracks.metadatas[0];

		if (!ids || !documents || !metadatas) error(500);

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

인간: 다음 내용을 요약해서 그 주제와 정서가 담기도록 개사해줘. 개사하지 못하면 [불가]라고 네 글자로 답해.

---
${input}
---

AI:`
				}
			]
		});

		const rewrittenLyric = parse(
			pipe(
				string(),
				transform((input) => (input === '[불가]' ? null : input))
			),
			response1.choices[0]?.message.content
		);

		if (!rewrittenLyric) return fail(400, { error: '개사에 실패했습니다.' });

		return { rewrittenLyric };
	}
};
