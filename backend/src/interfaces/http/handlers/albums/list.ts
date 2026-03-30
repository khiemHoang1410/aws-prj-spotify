import { makeHandler } from "../../middlewares/makeHandler";
import { AlbumService } from "../../../../application/services/AlbumService";
import { AlbumRepository } from "../../../../infrastructure/database/AlbumRepository";
import { ArtistRepository } from "../../../../infrastructure/database/ArtistRepository";
import { SongRepository } from "../../../../infrastructure/database/SongRepository";
import { config } from "../../../../config";

const albumService = new AlbumService(new AlbumRepository(), new ArtistRepository(), new SongRepository());

export const handler = makeHandler(async (_body, _params, query) => {
    const artistName = query.artist as string | undefined;
    const artistId = query.artistId as string | undefined;

    if (artistId) {
        return albumService.getByArtistId(artistId);
    }

    if (artistName) {
        return albumService.getByArtistName(artistName);
    }

    const limit = Math.min(Number(query.limit) || config.defaultPageSize, config.maxPageSize);
    const cursor = query.cursor as string | undefined;
    return albumService.getAllAlbums().then(r =>
        r.success ? { success: true, data: { items: r.data, nextCursor: undefined } } : r
    );
});
