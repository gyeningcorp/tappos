import Link from "next/link";
import {
  CreditCard,
  BarChart3,
  Package,
  Users,
  Zap,
  Shield,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      {/* Nav */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">TapPOS</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="container mx-auto px-4 pt-20 pb-16 text-center">
        <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm mb-6 bg-white">
          <span className="text-primary font-medium">New</span>
          <span className="mx-2 text-border">|</span>
          <span className="text-muted-foreground">
            Multi-location support now available
          </span>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
          The POS system that
          <br />
          <span className="text-primary">works for you</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Accept payments, manage inventory, and grow your business with
          TapPOS. Built for restaurants, retail, salons, gyms, and more.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Start Free Trial
          </Link>
          <Link
            href="#features"
            className="inline-flex items-center justify-center rounded-lg border px-6 py-3 text-base font-medium hover:bg-accent transition-colors"
          >
            See Features
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Everything you need to run your business
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: CreditCard,
              title: "Accept Every Payment",
              desc: "Card, tap to pay, and cash with automatic change calculation. Powered by Stripe.",
            },
            {
              icon: Package,
              title: "Inventory Management",
              desc: "Track stock levels, get low-stock alerts, manage variants and categories.",
            },
            {
              icon: BarChart3,
              title: "Real-time Analytics",
              desc: "Sales dashboards, top products, revenue trends, and CSV exports.",
            },
            {
              icon: Users,
              title: "Team Management",
              desc: "Owner, Manager, and Cashier roles with appropriate access controls.",
            },
            {
              icon: Zap,
              title: "Lightning Fast",
              desc: "Tablet-optimized interface designed for speed during peak hours.",
            },
            {
              icon: Shield,
              title: "Secure & Reliable",
              desc: "Bank-level encryption, automatic backups, and 99.9% uptime.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border bg-white p-6 hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">
          Simple, transparent pricing
        </h2>
        <p className="text-center text-muted-foreground mb-12">
          Start free, upgrade when you&apos;re ready
        </p>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            {
              name: "Starter",
              price: 29,
              features: [
                "1 Register",
                "Up to 100 products",
                "Basic reporting",
                "Email support",
              ],
              popular: false,
            },
            {
              name: "Pro",
              price: 79,
              features: [
                "5 Registers",
                "Unlimited products",
                "Advanced reporting",
                "Priority support",
                "Inventory alerts",
                "Staff management",
              ],
              popular: true,
            },
            {
              name: "Enterprise",
              price: 199,
              features: [
                "Unlimited registers",
                "Unlimited products",
                "Custom reporting",
                "24/7 phone support",
                "API access",
                "Multi-location",
                "Dedicated account manager",
              ],
              popular: false,
            },
          ].map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl border p-8 ${
                plan.popular
                  ? "border-primary shadow-lg ring-1 ring-primary relative"
                  : "bg-white"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                  Most Popular
                </div>
              )}
              <h3 className="font-semibold text-lg mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">${plan.price}</span>
                <span className="text-muted-foreground">/mo</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2 text-sm"
                  >
                    <svg
                      className="w-4 h-4 text-primary flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={`block w-full text-center rounded-lg py-2.5 text-sm font-medium transition-colors ${
                  plan.popular
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border hover:bg-accent"
                }`}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-foreground">TapPOS</span>
          </div>
          <p>&copy; {new Date().getFullYear()} TapPOS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
