import CTASection from "@/components/landing/cta-section";
import FAQSection from "@/components/landing/faq-section";
import FeaturesSection from "@/components/landing/features-section";
import Footer from "@/components/landing/footer";
import HeroSection from "@/components/landing/hero-section";
import Navbar from "@/components/landing/navbar";
import PhilosophySection from "@/components/landing/philosophy-section";
import PricingSection from "@/components/landing/pricing-section";

//BetterAuth
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const user = session?.user ?? null;

  return (
    <div className="min-h-screen bg-linear-to-b from-brand-surface via-white to-brand-red-100/30">
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
