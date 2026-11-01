import { Manrope } from "next/font/google";

import { AboutSection } from "./about-section";
import { FinalCtaSection } from "./final-cta-section";
import { HeroSection } from "./hero-section";
import { ProcessSection } from "./process-section";
import { SeedPreviewSection } from "./seed-preview-section";
import { ServicesSection } from "./services-section";
import { WhySmartfarmSection } from "./why-smartfarm-section";
import styles from "./home-page.module.css";

const manrope = Manrope({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-home",
});

export function HomePage() {
  return (
    <div className={`${styles.page} ${manrope.variable}`}>
      <HeroSection />
      <AboutSection />
      <ProcessSection />
      <ServicesSection />
      <WhySmartfarmSection />
      <SeedPreviewSection />
      <FinalCtaSection />
    </div>
  );
}
