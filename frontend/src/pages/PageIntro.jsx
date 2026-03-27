import "../styles/PageIntro/PageIntro.css";
import HeroSection from "../components/intro/HeroSection";
import Stats from "../components/intro/Stats";
import Trending from "../components/intro/Trending";
import TopArtists from "../components/intro/TopArtists";
import PartnerLogos from "../components/intro/PartnerLogos";
import SubscribeSection from "../components/intro/SubscribeSection";
import Banner from "../components/intro/Banner";
import Header from "../components/intro/Header";


function PageIntro() {
  return (
    <div className="app1">
      <Header />
      <div id="home">
        <HeroSection />
      </div>
      <div id="stats">
        <Stats />
      </div>
      <div id="partners">
        <PartnerLogos />
      </div>
      <div id="trending">
        <Trending />
      </div>
      <div id="top-artists">
        <TopArtists />
      </div>
      <div id="banner">
        <Banner />
      </div>
      <div id="subscribe">
        <SubscribeSection />
      </div>
    </div>
  );
}

export default PageIntro;