import { FloatingBackground } from "@/components/global/floating-background";
import CTASection from "@/components/landing/cta-section";
import FAQSection from "@/components/landing/faq-section";
import FeaturesSection from "@/components/landing/features-section";
import Footer from "@/components/landing/footer";
import HeroSection from "@/components/landing/hero-section";
import Navbar from "@/components/landing/navbar";
import PricingSection from "@/components/landing/pricing-section";
import SignatureConstraintSection from "@/components/landing/signature-constraint-section";
import UseCasesSection from "@/components/landing/use-cases-section";
import WhySuikaSection from "@/components/landing/why-suika-section";
import Image from "next/image";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <FloatingBackground />
      <Navbar />
      <div className="pt-16">
        <HeroSection />
        <WhySuikaSection />
        <FeaturesSection />
        <UseCasesSection />
        <SignatureConstraintSection />
        <FAQSection />
        <PricingSection />
        <CTASection />
        <Footer />
      </div>
    </div>
  );
}
