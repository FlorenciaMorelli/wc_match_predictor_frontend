import Nav from "@/components/nav";
import Hero from "@/components/hero";
import PredictorSection from "@/components/predictor-section";
import FixtureSection from "@/components/fixture-section";
import Footer from "@/components/footer";

export default function HomePage() {
  return (
    <>
      <main className="bg-canvas text-ink min-h-screen">
        <Nav />
        <Hero />
        <PredictorSection />
        <FixtureSection />
      </main>
      <Footer />
    </>
  );
}
