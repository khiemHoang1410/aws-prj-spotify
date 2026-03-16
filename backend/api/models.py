from django.db import models
from django.core.validators import MinValueValidator
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

class Users(models.Model):
    user_id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=50, unique=True)
    email = models.CharField(max_length=100, unique=True)
    password = models.CharField(max_length=255)
    full_name = models.CharField(max_length=100, null=True, blank=True)
    avatar_url = models.CharField(max_length=255, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['username']),
            models.Index(fields=['email']),
        ]

class Artists(models.Model):
    artist_id = models.AutoField(primary_key=True)
    artist_name = models.CharField(max_length=100, unique=True)
    bio = models.TextField(null=True, blank=True)
    image_url = models.CharField(max_length=255, null=True, blank=True)
    background = models.CharField(max_length=255, null=True, blank=True)
    nationality = models.CharField(max_length=50, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['artist_name']),
        ]

class Albums(models.Model):
    album_id = models.AutoField(primary_key=True)
    album_name = models.CharField(max_length=100)
    album_title = models.CharField(max_length=100)
    artist = models.ForeignKey(Artists, on_delete=models.CASCADE, related_name='albums')
    release_date = models.DateField(null=True, blank=True)
    cover_url = models.CharField(max_length=255, null=True, blank=True)
    total_songs = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    total_duration = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    copyright = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['artist']),
        ]

class Genres(models.Model):
    genre_id = models.AutoField(primary_key=True)
    genre_name = models.CharField(max_length=50, unique=True)
    description = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['genre_name']),
        ]

class Songs(models.Model):
    song_id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=100)
    artist = models.ForeignKey(Artists, on_delete=models.CASCADE, related_name='songs')
    album = models.ForeignKey(Albums, on_delete=models.SET_NULL, null=True, blank=True, related_name='songs')
    duration = models.IntegerField(validators=[MinValueValidator(0)])
    audio_url = models.CharField(max_length=255, null=True, blank=True)
    audio_file = models.BinaryField(null=True, blank=True)
    image_url = models.CharField(max_length=255, null=True, blank=True)
    image_file = models.BinaryField(null=True, blank=True)
    vinyl_background = models.CharField(max_length=255, null=True, blank=True)
    listeners = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    total_likes = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    explicit = models.BooleanField(default=False)
    lyrics = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['artist']),
            models.Index(fields=['album']),
            models.Index(fields=['listeners']),
            models.Index(fields=['total_likes']),
        ]

class SongGenres(models.Model):
    song = models.ForeignKey(Songs, on_delete=models.CASCADE, related_name='genres')
    genre = models.ForeignKey(Genres, on_delete=models.CASCADE, related_name='songs')

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['song', 'genre'], name='unique_song_genre')
        ]

class Video(models.Model):
    video_id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=100)
    artist = models.ForeignKey(Artists, on_delete=models.CASCADE, related_name='videos')
    album = models.ForeignKey(Albums, on_delete=models.SET_NULL, null=True, blank=True, related_name='videos')
    duration = models.IntegerField(validators=[MinValueValidator(0)])
    video_url = models.CharField(max_length=255, null=True, blank=True)
    video_file = models.BinaryField(null=True, blank=True)
    listeners = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    total_likes = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    explicit = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['artist']),
            models.Index(fields=['album']),
            models.Index(fields=['listeners']),
            models.Index(fields=['total_likes']),
        ]

class VideoGenres(models.Model):
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name='genres')
    genre = models.ForeignKey(Genres, on_delete=models.CASCADE, related_name='videos')

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['video', 'genre'], name='unique_video_genre')
        ]

class AdminPlaylists(models.Model):
    admin_playlist_id = models.AutoField(primary_key=True)
    playlist_name = models.CharField(max_length=100)
    is_public = models.BooleanField(default=True)
    total_songs = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class UserPlaylists(models.Model):
    user_playlist_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(Users, on_delete=models.CASCADE, related_name='playlists')
    playlist_name = models.CharField(max_length=100)
    playlist_number = models.IntegerField()
    is_public = models.BooleanField(default=False)
    total_songs = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'playlist_number'], name='unique_user_playlist_number'),
            models.UniqueConstraint(fields=['user', 'playlist_name'], name='unique_user_playlist_name')
        ]

    def save(self, *args, **kwargs):
        if not self.playlist_number:
            max_number = UserPlaylists.objects.filter(user=self.user).aggregate(models.Max('playlist_number'))['playlist_number__max'] or 0
            self.playlist_number = max_number + 1
        super().save(*args, **kwargs)

