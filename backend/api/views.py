import os
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import StreamingHttpResponse
from django.conf import settings
from django.db.models import Q
from .models import Albums, Artists, Songs, Genres, UserPlaylists, Users, ListeningHistory, UserPlaylistSongs, Likes, Video, AdminPlaylists, Message, FriendRequest
from .serializers import (
    AlbumSerializer, ArtistSerializer, SongSerializer, 
    GenreSerializer, UserPlaylistSerializer, 
    UserSerializer, ListeningHistorySerializer, VideoSerializer, AdminPlaylistSerializer,
    MessageSerializer, FriendRequestSerializer
)
from rest_framework import status
from django.contrib.auth.hashers import make_password, check_password
from django.shortcuts import redirect
import requests
import json
import logging
from django.db import models
import base64
from io import BytesIO

logger = logging.getLogger(__name__)

class AlbumListView(APIView):
    def get(self, request):
        albums = Albums.objects.prefetch_related('songs__genres__genre', 'videos__genres__genre').all()
        serializer = AlbumSerializer(albums, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = AlbumSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AlbumDetailView(APIView):
    def get(self, request, album_id):
        try:
            album = Albums.objects.prefetch_related('songs__genres__genre', 'videos__genres__genre').get(album_id=album_id)
            serializer = AlbumSerializer(album)
            logger.debug(f"AlbumDetailView data for album {album_id}: {serializer.data}")
            return Response(serializer.data)
        except Albums.DoesNotExist:
            return Response({"error": "Album not found"}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request, album_id):
        try:
            album = Albums.objects.get(album_id=album_id)
            serializer = AlbumSerializer(album, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Albums.DoesNotExist:
            return Response({"error": "Album not found"}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, album_id):
        try:
            album = Albums.objects.get(album_id=album_id)
            album.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Albums.DoesNotExist:
            return Response({"error": "Album not found"}, status=status.HTTP_404_NOT_FOUND)

class ArtistListView(APIView):
    def get(self, request):
        artists = Artists.objects.prefetch_related('songs__genres__genre', 'videos__genres__genre').all()
        serializer = ArtistSerializer(artists, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ArtistSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ArtistDetailView(APIView):
    def get(self, request, artist_id):
        try:
            artist = Artists.objects.prefetch_related('songs__genres__genre', 'videos__genres__genre').get(artist_id=artist_id)
            serializer = ArtistSerializer(artist)
            return Response(serializer.data)
        except Artists.DoesNotExist:
            return Response({"error": "Artist not found"}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request, artist_id):
        try:
            artist = Artists.objects.get(artist_id=artist_id)
            serializer = ArtistSerializer(artist, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Artists.DoesNotExist:
            return Response({"error": "Artist not found"}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, artist_id):
        try:
            artist = Artists.objects.get(artist_id=artist_id)
            artist.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Artists.DoesNotExist:
            return Response({"error": "Artist not found"}, status=status.HTTP_404_NOT_FOUND)

class SongListView(APIView):
    def get(self, request):
        songs = Songs.objects.prefetch_related('genres__genre').all()
        logger.debug(f"SongListView genres: {[sg.genre.genre_name for song in songs for sg in song.genres.all()]}")
        serializer = SongSerializer(songs, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = SongSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SongDetailView(APIView):
    def get(self, request, song_id):
        try:
            song = Songs.objects.prefetch_related('genres__genre').get(song_id=song_id)
            logger.debug(f"SongDetailView genres for song {song_id}: {[sg.genre.genre_name for sg in song.genres.all()]}")
            serializer = SongSerializer(song)
            return Response(serializer.data)
        except Songs.DoesNotExist:
            return Response({"error": "Song not found"}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request, song_id):
        try:
            song = Songs.objects.get(song_id=song_id)
            serializer = SongSerializer(song, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Songs.DoesNotExist:
            return Response({"error": "Song not found"}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, song_id):
        try:
            song = Songs.objects.get(song_id=song_id)
            song.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Songs.DoesNotExist:
            return Response({"error": "Song not found"}, status=status.HTTP_404_NOT_FOUND)

class SongStreamView(APIView):
    def get(self, request, song_id):
        try:
            song = Songs.objects.get(song_id=song_id)
            if not song.audio_file:
                logger.error(f"No audio file for song {song_id}")
                return Response({"error": "No audio file available"}, status=status.HTTP_404_NOT_FOUND)

            def file_iterator(data, chunk_size=8192):
                buffer = BytesIO(data)
                while chunk := buffer.read(chunk_size):
                    yield chunk

            response = StreamingHttpResponse(
                file_iterator(song.audio_file),
                content_type="audio/mpeg"
            )
            response["Content-Disposition"] = f'inline; filename="{song.title}.mp3"'
            logger.debug(f"Streaming song {song_id}")
            return response
        except Songs.DoesNotExist:
            logger.error(f"Song {song_id} not found")
            return Response({"error": "Song not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error streaming song {song_id}: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class VideoListView(APIView):
    def get(self, request):
        videos = Video.objects.prefetch_related('genres__genre').all()
        logger.debug(f"VideoListView genres: {[vg.genre.genre_name for video in videos for vg in video.genres.all()]}")
        serializer = VideoSerializer(videos, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = VideoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VideoDetailView(APIView):
    def get(self, request, video_id):
        try:
            video = Video.objects.prefetch_related('genres__genre').get(video_id=video_id)
            logger.debug(f"VideoDetailView genres for video {video_id}: {[vg.genre.genre_name for vg in video.genres.all()]}")
            serializer = VideoSerializer(video)
            return Response(serializer.data)
        except Video.DoesNotExist:
            return Response({"error": "Video not found"}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request, video_id):
        try:
            video = Video.objects.get(video_id=video_id)
            serializer = VideoSerializer(video, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Video.DoesNotExist:
            return Response({"error": "Video not found"}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, video_id):
        try:
            video = Video.objects.get(video_id=video_id)
            video.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Video.DoesNotExist:
            return Response({"error": "Video not found"}, status=status.HTTP_404_NOT_FOUND)

class VideoStreamView(APIView):
    def get(self, request, video_id):
        try:
            video = Video.objects.get(video_id=video_id)
            if not video.video_file:
                logger.error(f"No video file for video {video_id}")
                return Response({"error": "No video file available"}, status=status.HTTP_404_NOT_FOUND)

            def file_iterator(data, chunk_size=8192):
                buffer = BytesIO(data)
                while chunk := buffer.read(chunk_size):
                    yield chunk

            response = StreamingHttpResponse(
                file_iterator(video.video_file),
                content_type="video/mp4"
            )
            response["Content-Disposition"] = f'inline; filename="{video.title}.mp4"'
            logger.debug(f"Streaming video {video_id}")
            return response
        except Video.DoesNotExist:
            logger.error(f"Video {video_id} not found")
            return Response({"error": "Video not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error streaming video {video_id}: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class GenreListView(APIView):
    def get(self, request):
        genres = Genres.objects.all()
        serializer = GenreSerializer(genres, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = GenreSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class GenreDetailView(APIView):
    def get(self, request, genre_id):
        try:
            genre = Genres.objects.get(genre_id=genre_id)
            serializer = GenreSerializer(genre)
            return Response(serializer.data)
        except Genres.DoesNotExist:
            return Response({"error": "Genre not found"}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request, genre_id):
        try:
            genre = Genres.objects.get(genre_id=genre_id)
            serializer = GenreSerializer(genre, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Genres.DoesNotExist:
            return Response({"error": "Genre not found"}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, genre_id):
        try:
            genre = Genres.objects.get(genre_id=genre_id)
            genre.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Genres.DoesNotExist:
            return Response({"error": "Genre not found"}, status=status.HTTP_404_NOT_FOUND)

class UserPlaylistListView(APIView):
    def get(self, request, user_id):
        try:
            playlists = UserPlaylists.objects.filter(user__user_id=user_id).prefetch_related('user_playlist_songs__song__genres__genre')
            logger.debug(f"Playlists for user {user_id}: {[p.user_playlist_id for p in playlists]}")
            for playlist in playlists:
                songs = [s.song.title for s in playlist.user_playlist_songs.all()]
                logger.debug(f"Playlist {playlist.user_playlist_id} has songs: {songs}")
            serializer = UserPlaylistSerializer(playlists, many=True)
            return Response(serializer.data)
        except Users.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error in UserPlaylistListView GET: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request, user_id):
        try:
            data = request.data.copy()
            data['user'] = user_id
            serializer = UserPlaylistSerializer(data=data)
            if serializer.is_valid():
                playlist = serializer.save()
                logger.debug(f"Created playlist {playlist.user_playlist_id} for user {user_id}")
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Users.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error in UserPlaylistListView POST: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserPlaylistDetailView(APIView):
    def get(self, request, user_id, playlist_number):
        try:
            playlist = UserPlaylists.objects.prefetch_related('user_playlist_songs__song__genres__genre').get(
                user__user_id=user_id, 
                playlist_number=playlist_number
            )
            songs = [s.song.title for s in playlist.user_playlist_songs.all()]
            logger.debug(f"Playlist {playlist.user_playlist_id} has songs: {songs}")
            serializer = UserPlaylistSerializer(playlist)
            return Response(serializer.data)
        except UserPlaylists.DoesNotExist:
            return Response({"error": "Playlist not found for this user"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error in UserPlaylistDetailView GET: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request, user_id, playlist_number):
        try:
            playlist = UserPlaylists.objects.get(user__user_id=user_id, playlist_number=playlist_number)
            serializer = UserPlaylistSerializer(playlist, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except UserPlaylists.DoesNotExist:
            return Response({"error": "Playlist not found for this user"}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, user_id, playlist_number):
        try:
            playlist = UserPlaylists.objects.get(user__user_id=user_id, playlist_number=playlist_number)
            playlist.delete()
            UserPlaylists.objects.filter(
                user__user_id=user_id,
                playlist_number__gt=playlist_number
            ).update(playlist_number=models.F('playlist_number') - 1)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except UserPlaylists.DoesNotExist:
            return Response({"error": "Playlist not found for this user"}, status=status.HTTP_404_NOT_FOUND)

class UserPlaylistSongsView(APIView):
    def get(self, request, user_id, playlist_number):
        try:
            playlist = UserPlaylists.objects.get(user__user_id=user_id, playlist_number=playlist_number)
            songs = Songs.objects.filter(user_playlists__playlist=playlist).prefetch_related('genres__genre')
            logger.debug(f"Songs in playlist {playlist.user_playlist_id}: {[s.title for s in songs]}")
            serializer = SongSerializer(songs, many=True)
            return Response(serializer.data)
        except UserPlaylists.DoesNotExist:
            return Response({"error": "Playlist not found for this user"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error in UserPlaylistSongsView GET: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request, user_id, playlist_number):
        try:
            song_id = request.data.get('song_id')
            if not song_id:
                return Response({"error": "Song ID is required"}, status=status.HTTP_400_BAD_REQUEST)
            playlist = UserPlaylists.objects.get(user__user_id=user_id, playlist_number=playlist_number)
            if UserPlaylistSongs.objects.filter(playlist=playlist, song__song_id=song_id).exists():
                return Response({"message": "Song already in playlist"}, status=status.HTTP_409_CONFLICT)
            song = Songs.objects.get(song_id=song_id)
            UserPlaylistSongs.objects.create(playlist=playlist, song=song)
            logger.debug(f"Added song {song_id} to playlist {playlist.user_playlist_id}")
            return Response({"message": "Song added to playlist"}, status=status.HTTP_201_CREATED)
        except UserPlaylists.DoesNotExist:
            return Response({"error": "Playlist not found for this user"}, status=status.HTTP_404_NOT_FOUND)
        except Songs.DoesNotExist:
            return Response({"error": "Song not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error in UserPlaylistSongsView POST: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, user_id, playlist_number):
        try:
            song_id = request.data.get('song_id')
            if not song_id:
                return Response({"error": "Song ID is required"}, status=status.HTTP_400_BAD_REQUEST)
            playlist = UserPlaylists.objects.get(user__user_id=user_id, playlist_number=playlist_number)
            UserPlaylistSongs.objects.filter(playlist=playlist, song__song_id=song_id).delete()
            logger.debug(f"Removed song {song_id} from playlist {playlist.user_playlist_id}")
            return Response({"message": "Song removed from playlist"}, status=status.HTTP_204_NO_CONTENT)
        except UserPlaylists.DoesNotExist:
            return Response({"error": "Playlist not found for this user"}, status=status.HTTP_404_NOT_FOUND)
        except UserPlaylistSongs.DoesNotExist:
            return Response({"error": "Song not found in playlist"}, status=status.HTTP_404_NOT_FOUND)
        except Songs.DoesNotExist:
            return Response({"error": "Song not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error in UserPlaylistSongsView DELETE: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class TopSongsView(APIView):
    def get(self, request):
        top_songs = Songs.objects.order_by('-listeners').prefetch_related('genres__genre')[:5]
        logger.debug(f"TopSongsView genres: {[sg.genre.genre_name for song in top_songs for sg in song.genres.all()]}")
        serializer = SongSerializer(top_songs, many=True)
        return Response(serializer.data)

class SearchView(APIView):
    def get(self, request):
        query = request.query_params.get('query', '').strip()
        if not query:
            return Response({"songs": [], "videos": [], "albums": [], "artists": []})

        songs = Songs.objects.filter(
            Q(title__icontains=query) | 
            Q(artist__artist_name__icontains=query)
        ).distinct().prefetch_related('genres__genre')
        logger.debug(f"SearchView genres for songs: {[sg.genre.genre_name for song in songs for sg in song.genres.all()]}")
        song_serializer = SongSerializer(songs, many=True)

        videos = Video.objects.filter(
            Q(title__icontains=query) | 
            Q(artist__artist_name__icontains=query)
        ).distinct().prefetch_related('genres__genre')
        logger.debug(f"SearchView genres for videos: {[vg.genre.genre_name for video in videos for vg in video.genres.all()]}")
        video_serializer = VideoSerializer(videos, many=True)

        albums = Albums.objects.filter(
            Q(album_name__icontains=query) | 
            Q(artist__artist_name__icontains=query) |
            Q(album_title__icontains=query)
        ).distinct()
        album_serializer = AlbumSerializer(albums, many=True)

        artists = Artists.objects.filter(
            Q(artist_name__icontains=query)
        ).distinct()
        artist_serializer = ArtistSerializer(artists, many=True)

        response_data = {
            "songs": song_serializer.data,
            "videos": video_serializer.data,
            "albums": album_serializer.data,
            "artists": artist_serializer.data
        }
        return Response(response_data)

class UserListView(APIView):
    def get(self, request):
        users = Users.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.validated_data['password'] = make_password(serializer.validated_data['password'])
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserDetailView(APIView):
    def get(self, request, user_id):
        try:
            user = Users.objects.get(user_id=user_id)
            serializer = UserSerializer(user)
            return Response(serializer.data)
        except Users.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request, user_id):
        try:
            user = Users.objects.get(user_id=user_id)
            serializer = UserSerializer(user, data=request.data, partial=True)
            if serializer.is_valid():
                if 'password' in serializer.validated_data:
                    serializer.validated_data['password'] = make_password(serializer.validated_data['password'])
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Users.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, user_id):
        try:
            user = Users.objects.get(user_id=user_id)
            user.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Users.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

class ListeningHistoryView(APIView):
    def get(self, request):
        user_id = request.query_params.get('user_id')
        if user_id:
            try:
                user_id = int(user_id)
                history = ListeningHistory.objects.filter(user__user_id=user_id).order_by('-listened_at').select_related('song', 'video').prefetch_related('song__genres__genre', 'video__genres__genre')
                serializer = ListeningHistorySerializer(history, many=True)
                return Response(serializer.data)
            except ValueError:
                return Response({"error": "Invalid user_id"}, status=status.HTTP_400_BAD_REQUEST)
            except Users.DoesNotExist:
                return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        history = ListeningHistory.objects.all().order_by('-listened_at').select_related('song', 'video').prefetch_related('song__genres__genre', 'video__genres__genre')
        serializer = ListeningHistorySerializer(history, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ListeningHistorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            if serializer.validated_data.get('song'):
                song = serializer.validated_data['song']
                song.listeners += 1
                song.save()
            elif serializer.validated_data.get('video'):
                video = serializer.validated_data['video']
                video.listeners += 1
                video.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response(
                {"message": "Email and password are required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = Users.objects.get(email=email)
            if check_password(password, user.password):
                user_data = {
                    "user_id": user.user_id,
                    "username": user.username,
                    "email": user.email,
                    "full_name": user.full_name,
                    "avatar_url": user.avatar_url
                }
                return Response({
                    "message": "Login successful",
                    "user": user_data
                })
            return Response(
                {"message": "Invalid email or password"}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        except Users.DoesNotExist:
            return Response(
                {"message": "Invalid email or password"}, 
                status=status.HTTP_401_UNAUTHORIZED
            )

class SignupView(APIView):
    def post(self, request):
        username = request.data.get("username")
        email = request.data.get('email')
        password = request.data.get('password')
        password_strength = request.data.get('passwordStrength')
        
        if not username:
            return Response({"message": "Username is required"}, status=status.HTTP_400_BAD_REQUEST)
        if not email or not password:
            return Response({"message": "Email and password are required"}, status=status.HTTP_400_BAD_REQUEST)
        if password_strength == 'weak':
            return Response({"message": "Password is too weak"}, status=status.HTTP_400_BAD_REQUEST)
        
        if Users.objects.filter(username=username).exists():
            return Response({"message": "Username already taken"}, status=status.HTTP_409_CONFLICT)
        if Users.objects.filter(email=email).exists():
            return Response({"message": "User with this email already exists"}, status=status.HTTP_409_CONFLICT)
        
        try:
            user = Users(
                username=username,
                email=email,
                password=make_password(password)
            )
            user.save()
            serializer = UserSerializer(user)
            return Response({
                "message": "User registered successfully",
                "user": serializer.data
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error in SignupView: {str(e)}")
            return Response({"message": f"Error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class GoogleAuthView(APIView):
    def get(self, request):
        client_id = settings.GOOGLE_CLIENT_ID
        redirect_uri = settings.GOOGLE_REDIRECT_URI
        scope = "email profile"
        auth_url = f"https://accounts.google.com/o/oauth2/auth?client_id={client_id}&redirect_uri={redirect_uri}&scope={scope}&response_type=code"
        return redirect(auth_url)

class GoogleCallbackView(APIView):
    def get(self, request):
        code = request.GET.get('code')
        if not code:
            return redirect('/login?error=No authorization code provided')
        
        client_id = settings.GOOGLE_CLIENT_ID
        client_secret = settings.GOOGLE_CLIENT_SECRET
        redirect_uri = settings.GOOGLE_REDIRECT_URI
        
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code"
        }
        
        try:
            token_response = requests.post(token_url, data=token_data)
            token_response.raise_for_status()
            token_json = token_response.json()
            
            if 'access_token' not in token_json:
                return redirect('/login?error=Failed to obtain access token')
            
            access_token = token_json['access_token']
            userinfo_url = "https://www.googleapis.com/oauth2/v3/userinfo"
            headers = {"Authorization": f"Bearer {access_token}"}
            
            userinfo_response = requests.get(userinfo_url, headers=headers)
            userinfo_response.raise_for_status()
            userinfo = userinfo_response.json()
            
            if 'email' not in userinfo:
                return redirect('/login?error=Failed to get user information')
            
            email = userinfo['email']
            try:
                user = Users.objects.get(email=email)
                if not user.full_name and 'name' in userinfo:
                    user.full_name = userinfo['name']
                if not user.avatar_url and 'picture' in userinfo:
                    user.avatar_url = userinfo['picture']
                user.save()
            except Users.DoesNotExist:
                username = email.split('@')[0]
                base_username = username
                counter = 1
                while Users.objects.filter(username=username).exists():
                    username = f"{base_username}{counter}"
                    counter += 1
                
                user = Users.objects.create(
                    username=username,
                    email=email,
                    full_name=userinfo.get('name', ''),
                    avatar_url=userinfo.get('picture', ''),
                    password=make_password(None)
                )
            
            user_data = {
                "user_id": user.user_id,
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
                "avatar_url": user.avatar_url
            }
            user_data_json = json.dumps(user_data)
            return redirect(f"/main?user={user_data_json}")
        except requests.RequestException as e:
            logger.error(f"Google OAuth error: {str(e)}")
            return redirect(f"/login?error=Network error: {str(e)}")

class UserLikesView(APIView):
    def get(self, request, user_id):
        try:
            liked_songs = Songs.objects.filter(likes__user__user_id=user_id).prefetch_related('genres__genre')
            liked_videos = Video.objects.filter(likes__user__user_id=user_id).prefetch_related('genres__genre')
            logger.debug(f"UserLikesView song genres: {[sg.genre.genre_name for song in liked_songs for sg in song.genres.all()]}")
            logger.debug(f"UserLikesView video genres: {[vg.genre.genre_name for video in liked_videos for vg in video.genres.all()]}")
            song_serializer = SongSerializer(liked_songs, many=True)
            video_serializer = VideoSerializer(liked_videos, many=True)
            return Response({"songs": song_serializer.data, "videos": video_serializer.data})
        except Users.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error in UserLikesView GET: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request, user_id):
        try:
            song_id = request.data.get('song_id')
            video_id = request.data.get('video_id')
            if not song_id and not video_id:
                return Response({"error": "Song ID or Video ID is required"}, status=status.HTTP_400_BAD_REQUEST)
            
            if song_id:
                if Likes.objects.filter(user__user_id=user_id, song__song_id=song_id).exists():
                    return Response({"message": "Song already liked"}, status=status.HTTP_409_CONFLICT)
                Likes.objects.create(user_id=user_id, song_id=song_id)
                return Response({"message": "Song liked"}, status=status.HTTP_201_CREATED)
            elif video_id:
                if Likes.objects.filter(user__user_id=user_id, video__video_id=video_id).exists():
                    return Response({"message": "Video already liked"}, status=status.HTTP_409_CONFLICT)
                Likes.objects.create(user_id=user_id, video_id=video_id)
                return Response({"message": "Video liked"}, status=status.HTTP_201_CREATED)
        except Users.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        except (Songs.DoesNotExist, Video.DoesNotExist):
            return Response({"error": "Song or Video not found"}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, user_id):
        try:
            song_id = request.data.get('song_id')
            video_id = request.data.get('video_id')
            if not song_id and not video_id:
                return Response({"error": "Song ID or Video ID is required"}, status=status.HTTP_400_BAD_REQUEST)
            
            if song_id:
                Likes.objects.filter(user__user_id=user_id, song__song_id=song_id).delete()
                return Response({"message": "Song unliked"}, status=status.HTTP_204_NO_CONTENT)
            elif video_id:
                Likes.objects.filter(user__user_id=user_id, video__video_id=video_id).delete()
                return Response({"message": "Video unliked"}, status=status.HTTP_204_NO_CONTENT)
        except Likes.DoesNotExist:
            return Response({"error": "Song or Video not liked by user"}, status=status.HTTP_404_NOT_FOUND)

class UserListeningHistoryView(APIView):
    def get(self, request, user_id):
        try:
            history = ListeningHistory.objects.filter(user__user_id=user_id).order_by('-listened_at')
            serializer = ListeningHistorySerializer(history, many=True)
            return Response(serializer.data)
        except Users.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error in UserListeningHistoryView GET: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request, user_id):
        try:
            song_id = request.data.get('song_id')
            video_id = request.data.get('video_id')
            if not song_id and not video_id:
                return Response({"error": "Song ID or Video ID is required"}, status=status.HTTP_400_BAD_REQUEST)

            user = Users.objects.get(user_id=user_id)
            if song_id:
                song = Songs.objects.get(song_id=song_id)
                history_entry = ListeningHistory(user=user, song=song)
                history_entry.save()
                song.listeners += 1
                song.save()
            elif video_id:
                video = Video.objects.get(video_id=video_id)
                history_entry = ListeningHistory(user=user, video=video)
                history_entry.save()
                video.listeners += 1
                video.save()

            serializer = ListeningHistorySerializer(history_entry)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Users.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        except (Songs.DoesNotExist, Video.DoesNotExist):
            return Response({"error": "Song or Video not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error in UserListeningHistoryView POST: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, user_id):
        try:
            ListeningHistory.objects.filter(user__user_id=user_id).delete()
            return Response({"message": "Listening history cleared"}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Error in UserListeningHistoryView DELETE: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RandomSongsView(APIView):
    def get(self, request):
        try:
            limit = int(request.query_params.get('limit', 6))
            if limit <= 0:
                return Response({"error": "Limit must be positive"}, status=status.HTTP_400_BAD_REQUEST)
            songs = Songs.objects.order_by('?')[:limit]
            serializer = SongSerializer(songs, many=True)
            return Response(serializer.data)
        except ValueError:
            return Response({"error": "Invalid limit value"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error in RandomSongsView: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ImportSongsView(APIView):
    def post(self, request):
        try:
            static_path = os.path.join(settings.STATIC_ROOT, 'track')
            if not os.path.exists(static_path):
                return Response({"error": "Static track folder not found"}, status=status.HTTP_404_NOT_FOUND)

            for artist_folder in os.listdir(static_path):
                artist_path = os.path.join(artist_folder)
                if not os.path.isdir(artist_path):
                    continue

                # Tạo hoặc lấy artist
                artist, _ = Artists.objects.get_or_create(
                    artist_name=artist_folder.capitalize(),
                    defaults={'is_active': True}
                )

                # Xử lý file mp3
                for file_name in os.listdir(artist_path):
                    file_path = os.path.join(artist_path, file_name)
                    if file_name.endswith('.mp3'):
                        # Đọc file mp3
                        with open(file_path, 'rb') as f:
                            audio_data = f.read()

                        # Tìm file hình ảnh tương ứng
                        image_data = None
                        image_file_name = file_name.replace('.mp3', '.jpg')
                        image_path = os.path.join(artist_path, image_file_name)
                        if os.path.exists(image_path):
                            with open(image_path, 'rb') as f:
                                image_data = f.read()

                        # Tạo bài hát
                        song, created = Songs.objects.get_or_create(
                            title=file_name.replace('.mp3', '').replace('_', ' ').title(),
                            artist=artist,
                            defaults={
                                'duration': 180,  # Giả định thời lượng
                                'audio_url': f'static/track/{artist_folder}/{file_name}',
                                'audio_file': audio_data,
                                'image_url': f'static/track/{artist_folder}/{image_file_name}' if image_data else None,
                                'image_file': image_data,
                                'explicit': False,
                            }
                        )
                        if created:
                            logger.debug(f"Imported song: {song.title} by {artist.artist_name}")

                    # Xử lý file mp4 (video)
                    elif file_name.endswith('.mp4'):
                        # Đọc file mp4
                        with open(file_path, 'rb') as f:
                            video_data = f.read()

                        # Tạo video
                        video, created = Video.objects.get_or_create(
                            title=file_name.replace('.mp4', '').replace('_', ' ').title(),
                            artist=artist,
                            defaults={
                                'duration': 180,  # Giả định thời lượng
                                'video_url': f'static/track/{artist_folder}/{file_name}',
                                'video_file': video_data,
                                'explicit': False,
                            }
                        )
                        if created:
                            logger.debug(f"Imported video: {video.title} by {artist.artist_name}")

            return Response({"message": "Songs and videos imported successfully"}, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error importing songs and videos: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AdminPlaylistListView(APIView):
    def get(self, request):
        playlists = AdminPlaylists.objects.prefetch_related('admin_playlist_songs__song__genres__genre').all()
        serializer = AdminPlaylistSerializer(playlists, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = AdminPlaylistSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AdminPlaylistDetailView(APIView):
    def get(self, request, admin_playlist_id):
        try:
            playlist = AdminPlaylists.objects.prefetch_related(
                'admin_playlist_songs__song__genres__genre',
                'admin_playlist_songs__song__artist',
                'admin_playlist_songs__song__album'
            ).get(admin_playlist_id=admin_playlist_id)
            serializer = AdminPlaylistSerializer(playlist)
            logger.debug(f"AdminPlaylistDetailView data for playlist {admin_playlist_id}: {serializer.data}")
            return Response(serializer.data)
        except AdminPlaylists.DoesNotExist:
            return Response({'error': 'Playlist not found'}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request, admin_playlist_id):
        try:
            playlist = AdminPlaylists.objects.get(admin_playlist_id=admin_playlist_id)
            serializer = AdminPlaylistSerializer(playlist, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except AdminPlaylists.DoesNotExist:
            return Response({'error': 'Playlist not found'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, admin_playlist_id):
        try:
            playlist = AdminPlaylists.objects.get(admin_playlist_id=admin_playlist_id)
            playlist.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except AdminPlaylists.DoesNotExist:
            return Response({'error': 'Playlist not found'}, status=status.HTTP_404_NOT_FOUND)

class MessageListView(APIView):
    def get(self, request):
        user_id = request.query_params.get('user_id')
        other_user_id = request.query_params.get('other_user_id')
        
        if not user_id:
            return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # If other_user_id is provided, get conversation between these two users
            if other_user_id:
                messages = Message.objects.filter(
                    (Q(sender_id=user_id) & Q(receiver_id=other_user_id)) |
                    (Q(sender_id=other_user_id) & Q(receiver_id=user_id))
                ).order_by('sent_at')
            else:
                # Otherwise get all messages for this user
                messages = Message.objects.filter(
                    Q(sender_id=user_id) | Q(receiver_id=user_id)
                ).order_by('sent_at')
            
            serializer = MessageSerializer(messages, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error fetching messages: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request):
        serializer = MessageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MessageReadView(APIView):
    def post(self, request):
        user_id = request.data.get('user_id')
        sender_id = request.data.get('sender_id')
        
        if not user_id or not sender_id:
            return Response({"error": "user_id and sender_id are required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Mark all messages from sender to user as read
            Message.objects.filter(
                sender_id=sender_id,
                receiver_id=user_id,
                is_read=False
            ).update(is_read=True)
            
            return Response({"message": "Messages marked as read"}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error marking messages as read: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FriendRequestListView(APIView):
    def get(self, request):
        receiver_id = request.query_params.get('receiver_id')
        sender_id = request.query_params.get('sender_id')
        status = request.query_params.get('status', 'pending')
        
        if not (receiver_id or sender_id):
            return Response({"error": "Either receiver_id or sender_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            query = Q()
            if receiver_id:
                query &= Q(receiver_id=receiver_id)
            if sender_id:
                query &= Q(sender_id=sender_id)
            if status:
                query &= Q(status=status)
                
            friend_requests = FriendRequest.objects.filter(query).select_related('sender', 'receiver').order_by('-created_at')
            serializer = FriendRequestSerializer(friend_requests, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error fetching friend requests: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request):
        sender_id = request.data.get('sender_id')
        receiver_id = request.data.get('receiver_id')
        
        if not sender_id or not receiver_id:
            return Response({"error": "sender_id and receiver_id are required"}, status=status.HTTP_400_BAD_REQUEST)
        
        if sender_id == receiver_id:
            return Response({"error": "Cannot send friend request to yourself"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Check if users exist
            sender = Users.objects.get(user_id=sender_id)
            receiver = Users.objects.get(user_id=receiver_id)
            
            # Check if a friend request already exists
            existing_request = FriendRequest.objects.filter(
                (Q(sender_id=sender_id) & Q(receiver_id=receiver_id)) |
                (Q(sender_id=receiver_id) & Q(receiver_id=sender_id)),
                status='pending'
            ).first()
            
            if existing_request:
                return Response({"error": "A friend request already exists between these users"}, status=status.HTTP_409_CONFLICT)
            
            # Check if they are already friends (accepted request)
            existing_friendship = FriendRequest.objects.filter(
                (Q(sender_id=sender_id) & Q(receiver_id=receiver_id)) |
                (Q(sender_id=receiver_id) & Q(receiver_id=sender_id)),
                status='accepted'
            ).first()
            
            if existing_friendship:
                return Response({"error": "These users are already friends"}, status=status.HTTP_409_CONFLICT)
            
            # Create new friend request
            friend_request = FriendRequest.objects.create(
                sender_id=sender_id,
                receiver_id=receiver_id,
                status='pending'
            )
            
            serializer = FriendRequestSerializer(friend_request)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Users.DoesNotExist:
            return Response({"error": "One or both users not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error creating friend request: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FriendRequestDetailView(APIView):
    def get(self, request, request_id):
        try:
            friend_request = FriendRequest.objects.select_related('sender', 'receiver').get(request_id=request_id)
            serializer = FriendRequestSerializer(friend_request)
            return Response(serializer.data)
        except FriendRequest.DoesNotExist:
            return Response({"error": "Friend request not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error fetching friend request: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def delete(self, request, request_id):
        try:
            friend_request = FriendRequest.objects.get(request_id=request_id)
            friend_request.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except FriendRequest.DoesNotExist:
            return Response({"error": "Friend request not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error deleting friend request: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FriendRequestAcceptView(APIView):
    def post(self, request, request_id):
        try:
            friend_request = FriendRequest.objects.get(request_id=request_id)
            
            if friend_request.status != 'pending':
                return Response({"error": f"Friend request is already {friend_request.status}"}, status=status.HTTP_400_BAD_REQUEST)
            
            friend_request.status = 'accepted'
            friend_request.save()
            
            serializer = FriendRequestSerializer(friend_request)
            return Response(serializer.data)
        except FriendRequest.DoesNotExist:
            return Response({"error": "Friend request not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error accepting friend request: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FriendRequestRejectView(APIView):
    def post(self, request, request_id):
        try:
            friend_request = FriendRequest.objects.get(request_id=request_id)
            
            if friend_request.status != 'pending':
                return Response({"error": f"Friend request is already {friend_request.status}"}, status=status.HTTP_400_BAD_REQUEST)
            
            friend_request.status = 'rejected'
            friend_request.save()
            
            serializer = FriendRequestSerializer(friend_request)
            return Response(serializer.data)
        except FriendRequest.DoesNotExist:
            return Response({"error": "Friend request not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error rejecting friend request: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FriendsListView(APIView):
    def get(self, request, user_id):
        try:
            # Get all accepted friend requests where the user is either sender or receiver
            friend_requests = FriendRequest.objects.filter(
                (Q(sender_id=user_id) | Q(receiver_id=user_id)),
                status='accepted'
            ).select_related('sender', 'receiver')
            
            # Extract the friend IDs (the other user in each request)
            friend_ids = []
            for fr in friend_requests:
                friend_ids.append(fr.receiver_id if fr.sender_id == user_id else fr.sender_id)
            
            # Get the friend users
            friends = Users.objects.filter(user_id__in=friend_ids)
            serializer = UserSerializer(friends, many=True)
            
            return Response(serializer.data)
        except Users.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error fetching friends: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class VerifyPasswordView(APIView):
    def post(self, request):
        user_id = request.data.get('user_id')
        password = request.data.get('password')

        if not user_id or not password:
            return Response(
                {"message": "user_id and password are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = Users.objects.get(user_id=user_id)
            if check_password(password, user.password):
                return Response({"verified": True}, status=status.HTTP_200_OK)
            return Response(
                {"message": "Incorrect password", "verified": False},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except Users.DoesNotExist:
            return Response(
                {"message": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error verifying password: {str(e)}")
            return Response(
                {"message": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            