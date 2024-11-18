import { InferOutput } from 'valibot';
import type { LyricSchema } from './index';

export type Track = {
	albumTitle: string;
	releaseDate: string;
	trackTitle: string;
	discNumber: number;
	trackNumber: number;
	lyric: InferOutput<typeof LyricSchema>;
};
