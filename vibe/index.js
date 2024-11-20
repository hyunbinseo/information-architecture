import { writeFileSync } from 'node:fs';
import * as prettier from "prettier";
import { array, length, number, object, parse, pipe, safeParse, string, transform } from 'valibot';
import younhaAlbums from './younha.json' with { type: 'json' };

const TracksSchema = pipe(
	object({
		"response": object({
			"result": object({
				tracks: array(object({
					trackId: number(),
					trackTitle: string(),
					discNumber: number(),
					trackNumber: number(),
				}))
			})
		})
	}),
	transform((v) => v.response.result.tracks)
)

export const LyricSchema = pipe(
	object({
		"response": object({
			"result": object({
				lyric: pipe(
					object({
						syncLyric: pipe(
							object({
								startTimeIndex: array(number()),
								endTimeIndex: array(number()),
								contents: pipe(
									array(object({ text: array(string()) })),
									length(1),

								),
							}),
							transform(({ startTimeIndex, endTimeIndex, contents }) => ({
								timeIndex: startTimeIndex.map((startTime, i) => [startTime, endTimeIndex[i]]),
								text: contents[0].text.join('\n')
							}))
						)
					}),
					transform(({ syncLyric }) => (syncLyric))
				)
			})
		})
	}),
	transform((v) => v.response.result.lyric)
)

for await (const { albumId, albumTitle, releaseDate } of younhaAlbums) {
	const response = await fetch(`https://apis.naver.com/vibeWeb/musicapiweb/album/${albumId}/tracks?start=1&display=1000`, {
		headers: { 'Accept': 'application/json' }
	});

	if (!response.ok) continue;

	const tracks = parse(TracksSchema, await response.json())

	for await (const { trackId, trackTitle, discNumber, trackNumber } of tracks) {
		if (trackTitle.toLowerCase().includes('inst')) continue;

		const response = await fetch(`https://apis.naver.com/vibeWeb/musicapiweb/vibe/v4/lyric/${trackId}`, {
			headers: { 'Accept': 'application/json' }
		})

		if (!response.ok) continue;

		const parsedLyric = safeParse(LyricSchema, await response.json())
		if (!parsedLyric.success) {
			// Tracks might not have lyrics.
			// e.g. https://apis.naver.com/vibeWeb/musicapiweb/vibe/v4/lyric/2122791
			// 2122791, 2005838, 2005841, 2005845, 2005846, 1903124, 1903129, 1903130
			console.error(`Failed to parse lyric for track ${trackId}`);
			continue
		}

		writeFileSync(`${import.meta.dirname}/tracks/${trackId}.json`, await prettier.format(
			JSON.stringify({
				albumTitle,
				releaseDate,
				trackTitle,
				discNumber,
				trackNumber,
				lyric: parsedLyric.output
			}),
			{ parser: 'json', useTabs: true }
		))
	}
}
