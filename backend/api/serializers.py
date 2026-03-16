from rest_framework import serializers
from .models import Albums, Songs, Artists, Genres, UserPlaylists, Users, ListeningHistory, Video, AdminPlaylists, AdminPlaylistSongs, Message, FriendRequest
import logging
import base64

logger = logging.getLogger(__name__)

class UserSerializer(serializers.ModelSerializer):
    avatar_url = serializers.CharField(allow_null=True, required=False)

    class Meta:
        model = Users
        fields = [
            'user_id', 'username', 'email', 'password', 'full_name',
            'avatar_url', 'created_at', 'updated_at', 'is_active'
        ]
        extra_kwargs = {
            'password': {'write_only': True}
        }

class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genres
        fields = ['genre_id', 'genre_name', 'description', 'created_at', 'updated_at']

class SongSerializer(serializers.ModelSerializer):
    artist_name = serializers.SerializerMethodField()
    audio_url = serializers.CharField(allow_null=True, required=False)
    image_url = serializers.CharField(allow_null=True, required=False)
    album_title = serializers.SerializerMethodField()
    genres = GenreSerializer(many=True, read_only=True, source='genres.genre')
    audio_file = serializers.SerializerMethodField(read_only=True)
    image_file = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Songs
        fields = [
            'song_id', 'title', 'artist', 'artist_name', 'album', 'album_title',
            'duration', 'audio_url', 'audio_file', 'vinyl_background', 'listeners',
            'total_likes', 'explicit', 'image_url', 'image_file', 'lyrics', 'genres',
            'created_at', 'updated_at'
        ]

    def get_artist_name(self, obj):
        return obj.artist.artist_name if obj.artist else None

    def get_album_title(self, obj):
        return obj.album.album_name if obj.album else None

    def get_audio_file(self, obj):
        if obj.audio_file and self.context.get('include_binary', True):
            try:
                return base64.b64encode(obj.audio_file).decode('utf-8')
            except Exception as e:
                logger.error(f"Error encoding audio file for song {obj.song_id}: {str(e)}")
                return None
        return None

    def get_image_file(self, obj):
        if obj.image_file and self.context.get('include_binary', True):
            try:
                return base64.b64encode(obj.image_file).decode('utf-8')
            except Exception as e:
                logger.error(f"Error encoding image file for song {obj.song_id}: {str(e)}")
                return None
        return None

    def to_representation(self, instance):
        try:
            ret = super().to_representation(instance)
            logger.debug(f"Serialized song {instance.song_id}")
            return ret
        except Exception as e:
            logger.error(f"Error serializing song {instance.song_id}: {str(e)}", exc_info=True)
            return {'song_id': instance.song_id, 'title': instance.title, 'error': str(e)}

class VideoSerializer(serializers.ModelSerializer):
    artist_name = serializers.SerializerMethodField()
    video_url = serializers.CharField(allow_null=True, required=False)
    album_title = serializers.SerializerMethodField()
    genres = GenreSerializer(many=True, read_only=True, source='genres.genre')
    video_file = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Video
        fields = [
            'video_id', 'title', 'artist', 'artist_name', 'album', 'album_title',
            'duration', 'video_url', 'video_file', 'listeners', 'total_likes',
            'explicit', 'genres', 'created_at', 'updated_at'
        ]

    def get_artist_name(self, obj):
        try:
            return obj.artist.artist_name if obj.artist else None
        except Exception as e:
            logger.error(f"Error getting artist_name for video {obj.video_id}: {str(e)}")
            return None

    def get_album_title(self, obj):
        try:
            return obj.album.album_name if obj.album else None
        except Exception as e:
            logger.error(f"Error getting album_title for video {obj.video_id}: {str(e)}")
            return None

    def get_video_file(self, obj):
        if obj.video_file:
            try:
                return base64.b64encode(obj.video_file).decode('utf-8')
            except Exception as e:
                logger.error(f"Error encoding video file for video {obj.video_id}: {str(e)}")
                return None
        return None

    def to_representation(self, instance):
        try:
            ret = super().to_representation(instance)
            logger.debug(f"Serialized video {instance.video_id}: {ret}")
            return ret
        except Exception as e:
            logger.error(f"Error serializing video {instance.video_id}: {str(e)}")
            return {'video_id': instance.video_id, 'title': instance.title, 'error': str(e)}

