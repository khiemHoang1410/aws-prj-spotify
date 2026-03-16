import "./style/PageIntro.css";
import HeroSection from "../pages_components/intropage/HeroSection";
import Stats from "../pages_components/intropage/Stats";
import Trending from "../pages_components/intropage/Trending";
import TopArtists from "../pages_components/intropage/TopArtists";
import PartnerLogos from "../pages_components/intropage/PartnerLogos";
import SubscribeSection from "../pages_components/intropage/SubscribeSection";
import Banner from "../pages_components/intropage/Banner";
import Header from "../pages_components/intropage/Header";

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