import os
import glob
from django.contrib.auth.hashers import make_password
from api.models import Users, Artists, Albums, Genres, Songs, SongGenres, Video, VideoGenres, UserPlaylists, UserPlaylistSongs, Likes, ListeningHistory, AdminPlaylists, AdminPlaylistSongs
from django.conf import settings
import logging
from django.db import transaction, DatabaseError
from mutagen.mp3 import MP3
from mutagen.mp4 import MP4

# Thiết lập logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)
logger.handlers = [logging.StreamHandler()]

# Đường dẫn đến thư mục static
BASE_DIR = settings.BASE_DIR
STATIC_TRACK_PATH = os.path.join(BASE_DIR, 'staticfiles', 'track')
STATIC_PLAYLIST_PATH = os.path.join(BASE_DIR, 'staticfiles', 'playlist')

# Xóa toàn bộ dữ liệu cũ
def clear_database():
    try:
        with transaction.atomic():
            Users.objects.all().delete()
            Artists.objects.all().delete()
            Albums.objects.all().delete()
            Genres.objects.all().delete()
            Songs.objects.all().delete()
            Video.objects.all().delete()
            UserPlaylists.objects.all().delete()
            AdminPlaylists.objects.all().delete()
            Likes.objects.all().delete()
            ListeningHistory.objects.all().delete()
        logger.info("Cleared all existing data.")
    except DatabaseError as e:
        logger.error(f"Error clearing database: {str(e)}")
        raise

# 1. Thêm Users
def add_users():
    try:
        with transaction.atomic():
            user1 = Users.objects.create(
                username="john_doe",
                email="john@example.com",
                password=make_password("password123"),
                full_name="John Doe",
                avatar_url="https://example.com/john.jpg",
                is_active=True
            )
            user2 = Users.objects.create(
                username="jane_smith",
                email="jane@example.com",
                password=make_password("password456"),
                full_name="Jane Smith",
                avatar_url="https://example.com/jane.jpg",
                is_active=True
            )
        logger.info(f"Added Users: {Users.objects.count()}")
    except DatabaseError as e:
        logger.error(f"Error adding users: {str(e)}")
        raise

# 2. Thêm Genres
def add_genres():
    try:
        with transaction.atomic():
            genre1 = Genres.objects.create(
                genre_name="Rock",
                description="A genre of popular music that originated in the 1950s."
            )
            genre2 = Genres.objects.create(
                genre_name="Pop",
                description="A genre of popular music that originated in the 20th century."
            )
        logger.info(f"Added Genres: {Genres.objects.count()}")
    except DatabaseError as e:
        logger.error(f"Error adding genres: {str(e)}")
        raise

