function Stats() {
    const stats = [
      { label: "Artwork", value: "27k+" },
      { label: "Auction", value: "25k+" },
      { label: "Artist", value: "12k+" },
    ]
  
    const avatars = Array(5).fill("/pictures/user_default.png");
  
    return (
      <section className="stats-section container" >
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-item">
              <span className="stat-label">{stat.label}</span>
              <span className="stat-value">{stat.value}</span>
            </div>
          ))}
  
          <div className="stat-item">
            <span className="stat-label">Songs</span>
            <span className="stat-value">2M+</span> 
            <div className="avatar-group">
              {avatars.map((avatar, index) => (
                <div key={index} className="avatar">
                  <img 
                    src={avatar || "/pictures/user_default.png"} 
                    alt={`User ${index + 1}`}
                    onError={(e) => e.target.src = "/pictures/user_default.png"} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }
  
  export default Stats
  
  
