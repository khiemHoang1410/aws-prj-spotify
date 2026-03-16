
function Playlists() {
  const playlists = [
    {
      id: 1,
      title: "Summer Vibes",
      cover: "/images/playlists/summer-vibes.jpg",
      gradient: "linear-gradient(135deg, #FF9966, #FF5E62)",
    },
    {
      id: 2,
      title: "Mind Right",
      cover: "/images/playlists/mind-right.jpg",
      gradient: "linear-gradient(135deg, #5B247A, #1BCEDF)",
    },
    {
      id: 3,
      title: "Ultimate Indie",
      cover: "/images/playlists/ultimate-indie.jpg",
      gradient: "linear-gradient(135deg, #184E68, #57CA85)",
    },
    {
      id: 4,
      title: "Jazzy Dinner",
      cover: "/images/playlists/jazzy-dinner.jpg",
      gradient: "linear-gradient(135deg, #F5515F, #A1051D)",
    },
    {
      id: 5,
      title: "Pop Hits",
      cover: "/images/playlists/pop-hits.jpg",
      gradient: "linear-gradient(135deg, #004FF9, #FFF94C)",
    },
    {
      id: 6,
      title: "Roots Rising",
      cover: "/images/playlists/roots-rising.jpg",
      gradient: "linear-gradient(135deg, #C33764, #1D2671)",
    },
  ]

  return (
    <section className="playlists-section">
      <div className="section-header">
        <h2 className="section-title">Playlists</h2>
      </div>

      <div className="playlists-grid">
        {playlists.map((playlist) => (
          <div key={playlist.id} className="playlist-card" style={{ background: playlist.gradient }}>
            <div className="playlist-content">
              <h3 className="playlist-title">{playlist.title}</h3>
              <div className="playlist-image">
                <img src={playlist.cover || "/placeholder.svg"} alt={playlist.title} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Playlists