# 3. Thêm Artists, Albums, Songs và Videos từ static/track
def add_artists_albums_songs_videos():
    content_created_from_files = False
    if os.path.exists(STATIC_TRACK_PATH):
        try:
            with transaction.atomic():
                for artist_folder in os.listdir(STATIC_TRACK_PATH):
                    artist_path = os.path.join(STATIC_TRACK_PATH, artist_folder)
                    if not os.path.isdir(artist_path):
                        logger.debug(f"Skipping non-directory: {artist_folder}")
                        continue

                    # Tạo hoặc lấy Artist
                    artist_name = artist_folder.replace('_', ' ').title()
                    background_file = glob.glob(os.path.join(artist_path, '*_background.*'))
                    image_file = glob.glob(os.path.join(artist_path, '*_image.*'))

                    artist, created = Artists.objects.get_or_create(
                        artist_name=artist_name,
                        defaults={
                            'bio': f"{artist_name} is a renowned artist.",
                            'image_url': str(image_file[0]).replace(str(BASE_DIR), '') if image_file else None,
                            'background': str(background_file[0]).replace(str(BASE_DIR), '') if background_file else None,
                            'nationality': "Unknown",
                            'is_active': True
                        }
                    )
                    logger.info(f"{'Created' if created else 'Retrieved'} Artist: {artist_name}")

                    # Tạo Default Album cho các bài hát không thuộc album cụ thể
                    default_album, created = Albums.objects.get_or_create(
                        album_name=f"{artist_name} Singles",
                        artist=artist,
                        defaults={
                            'album_title': f"{artist_name} Singles",
                            'release_date': "2020-01-01",
                            'cover_url': str(image_file[0]).replace(str(BASE_DIR), '') if image_file else None,
                            'total_songs': 0,
                            'total_duration': 0
                        }
                    )
                    logger.info(f"{'Created' if created else 'Retrieved'} Default Album: {default_album.album_name}")

                    # Xử lý các folder album
                    album_path = os.path.join(artist_path, 'album')
                    albums = [default_album]
                    if os.path.exists(album_path):
                        for album_folder in os.listdir(album_path):
                            sub_album_path = os.path.join(album_path, album_folder)
                            if not os.path.isdir(sub_album_path):
                                continue
                            album_name = album_folder.replace('_', ' ').title()
                            album_cover = glob.glob(os.path.join(sub_album_path, 'album_*.png')) or glob.glob(os.path.join(sub_album_path, 'album_*.jpg'))
                            album, created = Albums.objects.get_or_create(
                                album_name=album_name,
                                artist=artist,
                                defaults={
                                    'album_title': album_name,
                                    'release_date': "2020-01-01",
                                    'cover_url': str(album_cover[0]).replace(str(BASE_DIR), '') if album_cover else None,
                                    'total_songs': 0,
                                    'total_duration': 0
                                }
                            )
                            logger.info(f"{'Created' if created else 'Retrieved'} Album: {album_name}")
                            albums.append(album)

                    # Xử lý tất cả file mp3 trong thư mục artist (bao gồm cả ngoài và trong album)
                    mp3_files = []
                    mp3_files.extend(glob.glob(os.path.join(artist_path, '*.mp3')))
                    if os.path.exists(album_path):
                        mp3_files.extend(glob.glob(os.path.join(album_path, '**', '*.mp3'), recursive=True))

                    for mp3_file in mp3_files:
                        song_title = os.path.basename(mp3_file).replace('.mp3', '').replace('_', ' ').title()
                        mp3_path = mp3_file

                        # Đọc file mp3
                        audio_data = None
                        duration = 180
                        try:
                            with open(mp3_path, 'rb') as f:
                                audio_data = f.read()
                            logger.debug(f"Read mp3 file: {mp3_path}")
                            audio = MP3(mp3_path)
                            duration = int(audio.info.length)
                            logger.debug(f"Duration of {song_title}: {duration} seconds")
                        except Exception as e:
                            logger.warning(f"Failed to read mp3 file or get duration {mp3_path}: {str(e)}")
                            continue

                        # Tìm file vinyl và image
                        song_basename = os.path.basename(mp3_file).replace('.mp3', '')
                        vinyl_file = glob.glob(os.path.join(os.path.dirname(mp3_file), f"{song_basename}_vinyl.*"))
                        image_file = glob.glob(os.path.join(os.path.dirname(mp3_file), f"{song_basename}_image.*"))

                        image_data = None
                        if image_file:
                            try:
                                with open(image_file[0], 'rb') as f:
                                    image_data = f.read()
                                logger.debug(f"Read image file: {image_file[0]}")
                            except Exception as e:
                                logger.warning(f"Failed to read image file {image_file[0]}: {str(e)}")

                        # Xác định album của bài hát
                        song_album = default_album
                        for album in albums[1:]:
                            album_folder_path = os.path.join(album_path, album.album_name.lower().replace(' ', '_'))
                            if mp3_path.startswith(album_folder_path):
                                song_album = album
                                break

                        # Tạo Song
                        song, created = Songs.objects.get_or_create(
                            title=song_title,
                            artist=artist,
                            album=song_album,
                            defaults={
                                'duration': duration,
                                'audio_url': str(mp3_file).replace(str(BASE_DIR), ''),
                                'audio_file': audio_data,
                                'vinyl_background': str(vinyl_file[0]).replace(str(BASE_DIR), '') if vinyl_file else None,
                                'listeners': 1000,
                                'total_likes': 0,
                                'explicit': False,
                                'image_url': str(image_file[0]).replace(str(BASE_DIR), '') if image_file else None,
                                'image_file': image_data,
                                'lyrics': [{"time": 0, "text": "Lyrics not available"}]
                            }
                        )
                        if created:
                            logger.info(f"Created Song: {song_title} by {artist_name} in album {song_album.album_name}")
                            content_created_from_files = True

                        # Gán genre
                        genre = Genres.objects.get(genre_name="Pop" if artist_name.lower() == "adele" else "Rock")
                        SongGenres.objects.get_or_create(song=song, genre=genre)

                    # Xử lý các file mp4 trong folder video
                    video_path = os.path.join(artist_path, 'video')
                    if os.path.exists(video_path):
                        mp4_files = glob.glob(os.path.join(video_path, '*.mp4'))
                        for mp4_file in mp4_files:
                            video_title = os.path.basename(mp4_file).replace('.mp4', '').replace('_', ' ').title()
                            mp4_path = mp4_file

                            # Đọc file mp4
                            video_data = None
                            duration = 180
                            try:
                                with open(mp4_path, 'rb') as f:
                                    video_data = f.read()
                                logger.debug(f"Read mp4 file: {mp4_path}")
                                video = MP4(mp4_path)
                                duration = int(video.info.length)
                                logger.debug(f"Duration of {video_title}: {duration} seconds")
                            except Exception as e:
                                logger.warning(f"Failed to read mp4 file or get duration {mp4_path}: {str(e)}")
                                continue

                            # Tạo Video
                            video, created = Video.objects.get_or_create(
                                title=video_title,
                                artist=artist,
                                album=default_album,
                                defaults={
                                    'duration': duration,
                                    'video_url': str(mp4_file).replace(str(BASE_DIR), ''),
                                    'video_file': video_data,
                                    'listeners': 1000,
                                    'total_likes': 0,
                                    'explicit': False
                                }
                            )
                            if created:
                                logger.info(f"Created Video: {video_title} by {artist_name}")
                                content_created_from_files = True

                            # Gán genre
                            genre = Genres.objects.get(genre_name="Pop" if artist_name.lower() == "adele" else "Rock")
                            VideoGenres.objects.get_or_create(video=video, genre=genre)

                    # Cập nhật total_songs và total_duration cho Albums
                    for album in albums:
                        album.total_songs = Songs.objects.filter(album=album).count() + Video.objects.filter(album=album).count()
                        album.total_duration = sum(song.duration for song in Songs.objects.filter(album=album)) + sum(video.duration for video in Video.objects.filter(album=album))
                        album.save()
                        logger.debug(f"Updated Album {album.album_name}: {album.total_songs} items")

                logger.info(f"Added Artists: {Artists.objects.count()}")
                logger.info(f"Added Albums: {Albums.objects.count()}")
                logger.info(f"Added Songs: {Songs.objects.count()}")
                logger.info(f"Added Videos: {Video.objects.count()}")
                logger.info(f"Added SongGenres: {SongGenres.objects.count()}")
                logger.info(f"Added VideoGenres: {VideoGenres.objects.count()}")

        except DatabaseError as e:
            logger.error(f"Error adding artists, albums, songs, videos: {str(e)}")
            raise
    else:
        logger.warning(f"Static track folder not found: {STATIC_TRACK_PATH}. Creating sample data instead.")

    # Nếu không tạo được Songs hoặc Videos từ file, tạo dữ liệu mẫu
    if not content_created_from_files:
        try:
            with transaction.atomic():
                artist1, created = Artists.objects.get_or_create(
                    artist_name="Binz",
                    defaults={
                        'bio': "Binz is a renowned artist.",
                        'nationality': "Vietnam",
                        'is_active': True
                    }
                )
                logger.info(f"Added Artists: {Artists.objects.count()}")

                album1, created = Albums.objects.get_or_create(
                    album_name="BigCityBoy Collection",
                    artist=artist1,
                    defaults={
                        'album_title': "BigCityBoy Collection",
                        'release_date': "2020-01-01",
                        'total_songs': 0,
                        'total_duration': 0
                    }
                )
                logger.info(f"Added Albums: {Albums.objects.count()}")

                song1, created = Songs.objects.get_or_create(
                    title="BigCityBoy",
                    artist=artist1,
                    album=album1,
                    defaults={
                        'duration': 210,
                        'audio_url': None,
                        'audio_file': None,
                        'listeners': 1000,
                        'total_likes': 0,
                        'explicit': False,
                        'image_url': None,
                        'image_file': None,
                        'lyrics': [{"time": 0, "text": "Lyrics not available"}]
                    }
                )
                if created:
                    logger.info(f"Created Song: BigCityBoy by Binz")

                video1, created = Video.objects.get_or_create(
                    title="BigCityBoy MV",
                    artist=artist1,
                    album=album1,
                    defaults={
                        'duration': 240,
                        'video_url': None,
                        'video_file': None,
                        'listeners': 1000,
                        'total_likes': 0,
                        'explicit': False
                    }
                )
                if created:
                    logger.info(f"Created Video: BigCityBoy MV by Binz")

                genre = Genres.objects.get(genre_name="Pop")
                SongGenres.objects.get_or_create(song=song1, genre=genre)
                VideoGenres.objects.get_or_create(video=video1, genre=genre)

                album1.total_songs = Songs.objects.filter(album=album1).count() + Video.objects.filter(album=album1).count()
                album1.total_duration = sum(song.duration for song in Songs.objects.filter(album=album1)) + sum(video.duration for video in Video.objects.filter(album=album1))
                album1.save()
                logger.info(f"Updated Album: BigCityBoy Collection")

        except DatabaseError as e:
            logger.error(f"Error adding sample data: {str(e)}")
            raise

