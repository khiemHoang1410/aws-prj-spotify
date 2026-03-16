import os
import requests
import logging
from django.http import StreamingHttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Songs
from django.core.validators import URLValidator
from django.core.exceptions import ValidationError

logger = logging.getLogger(__name__)

RAPIDAPI_KEY = os.environ.get('86253f5b37058bbb95b5d9cdf1b7d1be449680ee')
DEEZER_API_HOST = "deezerdevs-deezer.p.rapidapi.com"

class SongStreamView(APIView):
    def get(self, request, id):
        try:
            song = Songs.objects.get(id=id)

            if song.audio_url and song.audio_url.startswith(('http://', 'https://')):
                try:
                    res = requests.get(song.audio_url, stream=True, timeout=10)
                    res.raise_for_status()
                    content_type = res.headers.get('Content-Type', '').lower()
                    if not content_type.startswith('audio/mpeg'):
                        logger.warning(f"Invalid audio content type for {song.audio_url}: {content_type}")
                        raise ValueError("URL does not point to a valid MP3 audio file")
                    response = StreamingHttpResponse(res.iter_content(chunk_size=8192), content_type='audio/mpeg')
                    response['Cache-Control'] = 'public, max-age=86400'
                    return response
                except (requests.RequestException, ValueError) as e:
                    logger.error(f"[Audio URL Error] {e}")

            if not RAPIDAPI_KEY:
                return Response({"error": "API key not configured"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            
            preview_url = self.search_deezer_preview(song)
            if preview_url:
                song.audio_url = preview_url
                song.save()
                res = requests.get(preview_url, stream=True, timeout=10)
                res.raise_for_status()
                response = StreamingHttpResponse(res.iter_content(chunk_size=8192), content_type='audio/mpeg')
                response['Cache-Control'] = 'public, max-age=86400'
                return response

            demo_audio = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
            res = requests.get(demo_audio, stream=True, timeout=10)
            res.raise_for_status()
            song.audio_url = demo_audio
            song.save()
            response = StreamingHttpResponse(res.iter_content(chunk_size=8192), content_type='audio/mpeg')
            response['Cache-Control'] = 'public, max-age=86400'
            return response

        except Songs.DoesNotExist:
            return Response({"error": "Song not found"}, status=status.HTTP_404_NOT_FOUND)
        except requests.RequestException as e:
            logger.error(f"Error streaming song {id}: {str(e)}")
            return Response({"error": "Failed to stream audio"}, status=status.HTTP_502_BAD_GATEWAY)
        except Exception as e:
            logger.error(f"Unexpected error in SongStreamView: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def search_deezer_preview(self, song):
        query = f"{song.title} {song.artist.artist_name if song.artist else ''}"
        url = f"https://{DEEZER_API_HOST}/search?q={query}"
        headers = {
            "X-RapidAPI-Key": RAPIDAPI_KEY,
            "X-RapidAPI-Host": DEEZER_API_HOST
        }
        try:
            res = requests.get(url, headers=headers, timeout=10)
            res.raise_for_status()
            data = res.json().get('data', [])
            if data:
                return data[0].get('preview')
            logger.warning(f"No preview found for song: {query}")
            return None
        except requests.RequestException as e:
            logger.error(f"[Deezer Search Error] {e}")
            return None

class SongSearchAPIView(APIView):
    def get(self, request, id):
        try:
            song = Songs.objects.get(id=id)
            query = f"{song.title} {song.artist.artist_name if song.artist else ''}"
            results = []

            if not RAPIDAPI_KEY:
                return Response({"error": "API key not configured"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

            headers = {
                "X-RapidAPI-Key": RAPIDAPI_KEY,
                "X-RapidAPI-Host": DEEZER_API_HOST
            }
            url = f"https://{DEEZER_API_HOST}/search?q={query}"
            res = requests.get(url, headers=headers, timeout=10)
            res.raise_for_status()
            for item in res.json().get('data', []):
                results.append({
                    'source': 'Deezer',
                    'title': item.get('title'),
                    'artist': item.get('artist', {}).get('name'),
                    'audio_url': item.get('preview'),
                    'duration': item.get('duration'),
                    'artwork': item.get('album', {}).get('cover_big'),
                })

            return Response({
                'song': {
                    'id': song.id,
                    'title': song.title,
                    'artist': song.artist.artist_name if song.artist else '',
                },
                'results': results if results else [],
                'message': 'No audio sources found' if not results else None
            })

        except Songs.DoesNotExist:
            return Response({"error": "Song not found"}, status=status.HTTP_404_NOT_FOUND)
        except requests.RequestException as e:
            logger.error(f"Error searching song {id}: {str(e)}")
            return Response({"error": "Failed to search audio"}, status=status.HTTP_502_BAD_GATEWAY)
        except Exception as e:
            logger.error(f"Unexpected error in SongSearchAPIView: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UpdateSongAudioURLView(APIView):
    def post(self, request, id):
        try:
            song = Songs.objects.get(id=id)
            audio_url = request.data.get('audio_url')
            if not audio_url:
                return Response({"error": "audio_url is required"}, status=status.HTTP_400_BAD_REQUEST)

            validator = URLValidator()
            try:
                validator(audio_url)
            except ValidationError:
                return Response({"error": "Invalid URL format"}, status=status.HTTP_400_BAD_REQUEST)

            try:
                head_response = requests.head(audio_url, timeout=5)
                head_response.raise_for_status()
                if 'audio' not in head_response.headers.get('Content-Type', ''):
                    return Response({"error": "URL does not point to an audio file"}, status=status.HTTP_400_BAD_REQUEST)
            except requests.RequestException as e:
                return Response({"error": f"Could not access URL: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

            song.audio_url = audio_url
            song.save()

            return Response({
                "message": "Audio URL updated successfully",
                "song": {
                    "id": song.id,
                    "title": song.title,
                    "audio_url": song.audio_url
                }
            })

        except Songs.DoesNotExist:
            return Response({"error": "Song not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error in UpdateSongAudioURLView: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)