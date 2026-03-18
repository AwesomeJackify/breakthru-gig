export interface ServiceTier {
  tier: string;
  title: string;
  description: string;
  features: string[];
  popular?: boolean;
}

export const services: ServiceTier[] = [
  {
    tier: "Foundation",
    title: "Self-Guided Plan",
    description: "1–2 sentences describing this entry-level option: a personalised programme delivered to the client's app, with check-ins to track progress.",
    features: [
      "Personalised training programme",
      "Monthly programme refresh",
      "Nutrition guidance & meal frameworks",
      "Access to the Breakthru app",
    ],
  },
  {
    tier: "Signature",
    title: "1-on-1 Coaching",
    description: "1–2 sentences describing this core offering: full access to Myer, weekly check-ins, real-time adjustments, and everything in Foundation.",
    features: [
      "Everything in Foundation",
      "Weekly video check-ins with Myer",
      "24/7 messaging support",
      "Real-time programme adjustments",
      "Mindset and habit coaching",
    ],
    popular: true,
  },
  {
    tier: "Elite",
    title: "Performance & Athletes",
    description: "1–2 sentences describing the premium athlete-focused tier: sport-specific conditioning, periodisation, and high-frequency coaching access.",
    features: [
      "Everything in Signature",
      "Sport-specific periodisation",
      "Bi-weekly video calls",
      "Priority response & scheduling",
      "Performance testing & benchmarking",
    ],
  },
];
