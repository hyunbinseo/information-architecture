import { writeFileSync } from 'node:fs';
import { array, number, object, optional, parse, safeParse, string } from 'valibot';
import albums from './albums.json' with { type: 'json' };

const AlbumSchema = object({
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
})

const LyricSchema = object({
	"response": object({
		"result": object({
			lyric: object({
				normalLyric: optional(object({ text: string() })),
				syncLyric: optional(object({
					startTimeIndex: array(number()),
					endTimeIndex: array(number()),
					contents: array(object({ text: array(string()) })),
				})),
			})
		})
	})
})

for await (const { albumId, albumTitle, releaseDate } of albums) {
	const response = await fetch(`https://apis.naver.com/vibeWeb/musicapiweb/album/${albumId}/tracks?start=1&display=1000`, {
		headers: { 'Accept': 'application/json' }
	});

	if (!response.ok) {
		console.error(`Failed to fetch album ${albumId}`);
		continue
	};

	const album = parse(AlbumSchema, await response.json())

	for await (const { trackId, trackTitle, discNumber, trackNumber } of album.response.result.tracks) {
		const response = await fetch(`https://apis.naver.com/vibeWeb/musicapiweb/vibe/v4/lyric/${trackId}`, {
			headers: { 'Accept': 'application/json' }
		})

		if (!response.ok) {
			console.error(`Failed to fetch lyric for track ${trackId}`);
			continue
		}

		const parsedLyric = safeParse(LyricSchema, await response.json())
		if (!parsedLyric.success) {
			// Tracks might not have lyrics.
			// e.g. https://apis.naver.com/vibeWeb/musicapiweb/vibe/v4/lyric/2122791
			// 2122791, 2005838, 2005841, 2005845, 2005846, 1903124, 1903129, 1903130
			console.error(`Failed to parse lyric for track ${trackId}`);
			continue
		}

		writeFileSync(`${import.meta.dirname}/tracks/${trackId}.json`, JSON.stringify({
			albumTitle,
			releaseDate,
			trackTitle,
			discNumber,
			trackNumber,
			lyric: parsedLyric.output
			,
		}, null, '\t'))
	}
}

