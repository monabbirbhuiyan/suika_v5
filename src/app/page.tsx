import CTASection from "@/components/landing/cta-section";
import FAQSection from "@/components/landing/faq-section";
import FeaturesSection from "@/components/landing/features-section";
import Footer from "@/components/landing/footer";
import HeroSection from "@/components/landing/hero-section";
import Navbar from "@/components/landing/navbar";
import PhilosophySection from "@/components/landing/philosophy-section";
import PricingSection from "@/components/landing/pricing-section";
import { getServerSession } from "@/action/get-session";

export default async function Home() {
  const session = await getServerSession();
  const user = session?.user ?? null;

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <Navbar user={user as any} />
      <HeroSection />
      <FeaturesSection />
      <PhilosophySection />
      <PricingSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
}
