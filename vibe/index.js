import { writeFileSync } from 'node:fs';
import * as prettier from "prettier";
import { array, length, number, object, parse, pipe, safeParse, string, transform } from 'valibot';

const AlbumsSchema = pipe(
	object({
		"response": object({
			"result": object({
				albums: array(object({
					albumId: number(),
					albumTitle: string(),
					releaseDate: pipe(
						string(),
						transform((yyyyMd) => {
							const [year, month, day] = yyyyMd.split('.').map(Number);
							return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
						})
					),
				}))
			})
		})
	}),
	transform((v) => v.response.result.albums)
)

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

export const artists = /** @type {const} */ ({
	112579: '아이유(IU)',
	15649: '윤하',
	243100: 'AKMU(악뮤)',
})


/** @type {Array<keyof typeof artists>} */
const artistIds = [
	112579,
	15649,
	243100
]

for await (const artistId of new Set(artistIds)) {
	/** @type {import('valibot').InferOutput<typeof AlbumsSchema>} */
	const allAlbums = []

	for await (const type of ['REGULAR', 'SINGLE_AND_EP']) {
		const response = await fetch(`https://apis.naver.com/vibeWeb/musicapiweb/v3/musician/artist/${artistId}/albums?start=1&display=1000&type=${type}&sort=newRelease`, {
			headers: { 'Accept': 'application/json' }
		});

		if (!response.ok) continue;

		const albums = parse(AlbumsSchema, await response.json())
		albums.forEach((album) => allAlbums.push(album))
	}

	writeFileSync(`${import.meta.dirname}/artists/${artistId}.json`, JSON.stringify(allAlbums, null, '\t'))

	for await (const { albumId, albumTitle, releaseDate } of allAlbums) {
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

			/** @type {import('./types').Track} */
			const track = {
				artistId,
				albumTitle,
				releaseDate,
				trackTitle,
				discNumber,
				trackNumber,
				trackId,
				lyric: parsedLyric.output
			}

			writeFileSync(`${import.meta.dirname}/tracks/${trackId}.json`, await prettier.format(
				JSON.stringify(track),
				{ parser: 'json', useTabs: true }
			))
		}
	}
}