# 4. Thêm AdminPlaylists và Songs từ static/playlist
def add_admin_playlists():
    if os.path.exists(STATIC_PLAYLIST_PATH):
        try:
            with transaction.atomic():
                # Tạo Artist mặc định cho các bài hát trong playlist không có artist rõ ràng
                default_artist, _ = Artists.objects.get_or_create(
                    artist_name="Various Artists",
                    defaults={
                        'bio': "Collection of various artists.",
                        'nationality': "Unknown",
                        'is_active': True
                    }
                )
                default_album, _ = Albums.objects.get_or_create(
                    album_name="Playlist Tracks",
                    artist=default_artist,
                    defaults={
                        'album_title': "Playlist Tracks",
                        'release_date': "2020-01-01",
                        'total_songs': 0,
                        'total_duration': 0
                    }
                )

                for playlist_folder in os.listdir(STATIC_PLAYLIST_PATH):
                    playlist_path = os.path.join(STATIC_PLAYLIST_PATH, playlist_folder)
                    if not os.path.isdir(playlist_path):
                        logger.debug(f"Skipping non-directory: {playlist_folder}")
                        continue

                    playlist_name = playlist_folder.replace('_', ' ').title()
                    playlist, created = AdminPlaylists.objects.get_or_create(
                        playlist_name=playlist_name,
                        defaults={
                            'is_public': True,
                            'total_songs': 0
                        }
                    )
                    logger.info(f"{'Created' if created else 'Retrieved'} AdminPlaylist: {playlist_name}")

                    # Xử lý các file mp3 trong playlist
                    mp3_files = glob.glob(os.path.join(playlist_path, '*.mp3'))
                    for mp3_file in mp3_files:
                        song_title = os.path.basename(mp3_file).replace('.mp3', '').replace('_', ' ').title()
                        mp3_path = mp3_file

                        # Đọc file mp3
                        audio_data = None
                        duration = 180
                        try:
                            with open(mp3_path, 'rb') as f:
                                audio_data = f.read()
                            logger.debug(f"Read mp3 file: {mp3_path}")
                            audio = MP3(mp3_path)
                            duration = int(audio.info.length)
                            logger.debug(f"Duration of {song_title}: {duration} seconds")
                        except Exception as e:
                            logger.warning(f"Failed to read mp3 file or get duration {mp3_path}: {str(e)}")
                            continue

                        # Tìm hoặc tạo bài hát
                        song, created = Songs.objects.get_or_create(
                            title=song_title,
                            artist=default_artist,
                            album=default_album,
                            defaults={
                                'duration': duration,
                                'audio_url': str(mp3_file).replace(str(BASE_DIR), ''),
                                'audio_file': audio_data,
                                'listeners': 1000,
                                'total_likes': 0,
                                'explicit': False,
                                'lyrics': [{"time": 0, "text": "Lyrics not available"}]
                            }
                        )
                        if created:
                            logger.info(f"Created Song from playlist: {song_title} in {playlist_name}")
                        else:
                            logger.info(f"Retrieved Song: {song_title} for {playlist_name}")

                        # Gán genre
                        genre = Genres.objects.get(genre_name="Pop")
                        SongGenres.objects.get_or_create(song=song, genre=genre)

                        # Thêm bài hát vào playlist
                        AdminPlaylistSongs.objects.get_or_create(playlist=playlist, song=song)
                        logger.info(f"Added song {song_title} to playlist {playlist_name}")

                    # Cập nhật total_songs
                    playlist.total_songs = playlist.admin_playlist_songs.count()
                    playlist.save()
                    logger.debug(f"Updated AdminPlaylist {playlist_name}: {playlist.total_songs} songs")

                # Cập nhật total_songs và total_duration cho default album
                default_album.total_songs = Songs.objects.filter(album=default_album).count()
                default_album.total_duration = sum(song.duration for song in Songs.objects.filter(album=default_album))
                default_album.save()
                logger.debug(f"Updated Default Album: {default_album.album_name}")

                logger.info(f"Added AdminPlaylists: {AdminPlaylists.objects.count()}")
        except DatabaseError as e:
            logger.error(f"Error adding admin playlists: {str(e)}")
            raise
    else:
        logger.warning(f"Static playlist folder not found: {STATIC_PLAYLIST_PATH}. Creating sample playlists.")

        try:
            with transaction.atomic():
                playlist1 = AdminPlaylists.objects.create(
                    playlist_name="Top Hits 2023",
                    is_public=True,
                    total_songs=0
                )
                playlist2 = AdminPlaylists.objects.create(
                    playlist_name="Rock Classics",
                    is_public=True,
                    total_songs=0
                )

                songs = Songs.objects.all()[:3]
                for song in songs:
                    AdminPlaylistSongs.objects.get_or_create(playlist=playlist1, song=song)
                    AdminPlaylistSongs.objects.get_or_create(playlist=playlist2, song=song)

                for playlist in AdminPlaylists.objects.all():
                    playlist.total_songs = playlist.admin_playlist_songs.count()
                    playlist.save()

            logger.info(f"Added AdminPlaylists: {AdminPlaylists.objects.count()}")
        except DatabaseError as e:
            logger.error(f"Error adding sample admin playlists: {str(e)}")
            raise

