function PartnerLogos() {
    const partners = [
      { name: "Megascans", logo: "/pictures/logo-megascans.png" },
      { name: "Unreal Engine", logo: "/pictures/logo-unreal.png" },
      { name: "Metamask", logo: "/pictures/logo-metamask.png" },
      { name: "Binance", logo: "/pictures/logo-binance.png" },
      { name: "Oculus", logo: "/pictures/logo-oculus.png" },
    ]
  
    return (
      <section className="partners-section container">
        <div className="partners-grid">
          {partners.map((partner, index) => (
            <div key={index} className="partner-logo">
              <img 
                src={partner.logo} 
                alt={partner.name}
                onError={(e) => e.target.src = "/pictures/user_default.png"} />
            </div>
          ))}
        </div>
      </section>
    )
  }
  
  export default PartnerLogos
  
  
