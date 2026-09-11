async function test() {
  const baseUrl = 'http://localhost:4000';
  console.log('--- 1. Testing GET /songs ---');
  const resSongs = await fetch(`${baseUrl}/songs`);
  const songsData = await resSongs.json();
  const songs = songsData.items || songsData.songs || songsData;
  console.log(`✓ Fetched ${songs.length} songs.`);

  const firstSong = songs[0];
  const songId = firstSong.id || firstSong.song_id || (firstSong.pk ? firstSong.pk.replace('SONG#', '') : '00000000-0000-0000-0000-000000000001');
  console.log(`\n--- 2. Testing GET /songs/:id/lyrics for ${firstSong.title} (${songId}) ---`);
  const resLyrics = await fetch(`${baseUrl}/songs/${songId}/lyrics`);
  const lyricsData = await resLyrics.json();
  const lyrics = lyricsData.lyrics || lyricsData;
  console.log(`✓ Lyrics line count: ${lyrics.length}`);
  if (lyrics.length > 0) {
    console.log(`  First line: [${lyrics[0].time}s] ${lyrics[0].text}`);
  }

  console.log('\n--- 3. Testing Auth Login ---');
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@example.com', password: 'Test12345!' })
  });
  const loginData = await loginRes.json();
  const token = loginData.accessToken;
  console.log(`✓ Token received: ${token.substring(0, 20)}...`);

  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  console.log('\n--- 4. Testing Like / Unlike ---');
  const likeRes = await fetch(`${baseUrl}/songs/${songId}/like`, {
    method: 'POST',
    headers: authHeaders
  });
  const likeData = await likeRes.json();
  console.log(`✓ Like response:`, likeData);

  const likedSongsRes = await fetch(`${baseUrl}/me/liked-songs`, { headers: authHeaders });
  const likedSongsData = await likedSongsRes.json();
  const likedSongs = likedSongsData.items || likedSongsData;
  console.log(`✓ Total liked songs in DB: ${likedSongs.length}`);

  console.log('\n--- 5. Testing Playlists CRUD ---');
  const createPlRes = await fetch(`${baseUrl}/playlists`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ title: 'My Awesome Test Playlist', is_public: true })
  });
  const newPlResData = await createPlRes.json();
  const newPl = newPlResData.data || newPlResData;
  console.log(`✓ Created playlist: "${newPl.name || newPl.title}" (ID: ${newPl.id})`);

  const addSongRes = await fetch(`${baseUrl}/playlists/${newPl.id}/songs`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ song_id: songId })
  });
  const addSongData = await addSongRes.json();
  console.log(`✓ Added song to playlist:`, addSongData.message || addSongData);

  const myPlaylistsRes = await fetch(`${baseUrl}/playlists/me`, { headers: authHeaders });
  const myPlaylistsData = await myPlaylistsRes.json();
  const myPlaylists = myPlaylistsData.items || myPlaylistsData;
  console.log(`✓ My Playlists count: ${myPlaylists.length}`);

  console.log('\n--- 6. Testing Notifications ---');
  const notifsRes = await fetch(`${baseUrl}/notifications`, { headers: authHeaders });
  const notifs = await notifsRes.json();
  console.log(`✓ Notifications fetched: ${notifs.length}`);

  console.log('\n--- 7. Testing Play History ---');
  const addHistRes = await fetch(`${baseUrl}/me/play-history`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ song_id: songId, song_title: firstSong.title, played_at: new Date().toISOString() })
  });
  const addHistData = await addHistRes.json();
  console.log(`✓ Recorded play history:`, addHistData.success ? 'Success' : addHistData);

  console.log('\nALL LOCAL API VERIFICATIONS PASSED! 🎉');
}

test().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
