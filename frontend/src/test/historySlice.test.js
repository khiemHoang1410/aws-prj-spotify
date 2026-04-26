import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import historyReducer, {
  addEntryOptimistic,
  clearEntries,
  setEntries,
  removeEntry,
  loadHistory,
  clearAllHistory,
} from '../store/historySlice';
import authReducer, { logout, loginSuccess } from '../store/authSlice';

// ─── Mock apiClient ───────────────────────────────────────────────────────────
vi.mock('../services/apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

// ─── Mock import.meta.env ─────────────────────────────────────────────────────
vi.stubEnv('VITE_API_URL', 'https://api.test');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeSong = (overrides = {}) => ({
  song_id: 'song-1',
  title: 'Test Song',
  artist_name: 'Test Artist',
  artist_id: 'artist-1',
  image_url: 'https://img.test/cover.jpg',
  audio_url: 'https://audio.test/song.mp3',
  duration: 180,
  ...overrides,
});

const makeEntry = (overrides = {}) => ({
  entryId: 'entry-1',
  songId: 'song-1',
  title: 'Test Song',
  artist_name: 'Test Artist',
  artist_id: 'artist-1',
  image_url: 'https://img.test/cover.jpg',
  audio_url: 'https://audio.test/song.mp3',
  duration: 180,
  played_at: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

/** Tạo store với cả auth + history để test cross-slice */
const makeStore = (preloadedState = {}) =>
  configureStore({
    reducer: { history: historyReducer, auth: authReducer },
    preloadedState,
  });

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('historySlice — reducers', () => {
  it('initialState đúng', () => {
    const store = makeStore();
    const state = store.getState().history;
    expect(state.entries).toEqual([]);
    expect(state.hasMore).toBe(true);
    expect(state.isLoading).toBe(false);
    expect(state.isSyncing).toBe(false);
    expect(state.hasSyncedOnLogin).toBe(false);
  });

  it('addEntryOptimistic thêm entry vào đầu danh sách', () => {
    const store = makeStore();
    store.dispatch(addEntryOptimistic(makeSong()));
    const { entries } = store.getState().history;
    expect(entries).toHaveLength(1);
    expect(entries[0].songId).toBe('song-1');
    expect(entries[0]._isTemp).toBe(true);
  });

  it('addEntryOptimistic dedup — không có 2 entry cùng songId', () => {
    const store = makeStore();
    store.dispatch(addEntryOptimistic(makeSong({ song_id: 'song-1' })));
    store.dispatch(addEntryOptimistic(makeSong({ song_id: 'song-2' })));
    store.dispatch(addEntryOptimistic(makeSong({ song_id: 'song-1' }))); // duplicate
    const { entries } = store.getState().history;
    expect(entries).toHaveLength(2);
    expect(entries[0].songId).toBe('song-1'); // song-1 mới nhất ở đầu
    expect(entries[1].songId).toBe('song-2');
  });

  it('setEntries ghi đè toàn bộ entries', () => {
    const store = makeStore();
    store.dispatch(addEntryOptimistic(makeSong()));
    store.dispatch(setEntries({
      items: [makeEntry({ entryId: 'e1', songId: 'song-99', title: 'New Song' })],
      nextCursor: null,
    }));
    const { entries } = store.getState().history;
    expect(entries).toHaveLength(1);
    expect(entries[0].songId).toBe('song-99');
  });

  it('setEntries dedup theo songId — giữ entry đầu tiên', () => {
    const store = makeStore();
    store.dispatch(setEntries({
      items: [
        makeEntry({ entryId: 'e1', songId: 'song-1' }),
        makeEntry({ entryId: 'e2', songId: 'song-1' }), // duplicate
        makeEntry({ entryId: 'e3', songId: 'song-2' }),
      ],
      nextCursor: null,
    }));
    const { entries } = store.getState().history;
    expect(entries).toHaveLength(2);
    expect(entries[0].entryId).toBe('e1');
  });

  it('removeEntry xóa đúng entry theo entryId', () => {
    const store = makeStore({
      history: {
        entries: [makeEntry({ entryId: 'e1' }), makeEntry({ entryId: 'e2', songId: 'song-2' })],
        hasMore: false, nextCursor: null, isLoading: false, isSyncing: false, hasSyncedOnLogin: false,
      },
    });
    store.dispatch(removeEntry('e1'));
    const { entries } = store.getState().history;
    expect(entries).toHaveLength(1);
    expect(entries[0].entryId).toBe('e2');
  });

  it('clearEntries reset về rỗng', () => {
    const store = makeStore({
      history: {
        entries: [makeEntry()],
        hasMore: false, nextCursor: 'cursor-abc', isLoading: false, isSyncing: false, hasSyncedOnLogin: false,
      },
    });
    store.dispatch(clearEntries());
    const { entries, hasMore, nextCursor } = store.getState().history;
    expect(entries).toEqual([]);
    expect(hasMore).toBe(true);
    expect(nextCursor).toBeNull();
  });
});

// ─── Bug fix: logout phải clear history ───────────────────────────────────────

describe('historySlice — logout clears history (bug fix)', () => {
  it('dispatch auth/logout → entries bị xóa', () => {
    const store = makeStore({
      history: {
        entries: [makeEntry(), makeEntry({ entryId: 'e2', songId: 'song-2' })],
        hasMore: false, nextCursor: null, isLoading: false, isSyncing: false, hasSyncedOnLogin: true,
      },
    });

    // Xác nhận có data trước
    expect(store.getState().history.entries).toHaveLength(2);

    // Logout
    store.dispatch(logout());

    // History phải bị clear
    const { entries, hasSyncedOnLogin } = store.getState().history;
    expect(entries).toEqual([]);
    expect(hasSyncedOnLogin).toBe(false); // reset về initialState
  });

  it('dispatch auth/logout → auth state cũng reset', () => {
    const store = makeStore({
      auth: {
        isAuthenticated: true,
        user: { user_id: 'u1', name: 'Test' },
        isModalOpen: false, modalType: 'login', likedSongs: [],
        verifyStatus: 'idle', verifyMessage: '', followedArtists: [],
        forgotPasswordModalOpen: false, loginPrefillEmail: '', isRestoring: false,
      },
    });

    store.dispatch(logout());

    const auth = store.getState().auth;
    expect(auth.isAuthenticated).toBe(false);
    expect(auth.user).toBeNull();
  });
});

// ─── Bug fix: loadHistory phải bail out khi isRestoring = true ───────────────

describe('historySlice — loadHistory thunk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('bail out khi isRestoring = true — không gọi API, không set entries', async () => {
    const { default: apiClient } = await import('../services/apiClient');
    const store = makeStore({
      auth: {
        isAuthenticated: false, user: null, isRestoring: true,
        isModalOpen: false, modalType: 'login', likedSongs: [],
        verifyStatus: 'idle', verifyMessage: '', followedArtists: [],
        forgotPasswordModalOpen: false, loginPrefillEmail: '',
      },
    });

    await store.dispatch(loadHistory());

    expect(apiClient.get).not.toHaveBeenCalled();
    // entries vẫn là initialState (rỗng)
    expect(store.getState().history.entries).toEqual([]);
  });

  it('trả entries rỗng khi isRestoring=false và isAuthenticated=false', async () => {
    const { default: apiClient } = await import('../services/apiClient');

    // Giả sử localStorage có data cũ từ session trước
    localStorage.setItem('spotify_play_history', JSON.stringify([makeEntry()]));

    const store = makeStore({
      auth: {
        isAuthenticated: false, user: null, isRestoring: false,
        isModalOpen: false, modalType: 'login', likedSongs: [],
        verifyStatus: 'idle', verifyMessage: '', followedArtists: [],
        forgotPasswordModalOpen: false, loginPrefillEmail: '',
      },
    });

    await store.dispatch(loadHistory());

    // Không gọi API
    expect(apiClient.get).not.toHaveBeenCalled();
    // Entries phải rỗng — không load từ localStorage sau khi đã logout
    expect(store.getState().history.entries).toEqual([]);
  });

  it('gọi API khi isAuthenticated=true và isRestoring=false', async () => {
    const { default: apiClient } = await import('../services/apiClient');
    apiClient.get.mockResolvedValueOnce({
      items: [{ entryId: 'e1', songId: 'song-1', songTitle: 'Test', artistName: 'Artist', duration: 180 }],
      nextCursor: null,
    });

    const store = makeStore({
      auth: {
        isAuthenticated: true,
        user: { user_id: 'u1' },
        isRestoring: false,
        isModalOpen: false, modalType: 'login', likedSongs: [],
        verifyStatus: 'idle', verifyMessage: '', followedArtists: [],
        forgotPasswordModalOpen: false, loginPrefillEmail: '',
      },
    });

    await store.dispatch(loadHistory());

    expect(apiClient.get).toHaveBeenCalledWith(
      '/users/u1/play-history?limit=20',
      { silent: true }
    );
    expect(store.getState().history.entries).toHaveLength(1);
    expect(store.getState().history.entries[0].songId).toBe('song-1');
  });

  it('fallback localStorage khi API lỗi và đã authenticated', async () => {
    const { default: apiClient } = await import('../services/apiClient');
    apiClient.get.mockRejectedValueOnce(new Error('Network error'));

    localStorage.setItem('spotify_play_history', JSON.stringify([
      makeEntry({ entryId: 'local-1', songId: 'song-local' }),
    ]));

    const store = makeStore({
      auth: {
        isAuthenticated: true,
        user: { user_id: 'u1' },
        isRestoring: false,
        isModalOpen: false, modalType: 'login', likedSongs: [],
        verifyStatus: 'idle', verifyMessage: '', followedArtists: [],
        forgotPasswordModalOpen: false, loginPrefillEmail: '',
      },
    });

    await store.dispatch(loadHistory());

    // Fallback về localStorage khi API lỗi
    expect(store.getState().history.entries).toHaveLength(1);
    expect(store.getState().history.entries[0].songId).toBe('song-local');
  });
});

