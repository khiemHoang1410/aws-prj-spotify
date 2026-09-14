import { z } from "zod";
import { Song } from "./Song";

export const AiGeneratePromptSchema = z.object({
    prompt: z.string().min(2, "Yêu cầu phải có ít nhất 2 ký tự").max(300, "Yêu cầu không được vượt quá 300 ký tự"),
    limit: z.number().int().min(1).max(30).default(10).optional(),
});

export type AiGeneratePromptInput = z.infer<typeof AiGeneratePromptSchema>;

export interface AiCuratedPlaylist {
    name: string;
    description: string;
    mood: string;
    coverUrl: string;
    songIds: string[];
    songs: Song[];
    engineUsed: "gemini" | "local-nlp";
}
