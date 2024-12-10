import { readFileSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import OpenAI from 'openai';
import { object, parse, string } from 'valibot';
import { collection, embeddingFunction } from '../chroma/client.js';

loadEnvFile();

const env = parse(
	object({ OPEN_AI_API_KEY: string() }), //
	process.env
);

const openAi = new OpenAI({ apiKey: env.OPEN_AI_API_KEY });

const userInput = `기말과제 때문에 하루 종일 책상이랑 씨름했다. 해야 할 건 많고 시간은 부족하니까 괜히 더 조급해진다. 집중하려고 노력은 해봤지만, 금방 지쳐버렸다.

결국 마라탕을 시켰다. 맵고 뜨거운 국물을 먹으니 좀 정신이 드는 것 같았다. 얼얼한 맛에 스트레스가 잠깐 잊히는 느낌이었다. 

그래도 뭔가 허전해서 디저트로 케이크를 꺼냈다. 한 조각씩 먹으면서 조금 마음이 풀리는 기분이었다. 달콤한 게 이럴 땐 확실히 도움이 된다. 

과제가 끝나지 않은 건 여전하지만, 적어도 배부른 상태로 다시 시작할 수 있을 것 같다. 오늘도 이렇게 넘긴다.`;

const response0 = await openAi.chat.completions.create({
	model: 'gpt-4o-mini-2024-07-18',
	messages: [
		{
			role: 'system',
			content: '다음 내용을 최대한 간결하게 요약해줘'
		},
		{ role: 'user', content: userInput }
	]
});

const condensedUserInput = response0.choices[0]?.message.content;
if (!condensedUserInput) throw new Error();

const tracks = await collection.query({
	queryEmbeddings: await embeddingFunction.generate([condensedUserInput]),
	nResults: 10
});

const ids = tracks.ids[0];
const documents = tracks.documents[0];

if (!ids || !documents) throw new Error();

const systemPrompt = readFileSync(import.meta.dirname + '/prompt.txt', 'utf-8').replace(
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
${userInput}
---

AI:`
		}
	]
});

const rewrittenLyrics = response1.choices[0]?.message.content;
if (!rewrittenLyrics) throw new Error();
console.log(rewrittenLyrics); // TODO Show metadata.
