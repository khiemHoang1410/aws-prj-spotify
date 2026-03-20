import "../styles/PageIntro/PageIntro.css";
import HeroSection from "../components/intropage/HeroSection";
import Stats from "../components/intropage/Stats";
import Trending from "../components/intropage/Trending";
import TopArtists from "../components/intropage/TopArtists";
import PartnerLogos from "../components/intropage/PartnerLogos";
import SubscribeSection from "../components/intropage/SubscribeSection";
import Banner from "../components/intropage/Banner";
import Header from "../components/intropage/Header";


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