class AdminPlaylistSongs(models.Model):
    playlist = models.ForeignKey(AdminPlaylists, on_delete=models.CASCADE, related_name='admin_playlist_songs')
    song = models.ForeignKey(Songs, on_delete=models.CASCADE, related_name='admin_playlists')

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['playlist', 'song'], name='unique_admin_playlist_song')
        ]

class UserPlaylistSongs(models.Model):
    playlist = models.ForeignKey(UserPlaylists, on_delete=models.CASCADE, related_name='user_playlist_songs')
    song = models.ForeignKey(Songs, on_delete=models.CASCADE, related_name='user_playlists')

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['playlist', 'song'], name='unique_user_playlist_song')
        ]

class Likes(models.Model):
    user = models.ForeignKey(Users, on_delete=models.CASCADE, related_name='likes')
    song = models.ForeignKey(Songs, on_delete=models.CASCADE, null=True, blank=True, related_name='likes')
    video = models.ForeignKey(Video, on_delete=models.CASCADE, null=True, blank=True, related_name='likes')
    album = models.ForeignKey(Albums, on_delete=models.CASCADE, null=True, blank=True, related_name='likes')
    liked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'song'], name='unique_user_song_like', condition=models.Q(song__isnull=False)),
            models.UniqueConstraint(fields=['user', 'video'], name='unique_user_video_like', condition=models.Q(video__isnull=False)),
        ]

class ListeningHistory(models.Model):
    history_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(Users, on_delete=models.CASCADE, related_name='listening_history')
    song = models.ForeignKey(Songs, on_delete=models.CASCADE, null=True, blank=True, related_name='listening_history')
    video = models.ForeignKey(Video, on_delete=models.CASCADE, null=True, blank=True, related_name='listening_history')
    playlist = models.ForeignKey(UserPlaylists, on_delete=models.SET_NULL, null=True, blank=True, related_name='listening_history')
    listened_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['song']),
            models.Index(fields=['video']),
            models.Index(fields=['listened_at']),
        ]
        
class Message(models.Model):
    message_id = models.AutoField(primary_key=True)
    sender = models.ForeignKey(Users, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(Users, on_delete=models.CASCADE, related_name='received_messages')
    text = models.TextField()
    is_read = models.BooleanField(default=False)
    sent_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['sender']),
            models.Index(fields=['receiver']),
            models.Index(fields=['sent_at']),
        ]

class FriendRequest(models.Model):
    request_id = models.AutoField(primary_key=True)
    sender = models.ForeignKey(Users, on_delete=models.CASCADE, related_name='sent_friend_requests')
    receiver = models.ForeignKey(Users, on_delete=models.CASCADE, related_name='received_friend_requests')
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected')
    ], default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['sender']),
            models.Index(fields=['receiver']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['sender', 'receiver'], 
                name='unique_friend_request',
                condition=models.Q(status='pending')
            )
        ]


# Signals để cập nhật total_songs
@receiver(post_save, sender=AdminPlaylistSongs)
@receiver(post_delete, sender=AdminPlaylistSongs)
def update_admin_total_songs(sender, instance, **kwargs):
    playlist = instance.playlist
    playlist.total_songs = playlist.admin_playlist_songs.count()
    playlist.save()

@receiver(post_save, sender=UserPlaylistSongs)
@receiver(post_delete, sender=UserPlaylistSongs)
def update_user_total_songs(sender, instance, **kwargs):
    playlist = instance.playlist
    playlist.total_songs = playlist.user_playlist_songs.count()
    playlist.save()

# Signals để cập nhật total_likes
@receiver(post_save, sender=Likes)
def update_total_likes_on_save(sender, instance, **kwargs):
    if instance.song:
        song = instance.song
        song.total_likes = song.likes.count()
        song.save()
    elif instance.video:
        video = instance.video
        video.total_likes = video.likes.count()
        video.save()

@receiver(post_delete, sender=Likes)
def update_total_likes_on_delete(sender, instance, **kwargs):
    if instance.song:
        song = instance.song
        song.total_likes = song.likes.count()
        song.save()
    elif instance.video:
        video = instance.video
        video.total_likes = video.likes.count()
        video.save()