# 5. Thêm UserPlaylists
def add_user_playlists():
    try:
        with transaction.atomic():
            user1 = Users.objects.get(username="john_doe")
            user2 = Users.objects.get(username="jane_smith")

            playlist1 = UserPlaylists.objects.create(
                user=user1,
                playlist_name="My Favorites",
                is_public=False
            )
            playlist2 = UserPlaylists.objects.create(
                user=user2,
                playlist_name="Workout Mix",
                is_public=True
            )

            songs = Songs.objects.all()[:2]
            for song in songs:
                UserPlaylistSongs.objects.get_or_create(playlist=playlist1, song=song)
                UserPlaylistSongs.objects.get_or_create(playlist=playlist2, song=song)

        logger.info(f"Added UserPlaylists: {UserPlaylists.objects.count()}")
    except DatabaseError as e:
        logger.error(f"Error adding user playlists: {str(e)}")
        raise

# 6. Thêm Likes và ListeningHistory
def add_likes_and_history():
    try:
        with transaction.atomic():
            user1 = Users.objects.get(username="john_doe")
            user2 = Users.objects.get(username="jane_smith")

            song1 = Songs.objects.first()
            video1 = Video.objects.first()

            Likes.objects.get_or_create(user=user1, song=song1)
            Likes.objects.get_or_create(user=user2, video=video1)

            ListeningHistory.objects.get_or_create(user=user1, song=song1)
            ListeningHistory.objects.get_or_create(user=user2, video=video1)

        logger.info(f"Added Likes: {Likes.objects.count()}")
        logger.info(f"Added ListeningHistory: {ListeningHistory.objects.count()}")
    except DatabaseError as e:
        logger.error(f"Error adding likes and history: {str(e)}")
        raise

# Hàm chính để chạy toàn bộ
def populate_data():
    try:
        clear_database()
        add_users()
        add_genres()
        add_artists_albums_songs_videos()
        add_admin_playlists()
        add_user_playlists()
        add_likes_and_history()
        logger.info("Data population completed successfully.")
    except Exception as e:
        logger.error(f"Error populating data: {str(e)}")
        raise

if __name__ == "__main__":
    populate_data()
