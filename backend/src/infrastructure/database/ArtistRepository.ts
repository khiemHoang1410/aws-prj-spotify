import { BaseRepository } from "./BaseRepository";
import { Artist } from "../../domain/entities/Artist";

export class ArtistRepository extends BaseRepository<Artist> {
    protected readonly entityPrefix = "ARTIST";
}  