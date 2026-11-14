import { ArrowRight, CalendarCheck, Check, ChevronRight, Clock3, HeartPulse, MessageCircle, ShieldCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FullBrandMark } from '../components/PremiumBrandMark';

const steps = [
  { icon: Users, title: 'Find the quiet gap', text: 'See which clients have not returned, without another spreadsheet.' },
  { icon: MessageCircle, title: 'Start a useful conversation', text: 'Send a careful, approved message through your configured channel.' },
  { icon: CalendarCheck, title: 'Move the right people forward', text: 'Share a verified booking link or hand the conversation to staff.' }
];

const boundaries = [
  'Approved offers only',
  'Opt-out and frequency controls',
  'Human review for clinical questions'
];

export function LandingPage() {
  return (
    <div className="marketing-page landing-page">
      <header className="marketing-nav">
        <Link to="/" className="marketing-brand" aria-label="Aurevia Practice OS home">
          <FullBrandMark size={42} />
        </Link>
        <nav aria-label="Marketing navigation">
          <Link to="/features">How it works</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/demo" className="marketing-nav-cta">Open workspace <ArrowRight size={15} /></Link>
        </nav>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <p className="marketing-kicker">A calmer way to bring clients back</p>
            <h1>Keep the relationship going after the appointment.</h1>
            <p className="landing-lede">
              Aurevia helps med spa and dental teams notice overdue follow-ups,
              respond to interest, and protect staff time.
            </p>
            <div className="marketing-actions">
              <Link to="/features" className="marketing-button primary">See how it works <ArrowRight size={17} /></Link>
              <Link to="/pricing" className="marketing-button quiet">View pricing</Link>
            </div>
            <div className="landing-note"><ShieldCheck size={16} /> Built around verified data, consent, and human oversight.</div>
          </div>
          <div className="landing-hero-card" aria-label="Aurevia workflow preview">
            <div className="hero-card-top"><span>Today at your practice</span><span className="hero-card-status"><span /> Ready for review</span></div>
            <div className="hero-card-callout">
              <span className="hero-card-icon"><Clock3 size={20} /></span>
              <div><strong>12 clients are due a thoughtful follow-up</strong><p>Review the audience before anything is sent.</p></div>
            </div>
            <div className="hero-card-row"><span>Approved audience</span><strong>12</strong></div>
            <div className="hero-card-row"><span>Needs staff review</span><strong>3</strong></div>
            <div className="hero-card-row"><span>Booking links ready</span><strong>5</strong></div>
            <Link to="/demo" className="hero-card-link">Open the review queue <ChevronRight size={16} /></Link>
          </div>
        </section>

        <section className="landing-section landing-steps">
          <div className="marketing-section-intro">
            <p className="marketing-kicker">One clear loop</p>
            <h2>From missed follow-up to next appointment.</h2>
            <p>No jargon. No black box. Your team can see what is happening and why.</p>
          </div>
          <div className="landing-step-grid">
            {steps.map(({ icon: Icon, title, text }, index) => (
              <article className="landing-step" key={title}>
                <span className="step-number">0{index + 1}</span>
                <Icon size={22} />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section landing-boundaries">
          <div>
            <p className="marketing-kicker">The important part</p>
            <h2>Automation should make the clinic feel more in control.</h2>
          </div>
          <div className="boundary-list">
            {boundaries.map((item) => <div key={item}><Check size={17} /><span>{item}</span></div>)}
          </div>
          <div className="boundary-aside"><HeartPulse size={20} /><span>When a conversation needs clinical judgment, it stops and comes back to your team.</span></div>
        </section>

        <section className="landing-cta">
          <div><p className="marketing-kicker">Start with clarity</p><h2>See the workflow before you commit.</h2><p>Explore the operating model, then connect your own clinic data.</p></div>
          <Link to="/features" className="marketing-button primary">Explore the system <ArrowRight size={17} /></Link>
        </section>
      </main>

      <footer className="marketing-footer"><span>Aurevia Practice OS</span><span>Client growth &amp; care operations</span></footer>
    </div>
  );
}

export default LandingPage;
