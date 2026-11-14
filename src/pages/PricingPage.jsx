import { ArrowRight, Check, ChevronDown, CircleHelp, Layers3, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PremiumBrandMark } from '../components/PremiumBrandMark';
import { COMMERCIAL_PRICING_TIERS } from '../core/clinicRegistry.js';

const plans = [
  {
    name: 'Founding Clinic Pilot',
    eyebrow: 'Pilot plan',
    price: COMMERCIAL_PRICING_TIERS.founding_pilot.monthly_subscription,
    setup: COMMERCIAL_PRICING_TIERS.founding_pilot.setup_fee_range,
    description: 'A guided first rollout for one clinic testing a repeatable reactivation workflow.',
    includes: ['One-clinic workflow setup', 'Verified offers and booking links', 'Opt-out and contact safeguards', 'Staff review for sensitive replies', 'Pilot outcome review'],
    note: 'Pilot scope and milestones are agreed with each clinic'
  },
  {
    name: 'Standard Med Spa',
    eyebrow: 'Med spa & dermatology',
    price: COMMERCIAL_PRICING_TIERS.standard_med_spa.monthly_subscription,
    setup: COMMERCIAL_PRICING_TIERS.standard_med_spa.setup_fee_range,
    description: 'Reactivation and staff follow-up tools for a single med spa or dermatology clinic.',
    includes: ['Campaign and offer configuration', 'Approved WhatsApp outreach', 'Verified offer and booking-link replies', 'Staff review queue', 'Dashboard and weekly reporting'],
    note: 'Messaging and provider usage are billed separately',
    featured: true
  },
  {
    name: 'Standard Dental',
    eyebrow: 'Private dental practice',
    price: COMMERCIAL_PRICING_TIERS.standard_dental.monthly_subscription,
    setup: COMMERCIAL_PRICING_TIERS.standard_dental.setup_fee_range,
    description: 'Recall follow-up and conversation handling for one dental practice.',
    includes: ['Recall campaign configuration', 'Approved WhatsApp outreach', 'Verified offer and booking-link replies', 'Clinical messages routed for staff review', 'Dashboard and weekly reporting'],
    note: 'Messaging and provider usage are billed separately'
  }
];

const questions = [
  ['How does pricing work?', 'Each plan has a monthly subscription and a separate one-time setup fee. The final setup amount depends on the clinic’s agreed implementation scope.'],
  ['What is not included?', 'Messaging, provider usage, and infrastructure charges are separate. Any work outside the listed setup scope is agreed before it begins.'],
  ['Can we start with one location?', 'Yes. The Founding Clinic Pilot is scoped for one clinic. Multi-location work is quoted separately and may require additional implementation.']
];

export function PricingPage() {
  return (
    <div className="pricing-page pricing-refresh">
      <header className="marketing-nav pricing-refresh-nav">
        <Link to="/" className="marketing-brand" aria-label="Aurevia Practice OS home"><PremiumBrandMark size={42} animated={false} /></Link>
        <nav aria-label="Pricing navigation">
          <Link to="/features">How it works</Link>
          <Link to="/demo" className="marketing-nav-cta">Open workspace <ArrowRight size={15} /></Link>
        </nav>
      </header>

      <main>
        <section className="pricing-intro">
          <div>
            <p className="marketing-kicker">Clear clinic pricing</p>
            <h1>Choose the plan for your practice.</h1>
            <p>Compare the monthly subscription and one-time setup range up front. Provider, messaging, and infrastructure costs are separate.</p>
          </div>
          <div className="pricing-intro-aside"><ShieldCheck size={19} /><span>Messaging, provider usage, and infrastructure costs are separate from the prices shown.</span></div>
        </section>

        <section className="pricing-plan-grid" aria-label="Available plans">
          {plans.map((plan) => (
            <article key={plan.name} className={`pricing-plan ${plan.featured ? 'pricing-plan-featured' : ''}`}>
              <div className="pricing-plan-top">
                <span className="pricing-plan-eyebrow">{plan.eyebrow}</span>
                {plan.featured && <span className="pricing-plan-mark"><Sparkles size={13} /> For med spas</span>}
              </div>
              <h2>{plan.name}</h2>
              <p className="pricing-plan-description">{plan.description}</p>
              <div className="pricing-plan-price"><strong>{plan.price}</strong></div>
              <p className="pricing-plan-setup"><span>One-time setup</span><strong>{plan.setup}</strong></p>
              <div className="pricing-plan-rule" />
              <p className="pricing-includes-label">Included workflow</p>
              <ul>{plan.includes.map((item) => <li key={item}><Check size={16} /><span>{item}</span></li>)}</ul>
              <p className="pricing-plan-note">{plan.note}</p>
              <Link to="/demo" className={`pricing-plan-button ${plan.featured ? 'primary' : ''}`}>View the workspace <ArrowRight size={15} /></Link>
            </article>
          ))}
        </section>

        <section className="pricing-principles">
          <div className="pricing-principle"><Layers3 size={20} /><div><strong>Setup is separate</strong><span>Each plan shows its one-time setup range.</span></div></div>
          <div className="pricing-principle"><MessageCircle size={20} /><div><strong>Staff stay involved</strong><span>Sensitive replies are routed for staff review.</span></div></div>
          <div className="pricing-principle"><CircleHelp size={20} /><div><strong>Usage is separate</strong><span>Messaging and provider fees are not included.</span></div></div>
        </section>

        <section className="pricing-faq">
          <div><p className="marketing-kicker">Before you decide</p><h2>Plain answers to practical questions.</h2></div>
          <div>{questions.map(([question, answer]) => <details key={question}><summary>{question}<ChevronDown size={17} /></summary><p>{answer}</p></details>)}</div>
        </section>
      </main>
      <footer className="marketing-footer"><span>Aurevia Practice OS</span><span>Client growth &amp; care operations</span></footer>
    </div>
  );
}

export default PricingPage;
