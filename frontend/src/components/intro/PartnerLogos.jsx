function PartnerLogos() {
    const partners = [
      { name: "Megascans", logo: "../public/pictures/logo-megascans.png" },
      { name: "Unreal Engine", logo: "../public/pictures/logo-unreal.png" },
      { name: "Metamask", logo: "../public/pictures/logo-metamask.png" },
      { name: "Binance", logo: "../public/pictures/logo-binance.png" },
      { name: "Oculus", logo: "../public/pictures/logo-oculus.png" },
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
  
  
