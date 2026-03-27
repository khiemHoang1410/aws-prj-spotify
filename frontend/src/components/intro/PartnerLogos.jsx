function PartnerLogos() {
    const partners = [
      { name: "Megascans", logo: "/logo-megascans.png" },
      { name: "Unreal Engine", logo: "/logo-unreal.png" },
      { name: "Metamask", logo: "/logo-metamask.png" },
      { name: "Binance", logo: "/logo-binance.png" },
      { name: "Oculus", logo: "/logo-oculus.png" },
    ]
  
    return (
      <section className="partners-section container">
        <div className="partners-grid">
          {partners.map((partner, index) => (
            <div key={index} className="partner-logo">
              <img src={partner.logo || "/placeholder.svg"} alt={partner.name} />
            </div>
          ))}
        </div>
      </section>
    )
  }
  
  export default PartnerLogos
  
  