// ─── clearAllHistory thunk ────────────────────────────────────────────────────

describe('historySlice — clearAllHistory thunk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('xóa entries và localStorage khi authenticated', async () => {
    const { default: apiClient } = await import('../services/apiClient');
    apiClient.delete.mockResolvedValueOnce({});

    localStorage.setItem('spotify_play_history', JSON.stringify([makeEntry()]));

    const store = makeStore({
      history: {
        entries: [makeEntry()],
        hasMore: false, nextCursor: null, isLoading: false, isSyncing: false, hasSyncedOnLogin: false,
      },
      auth: {
        isAuthenticated: true, user: { user_id: 'u1' }, isRestoring: false,
        isModalOpen: false, modalType: 'login', likedSongs: [],
        verifyStatus: 'idle', verifyMessage: '', followedArtists: [],
        forgotPasswordModalOpen: false, loginPrefillEmail: '',
      },
    });

    await store.dispatch(clearAllHistory());

    expect(apiClient.delete).toHaveBeenCalledWith('/me/play-history');
    expect(store.getState().history.entries).toEqual([]);
    expect(localStorage.getItem('spotify_play_history')).toBeNull();
  });

  it('xóa entries và localStorage khi không authenticated (guest)', async () => {
    const { default: apiClient } = await import('../services/apiClient');

    localStorage.setItem('spotify_play_history', JSON.stringify([makeEntry()]));

    const store = makeStore({
      history: {
        entries: [makeEntry()],
        hasMore: false, nextCursor: null, isLoading: false, isSyncing: false, hasSyncedOnLogin: false,
      },
      auth: {
        isAuthenticated: false, user: null, isRestoring: false,
        isModalOpen: false, modalType: 'login', likedSongs: [],
        verifyStatus: 'idle', verifyMessage: '', followedArtists: [],
        forgotPasswordModalOpen: false, loginPrefillEmail: '',
      },
    });

    await store.dispatch(clearAllHistory());

    expect(apiClient.delete).not.toHaveBeenCalled();
    expect(store.getState().history.entries).toEqual([]);
    expect(localStorage.getItem('spotify_play_history')).toBeNull();
  });
});
