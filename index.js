import { env, loadEnvFile } from "node:process";
import OpenAI from 'openai';
import { collection, embeddingFunction } from "./chroma/client.js";

loadEnvFile('.env');

if (!env.OPEN_AI_API_KEY) throw new Error('OPEN_AI_API_KEY is required');

const text = '보고 싶은데 볼 수가 없어'

const tracks = await collection.query({
	queryEmbeddings: await embeddingFunction.generate([text]),
	nResults: 10,
});

const openAi = new OpenAI({ apiKey: env.OPEN_AI_API_KEY });


const response = await openAi.chat.completions.create({
	model: 'gpt-4o-mini',
	messages: [
		{
			role: 'system',
			content: '당신은 윤하의 작사가입니다. 다음 [참고할 가사]만을 활용해 주어진 문장을 윤하의 가사처럼 바꾸세요.',
		},
		{
			role: 'user',
			content: '[참고할 가사]\n\n'
				+ tracks.documents.map(([lyric], index) => `${index + 1}번 가사: ${lyric}\n\n곡 정보: ${tracks.metadatas[index]}`).join('\n\n---\n\n')
				+ '\n\n'
				+ '다음 문장을 윤하의 가사처럼 바꿔주세요. 참고한 albumTitle 문자열, trackTitle 문자열, 그리고 참고한 가사의 부분을 함께 알려주세요. 기존 가사와 비슷할 수록 좋습니다:'
				+ text
		}
	]
})

console.log(response.choices[0].message.content)
