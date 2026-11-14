import { Link } from 'react-router-dom';
import {
  Zap, Brain, Users, Layers, Shield, Smartphone, BarChart3,
  RotateCcw, MessageCircle, CheckCircle2, ChevronRight, ChevronDown,
  Code, Database, Globe, Lock, Award, Star, HeartPulse,
  Settings, Filter, Search, ShieldCheck
} from 'lucide-react';
import { PremiumBrandMark } from '../components/PremiumBrandMark';
import { useScrollAnimation, useStaggeredAnimation } from '../hooks/useReducedMotion';

/**
 * Features Page - Deep Dive into Capabilities
 * Technical but accessible — shows HOW it works, not just WHAT it does
 */
export function FeaturesPage() {
  const [heroRef, heroVisible] = useScrollAnimation({ once: true });
  const [pillarRefs, pillarVisible] = useStaggeredAnimation(4, 120);
  const [workflowRef, workflowVisible] = useScrollAnimation({ once: true });
  const [techRef, techVisible] = useScrollAnimation({ once: true });
  const [integrationRef, integrationVisible] = useScrollAnimation({ once: true });
  const [complianceRef, complianceVisible] = useScrollAnimation({ once: true });

  const pillars = [
    {
      id: 'outreach',
      icon: Zap,
      title: 'Clinic-approved outreach',
      subtitle: 'Offers, limits, and quiet hours stay configurable',
      description: 'Prepare a reactivation list and send only messages allowed by the clinic’s configured rules.',
      features: [
        { title: 'Eligibility checks', desc: 'Filter contacts using inactivity, eligibility, opt-out, and booking status.', icon: RotateCcw },
        { title: 'WhatsApp templates', desc: 'Send clinic-approved templates through the configured messaging provider.', icon: MessageCircle },
        { title: 'Verified offers', desc: 'Use active offer details and prices from the clinic’s Offers sheet.', icon: Award },
        { title: 'Contact safeguards', desc: 'Apply opt-outs, daily limits, cooldowns, and configured business hours.', icon: Shield },
      ],
      technical: [
        'n8n workflow reads patient and offer records from Google Sheets',
        'Campaign payloads are capped and rechecked against daily contact history',
        'Invalid phone numbers, opt-outs, and recently contacted patients are skipped'
      ]
    },
    {
      id: 'intelligence',
      icon: Brain,
      title: 'Reply handling',
      subtitle: 'Clear next steps, with staff review when needed',
      description: 'Route common replies to verified information and pause sensitive conversations for the team.',
      features: [
        { title: 'Reply categories', desc: 'Identify booking interest, price questions, opt-outs, follow-ups, and staff-required replies.', icon: Filter },
        { title: 'Verified answers', desc: 'Use configured booking links and active offer details; do not claim an appointment is booked.', icon: Search },
        { title: 'Clinical handoff', desc: 'Route clinical or sensitive questions to the human queue instead of answering them.', icon: HeartPulse },
        { title: 'Conversation log', desc: 'Record messages, intent, and state changes in the configured conversation store.', icon: Database },
      ],
      technical: [
        'Known opt-out phrases are handled before the AI request',
        'Handled message IDs are checked to avoid duplicate processing',
        'Missing or uncertain business facts are routed for staff review'
      ]
    },
    {
      id: 'command',
      icon: Users,
      title: 'Staff workspace',
      subtitle: 'Patients, conversations, and follow-up in one place',
      description: 'Give the team a clear view of current activity and the items that need a person.',
      features: [
        { title: 'Patient list', desc: 'Search patient records and review visit, eligibility, and conversation details.', icon: Users },
        { title: 'Human queue', desc: 'Review and resolve conversations that need staff attention.', icon: HeartPulse },
        { title: 'Missed-call follow-up', desc: 'Handle missed-call events using the configured webhook and reply workflow.', icon: Smartphone },
        { title: 'Reports and activity', desc: 'Review campaign, reply, booking-link, and handoff activity in the dashboard.', icon: BarChart3 },
      ],
      technical: [
        'Workspace pages use React and Vite',
        'n8n webhooks provide dashboard, patient, conversation, and handoff data',
        'Google Sheets can store patients, offers, configuration, and handoffs'
      ]
    },
    {
      id: 'operations',
      icon: Layers,
      title: 'Connections and controls',
      subtitle: 'Connect the workflow to clinic-approved tools',
      description: 'The integrations are configured for each clinic; credentials and business details are not assumed.',
      features: [
        { title: 'Google Sheets', desc: 'Use configured tabs for patient, offer, conversation, and clinic settings data.', icon: Database },
        { title: 'Twilio and WhatsApp', desc: 'Connect messaging credentials and approved templates in n8n.', icon: MessageCircle },
        { title: 'Booking link', desc: 'Use the clinic-supplied URL; availability sync depends on the connected booking system.', icon: Globe },
        { title: 'Clinic-specific settings', desc: 'Set business hours, time zone, daily limits, and contact rules per workflow.', icon: Settings },
      ],
      technical: [
        'n8n workflows are exported as JSON for review and configuration',
        'Provider credentials are configured in n8n, not in the page content',
        'Clinic owners should verify provider, privacy, and compliance requirements before launch'
      ]
    }
  ];

  const workflowSteps = [
    { step: 1, title: 'Check eligibility', icon: RotateCcw, desc: 'Filter the clinic list using inactivity, booking state, valid contact details, and opt-out status.', tech: 'Schedule or campaign trigger → patient records → eligibility checks' },
    { step: 2, title: 'Read an active offer', icon: Award, desc: 'Use a currently active offer from the clinic’s configured offer list.', tech: 'Offer lookup → active status and validity checks' },
    { step: 3, title: 'Send approved outreach', icon: MessageCircle, desc: 'Send the selected template within configured contact limits and business hours.', tech: 'WhatsApp provider → contact history update' },
    { step: 4, title: 'Route the reply', icon: Brain, desc: 'Handle opt-outs, booking links, offer questions, follow-up requests, and staff handoffs.', tech: 'Inbound webhook → intent routing → response or human queue' },
    { step: 5, title: 'Log the outcome', icon: BarChart3, desc: 'Record the conversation state and make activity available to the workspace.', tech: 'Conversation and patient records → dashboard and reports' },
  ];

  const techStack = [
    { category: 'Automation', items: ['n8n workflows', 'Webhook-based triggers', 'Workflow exports in JSON', 'Configurable clinic rules'] },
    { category: 'Reply handling', items: ['Configured Gemini connection', 'Verified offer and booking details', 'Opt-out handling', 'Staff review for sensitive replies'] },
    { category: 'Messaging', items: ['Twilio / WhatsApp connection', 'Clinic-approved templates', 'Configured contact limits', 'Inbound message webhooks'] },
    { category: 'Clinic data', items: ['Google Sheets records', 'Patient and conversation tabs', 'Active offers and clinic configuration', 'Human handoff queue'] },
    { category: 'Workspace', items: ['React and Vite', 'Clinic and role selection', 'Patient and conversation views', 'Readiness and configuration status'] },
  ];

  const integrations = [
    { name: 'Google Sheets', category: 'Clinic data', status: 'Workflow connection', desc: 'Patient, offer, clinic configuration, and handoff records' },
    { name: 'Twilio / WhatsApp', category: 'Messaging', status: 'Workflow connection', desc: 'Approved outbound templates and inbound reply webhooks' },
    { name: 'Google Gemini', category: 'Reply handling', status: 'Workflow connection', desc: 'Configured for conversation intent and response handling' },
    { name: 'Clinic booking URL', category: 'Booking', status: 'Clinic configured', desc: 'A clinic-provided link is shared; live availability depends on the booking provider' },
  ];

  return (
    <div className="features-page">
      {/* Navigation */}
      <header className="marketing-nav features-nav" role="banner">
        <div className="nav-container">
          <Link to="/" className="marketing-brand" aria-label="Aurevia Practice OS home">
            <PremiumBrandMark size={42} animated={false} />
          </Link>
          <nav aria-label="Features navigation">
            <Link to="/pricing">Pricing</Link>
            <Link to="/demo" className="marketing-nav-cta">Open workspace <ChevronRight size={15} /></Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className={`features-hero ${heroVisible ? 'visible' : ''}`} ref={heroRef} aria-labelledby="features-title">
        <div className="hero-bg">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
        </div>
        <div className="container">
          <div className="hero-content">
            <span className="hero-eyebrow">
              <ShieldCheck size={16} /> A clear operating model for your team
            </span>
            <h1 id="features-title">A clearer way to follow up with patients.</h1>
            <p className="hero-lead">
              Review the patient journey first. Open the technical details when you need to see how each step is configured.
            </p>
            <div className="hero-pillars-preview">
              {pillars.map((p, idx) => (
                <div key={p.id} className="pillar-preview" style={{ transitionDelay: `${idx * 80}ms` }}>
                  <div className="pillar-icon-sm">
                    <p.icon size={20} />
                  </div>
                  <span>{p.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Four Pillars */}
      <section className="pillars-section" aria-labelledby="pillars-title">
        <div className="container">
          <div className="section-header">
            <h2 id="pillars-title">What the workspace helps your team do.</h2>
            <p>Start an approved follow-up, route replies, review exceptions, and see what is connected.</p>
          </div>

          <div className="pillars-grid">
            {pillars.map((pillar, idx) => (
              <article
                key={pillar.id}
                className={`pillar-card ${pillar.id}`}
                ref={pillarRefs[idx]}
                style={{ opacity: pillarVisible.has(idx) ? 1 : 0, transform: pillarVisible.has(idx) ? 'translateY(0)' : 'translateY(20px)' }}
              >
                <div className="pillar-header">
                  <div className="pillar-icon">
                    <pillar.icon size={28} />
                  </div>
                  <div className="pillar-title-group">
                    <h3>{pillar.title}</h3>
                    <p className="pillar-subtitle">{pillar.subtitle}</p>
                  </div>
                </div>
                <p className="pillar-desc">{pillar.description}</p>

                <div className="pillar-features">
                  {pillar.features.map((feature, fIdx) => (
                    <div key={feature.title} className="feature-item" style={{ transitionDelay: `${fIdx * 50}ms` }}>
                      <div className="feature-icon-sm">
                        <feature.icon size={16} />
                      </div>
                      <div className="feature-content">
                        <strong>{feature.title}</strong>
                        <p>{feature.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <details className="pillar-technical">
                  <summary>
                    <span>Technical Implementation</span>
                    <ChevronDown size={16} />
                  </summary>
                  <ul className="technical-list">
                    {pillar.technical.map((item, tIdx) => (
                      <li key={tIdx}>
                        <Code size={13} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Visualization */}
      <section className={`workflow-section ${workflowVisible ? 'visible' : ''}`} ref={workflowRef} aria-labelledby="workflow-title">
        <div className="container">
          <div className="section-header">
            <h2 id="workflow-title">How a follow-up moves through the system.</h2>
            <p>The configured n8n workflow checks eligibility, sends approved messages, and routes the reply to its next step.</p>
          </div>

          <div className="workflow-timeline">
            {workflowSteps.map((step, idx) => (
              <div key={step.step} className="workflow-step" style={{ transitionDelay: `${idx * 100}ms` }}>
                <div className="step-marker">
                  <span className="step-number">{step.step}</span>
                  <div className="step-line" />
                </div>
                <div className="step-content">
                  <div className="step-header">
                    <div className="step-icon">
                      <step.icon size={22} />
                    </div>
                    <div>
                      <h3>{step.title}</h3>
                      <p>{step.desc}</p>
                    </div>
                  </div>
                  <div className="step-tech">
                    <Code size={14} />
                    <span>{step.tech}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className={`tech-section ${techVisible ? 'visible' : ''}`} ref={techRef} aria-labelledby="tech-title">
        <div className="container">
          <div className="section-header">
            <h2 id="tech-title">What the current setup uses.</h2>
            <p>These are the technologies and data stores referenced by the workspace and workflow exports.</p>
          </div>

          <div className="tech-grid">
            {techStack.map((stack, idx) => (
              <div key={stack.category} className="tech-category" style={{ transitionDelay: `${idx * 80}ms` }}>
                <h3>{stack.category}</h3>
                <ul>
                  {stack.items.map((item, iIdx) => (
                    <li key={item} style={{ transitionDelay: `${iIdx * 30}ms` }}>
                      <CheckCircle2 size={16} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className={`integration-section ${integrationVisible ? 'visible' : ''}`} ref={integrationRef} aria-labelledby="integration-title">
        <div className="container">
          <div className="section-header">
            <h2 id="integration-title">Connections to configure.</h2>
            <p>Each connection needs clinic credentials, approved templates, and verified business details before use.</p>
          </div>

          <div className="integrations-table-wrapper">
            <table className="integrations-table">
              <thead>
                <tr>
                  <th>Integration</th>
                  <th>Category</th>
                  <th>Connection</th>
                  <th>Current use</th>
                </tr>
              </thead>
              <tbody>
                {integrations.map((int, idx) => (
                  <tr key={int.name} style={{ transitionDelay: `${idx * 30}ms` }}>
                    <td>
                      <strong>{int.name}</strong>
                    </td>
                    <td><span className="category-tag">{int.category}</span></td>
                    <td>
                      <span className="tier-badge">{int.status}</span>
                    </td>
                    <td title={int.desc}>{int.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Compliance & Security */}
      <section className={`compliance-section ${complianceVisible ? 'visible' : ''}`} ref={complianceRef} aria-labelledby="compliance-title">
        <div className="container">
          <div className="section-header">
            <h2 id="compliance-title">Safety checks and launch requirements.</h2>
            <p>Workflow guardrails help teams follow clinic rules. They do not replace provider review or a compliance assessment.</p>
          </div>

          <div className="compliance-grid">
            <article className="compliance-card">
              <div className="compliance-icon">
                <Shield size={28} />
              </div>
              <h3>Workflow safeguards</h3>
              <ul>
                <li><CheckCircle2 size={16} /> Check opt-out status before outreach</li>
                <li><CheckCircle2 size={16} /> Use active, clinic-approved offers</li>
                <li><CheckCircle2 size={16} /> Route clinical questions to staff</li>
                <li><CheckCircle2 size={16} /> Apply configured contact limits and hours</li>
              </ul>
            </article>

            <article className="compliance-card">
              <div className="compliance-icon">
                <Lock size={28} />
              </div>
              <h3>Clinic setup</h3>
              <ul>
                <li><CheckCircle2 size={16} /> Configure provider credentials in n8n</li>
                <li><CheckCircle2 size={16} /> Verify booking links and clinic hours</li>
                <li><CheckCircle2 size={16} /> Review messaging templates and consent rules</li>
                <li><CheckCircle2 size={16} /> Confirm data retention with each provider</li>
              </ul>
            </article>

            <article className="compliance-card">
              <div className="compliance-icon">
                <Award size={28} />
              </div>
              <h3>Before going live</h3>
              <ul>
                <li><CheckCircle2 size={16} /> Complete the clinic readiness checklist</li>
                <li><CheckCircle2 size={16} /> Test opt-out and staff handoff paths</li>
                <li><CheckCircle2 size={16} /> Confirm applicable privacy and compliance terms</li>
                <li><CheckCircle2 size={16} /> Validate a test run before patient outreach</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="features-final-cta">
        <div className="container">
          <div className="final-cta-card">
            <h2>See how the workspace fits your clinic.</h2>
            <p>Review the dashboard and confirm the workflow, providers, and clinic-specific setup before launch.</p>
            <div className="final-cta-actions">
              <Link to="/demo" className="btn btn-primary btn-lg">
                <Zap size={18} />
                <span>Open the workspace</span>
              </Link>
              <Link to="/pricing" className="btn btn-secondary btn-lg">
                <Star size={18} />
                <span>View Pricing</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="page-footer">
        <div className="container">
          <p>© {new Date().getFullYear()} Aurevia Practice OS. All workflows exported as JSON — you own the code forever.</p>
        </div>
      </footer>
    </div>
  );
}

export default FeaturesPage;