class UserPlaylistSerializer(serializers.ModelSerializer):
    total_songs = serializers.SerializerMethodField()

    class Meta:
        model = UserPlaylists
        fields = [
            'user_playlist_id', 'user', 'playlist_name', 'playlist_number', 
            'is_public', 'total_songs', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user_playlist_id', 'playlist_number', 'total_songs', 'created_at', 'updated_at']
        extra_kwargs = {
            'user': {'write_only': True, 'required': False},
        }

    def get_total_songs(self, obj):
        count = obj.user_playlist_songs.count()
        logger.debug(f"Total songs for playlist {obj.user_playlist_id}: {count}")
        return count

class AlbumSerializer(serializers.ModelSerializer): 
    song_list = SongSerializer(many=True, read_only=True, source='songs', context={'include_binary': False})
    video_list = VideoSerializer(many=True, read_only=True, source='videos', context={'include_binary': False})
    artist_name = serializers.CharField(source='artist.artist_name', read_only=True)
    cover_url = serializers.CharField(allow_null=True, required=False)

    class Meta:
        model = Albums
        fields = [
            'album_id', 'album_name', 'album_title', 'artist', 'artist_name',
            'cover_url', 'release_date', 'total_songs', 'total_duration',
            'copyright', 'song_list', 'video_list', 'created_at', 'updated_at'
        ]

    def to_representation(self, instance):
        try:
            ret = super().to_representation(instance)
            logger.debug(f"Serialized album {instance.album_id}")
            return ret
        except Exception as e:
            logger.error(f"Error serializing album {instance.album_id}: {str(e)}", exc_info=True)
            return {
                'album_id': instance.album_id,
                'album_name': instance.album_name,
                'error': str(e)
            }

class ArtistSerializer(serializers.ModelSerializer):
    popular_songs = SongSerializer(many=True, read_only=True, source='songs', context={'include_binary': False})
    popular_videos = VideoSerializer(many=True, read_only=True, source='videos', context={'include_binary': False})
    image_url = serializers.CharField(allow_null=True, required=False)

    class Meta:
        model = Artists
        fields = [
            'artist_id', 'artist_name', 'image_url', 'bio', 'nationality',
            'background', 'popular_songs', 'popular_videos', 'created_at', 'updated_at', 'is_active'
        ]

class ListeningHistorySerializer(serializers.ModelSerializer):
    song = SongSerializer(read_only=True, allow_null=True)
    video = VideoSerializer(read_only=True, allow_null=True)
    user = UserSerializer(read_only=True)
    playlist = UserPlaylistSerializer(read_only=True, allow_null=True)

    class Meta:
        model = ListeningHistory
        fields = ['history_id', 'user', 'song', 'video', 'playlist', 'listened_at']

class AdminPlaylistSerializer(serializers.ModelSerializer):
    songs = serializers.SerializerMethodField()

    class Meta:
        model = AdminPlaylists
        fields = ['admin_playlist_id', 'playlist_name', 'is_public', 'total_songs', 'songs', 'created_at', 'updated_at']

    def get_songs(self, obj):
        try:
            playlist_songs = obj.admin_playlist_songs.all()
            songs = [playlist_song.song for playlist_song in playlist_songs]
            return SongSerializer(songs, many=True, read_only=True).data
        except Exception as e:
            logger.error(f"Error getting songs for admin playlist {obj.admin_playlist_id}: {str(e)}")
            return []

    def to_representation(self, instance):
        try:
            songs = instance.admin_playlist_songs.all()
            logger.debug(f"Admin playlist {instance.admin_playlist_id} has {songs.count()} songs: {[s.song.title for s in songs]}")
            ret = super().to_representation(instance)
            logger.debug(f"Serialized admin playlist {instance.admin_playlist_id}: {ret}")
            return ret
        except Exception as e:
            logger.error(f"Error serializing admin playlist {instance.admin_playlist_id}: {str(e)}")
            return {
                'admin_playlist_id': instance.admin_playlist_id,
                'playlist_name': instance.playlist_name,
                'is_public': instance.is_public,
                'total_songs': instance.total_songs,
                'songs': [],
                'created_at': instance.created_at,
                'updated_at': instance.updated_at,
                'error': str(e)
            }
            
class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['message_id', 'sender_id', 'receiver_id', 'text', 'is_read', 'sent_at']
        read_only_fields = ['message_id', 'sent_at']
        

class FriendRequestSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    receiver_name = serializers.SerializerMethodField()
    sender_avatar = serializers.SerializerMethodField()
    receiver_avatar = serializers.SerializerMethodField()
    
    class Meta:
        model = FriendRequest
        fields = [
            'request_id', 'sender_id', 'receiver_id', 'sender_name', 
            'receiver_name', 'sender_avatar', 'receiver_avatar',
            'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['request_id', 'created_at', 'updated_at']
    
    def get_sender_name(self, obj):
        return obj.sender.full_name or obj.sender.username
    
    def get_receiver_name(self, obj):
        return obj.receiver.full_name or obj.receiver.username
    
    def get_sender_avatar(self, obj):
        return obj.sender.avatar_url
    
    def get_receiver_avatar(self, obj):
        return obj.receiver.avatar_url
