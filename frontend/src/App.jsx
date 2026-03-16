"use client";

import { useState, useCallback, Component } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PageMain from "./components/pages/PageMain";
import PageIntro from "./components/pages/PageIntro";
import PageLogin from "./components/pages/PageLogin";
import PageSignup from "./components/pages/PageSignup";
import PlaylistDetail from "./components/pages_components/mainpage/PlaylistDetail";

class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught in ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "20px", textAlign: "center" }}>
          <h1>Something went wrong.</h1>
          <p>{this.state.error?.message || "An unexpected error occurred."}</p>
          <button onClick={() => window.location.reload()}>Reload Page</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [searchResults, setSearchResults] = useState({ songs: [], albums: [], artists: [] });
  const [query, setQuery] = useState("");
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Failed to parse user from localStorage:", error);
      return null;
    }
  });
  const [currentSong, setCurrentSong] = useState(null);
  const [queue, setQueue] = useState([]);

  const handleSearch = async (searchQuery) => {
    setQuery(searchQuery);
    if (!searchQuery.trim()) {
      setSearchResults({ songs: [], albums: [], artists: [] });
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8000/api/search/?query=${encodeURIComponent(searchQuery)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Error fetching search results:", error);
      setSearchResults({ songs: [], albums: [], artists: [] });
    }
  };

  const playSong = useCallback((song) => {
    if (song) {
      setCurrentSong(song);
    }
  }, []);

  const addToQueue = useCallback((song) => {
    if (song) {
      setQueue((prev) => [...prev, song]);
    }
  }, []);

  const playNext = useCallback((song) => {
    if (song) {
      setQueue((prev) => [song, ...prev]);
    }
  }, []);

  return (
    
        <div className="app">
          <Routes>
            <Route
              path="/main/*"
              element={
                <PageMain
                  onSearch={handleSearch}
                  searchResults={searchResults}
                  query={query}
                  user={user}
                  setUser={setUser}
                  playSong={playSong}
                  currentSong={currentSong}
                  addToQueue={addToQueue}
                  playNext={playNext}
                />
              }
            />
            <Route path="/intro" element={<PageIntro />} />
            <Route path="/login" element={<PageLogin setUser={setUser} />} />
            <Route path="/signup" element={<PageSignup setUser={setUser} />} />
            <Route path="*" element={<PageIntro />} />
          </Routes>
        </div>
      
  );
}

export default App;