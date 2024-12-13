import { array, length, number, object, pipe, string, transform } from 'valibot';

export const AlbumsSchema = pipe(
	object({
		response: object({
			result: object({
				albums: array(
					object({
						albumId: number(),
						albumTitle: string(),
						releaseDate: pipe(
							string(),
							transform((yyyyMd) => {
								const [year, month, day] = yyyyMd.split('.').map(Number);
								return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
							})
						)
					})
				)
			})
		})
	}),
	transform((v) => v.response.result.albums)
);

export const TracksSchema = pipe(
	object({
		response: object({
			result: object({
				tracks: array(
					object({
						trackId: number(),
						trackTitle: string(),
						discNumber: number(),
						trackNumber: number()
					})
				)
			})
		})
	}),
	transform((v) => v.response.result.tracks)
);

export const LyricSchema = pipe(
	object({
		response: object({
			result: object({
				lyric: pipe(
					object({
						syncLyric: pipe(
							object({
								startTimeIndex: array(number()),
								endTimeIndex: array(number()), // can be an empty array
								contents: pipe(array(object({ text: array(string()) })), length(1))
							}),
							transform(({ startTimeIndex, endTimeIndex, contents }) => ({
								timeIndex: startTimeIndex.map(
									/** @returns {[number, number | null]} */
									(startTime, i) => [startTime, endTimeIndex.at(i) || null]
								),
								text: contents[0]?.text.join('\n') || null
							}))
						)
					}),
					transform(({ syncLyric }) => syncLyric)
				)
			})
		})
	}),
	transform((v) => v.response.result.lyric)
);
