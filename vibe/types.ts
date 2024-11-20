import { InferOutput } from 'valibot';
import { artists, type LyricSchema } from './index';

export type Track = {
	artistId: keyof typeof artists;
	albumTitle: string;
	releaseDate: string;
	trackTitle: string;
	discNumber: number;
	trackNumber: number;
	trackId: number;
	lyric: InferOutput<typeof LyricSchema>;
};
