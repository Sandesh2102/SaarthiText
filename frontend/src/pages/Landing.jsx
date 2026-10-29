import {
  ShieldCheck, Gauge, Languages, FileText, Upload, Accessibility,
  ArrowRight, CheckCircle2, ScanSearch, BookOpenCheck,
} from "lucide-react";
import PublicNav from "../components/layout/PublicNav";
import Footer from "../components/layout/Footer";
import { Button } from "../components/ui/primitives";
import { LANGUAGE_LABELS } from "../utils/helpers";

function SectionHeading({ eyebrow, title, subtitle }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow && (
        <p className="text-sm font-bold uppercase tracking-wider text-brand-700">{eyebrow}</p>
      )}
      <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-4 text-lg text-ink-muted">{subtitle}</p>}
    </div>
  );
}

export default function Landing() {
  return (
    <div id="top" className="bg-white">
      <PublicNav />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-brand-50/60 to-white">
        <div className="container-page grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="chip bg-brand-100 text-brand-800">
              <ShieldCheck size={15} /> Simplify with facts preserved
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">
              Understand Public Information.{" "}
              <span className="text-brand-700">In Your Language.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
              SaarthiText converts complex government notices, health and welfare-scheme
              documents into simple, easy-to-read language — while checking that every
              important fact from the original is preserved.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button to="/signup" className="text-base">
                Get started free <ArrowRight size={18} />
              </Button>
              <a href="#how" className="btn-secondary text-base">
                See how it works
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-muted">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" /> Fact-checked output
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" /> 8 languages
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" /> Built for low-literacy readers
              </span>
            </div>
          </div>

          {/* Illustrative before/after card (static sample, clearly labelled) */}
          <div className="relative">
            <div className="card p-5 shadow-lift">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Example — original
              </p>
              <p className="rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-ink-soft">
                “Applicants must be aged 18 years or above and submit the prescribed form
                along with the requisite fee of ₹500 on or before 30 November 2026.”
              </p>
              <div className="my-3 flex items-center justify-center">
                <span className="chip bg-brand-100 text-brand-800">SaarthiText ↓</span>
              </div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Simplified — facts preserved
              </p>
              <p className="rounded-xl bg-emerald-50 p-4 text-sm leading-relaxed text-ink">
                “You must be 18 years or older. Fill the form and pay ₹500. Apply before
                30 November 2026.”
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="chip bg-emerald-100 text-emerald-800"><CheckCircle2 size={13}/> Age 18+ kept</span>
                <span className="chip bg-emerald-100 text-emerald-800"><CheckCircle2 size={13}/> ₹500 kept</span>
                <span className="chip bg-emerald-100 text-emerald-800"><CheckCircle2 size={13}/> Deadline kept</span>
              </div>
              <p className="mt-3 text-[11px] text-ink-muted">Illustrative example.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem statement */}
      <section className="container-page py-16 lg:py-20">
        <SectionHeading
          eyebrow="The problem"
          title="Official language is hard to understand"
          subtitle="Government notices, health advisories and welfare schemes are written in dense, formal language. For many people — especially those with limited literacy — this is a real barrier to accessing their rights and benefits."
        />
        <div className="mx-auto mt-10 grid max-w-4xl gap-5 sm:grid-cols-3">
          {[
            { stat: "Complex", label: "Long sentences and legal jargon hide the key message." },
            { stat: "Risky", label: "Over-simplifying can accidentally drop a deadline or condition." },
            { stat: "Excluding", label: "Information is rarely available in the reader’s own language." },
          ].map((c) => (
            <div key={c.stat} className="card p-6 text-center">
              <p className="text-xl font-extrabold text-brand-700">{c.stat}</p>
              <p className="mt-2 text-sm text-ink-muted">{c.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-slate-200 bg-slate-50 py-16 lg:py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="How it works"
            title="From complex document to clear understanding"
            subtitle="A guided, four-step pipeline that keeps you in control and keeps the facts intact."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Upload, title: "1 · Upload or paste", text: "Add a PDF or paste text from a notice, scheme or advisory." },
              { icon: BookOpenCheck, title: "2 · Simplify", text: "The content is rewritten in simple language, in your chosen language." },
              { icon: ScanSearch, title: "3 · Verify facts", text: "Key facts are extracted and checked against the simplified version." },
              { icon: Gauge, title: "4 · Measure & report", text: "Readability is scored and a clear report is generated for you." },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="card p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-700 text-white">
                  <Icon size={22} aria-hidden="true" />
                </div>
                <h3 className="mt-4 font-bold text-ink">{title}</h3>
                <p className="mt-1.5 text-sm text-ink-muted">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key features */}
      <section id="features" className="container-page py-16 lg:py-20">
        <SectionHeading
          eyebrow="Key features"
          title="Everything you need to understand a document"
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: BookOpenCheck, title: "Plain-language simplification", text: "Short sentences and everyday words — without changing what the document actually says." },
            { icon: ShieldCheck, title: "Factual verification", text: "Each key fact is marked Verified, Partially verified, Conflict or Not found." },
            { icon: Gauge, title: "Readability analysis", text: "Flesch Reading Ease and grade level for the original vs the simplified text." },
            { icon: Languages, title: "Multilingual output", text: "Read the simplified explanation in your preferred Indian language." },
            { icon: Accessibility, title: "Accessible by design", text: "High contrast, large type, keyboard navigation and read-aloud support." },
            { icon: FileText, title: "Clear reports", text: "A combined report you can view, print or download as a PDF." },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="card p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Icon size={22} aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-bold text-ink">{title}</h3>
              <p className="mt-1.5 text-sm text-ink-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Document types + Verification explanation */}
      <section className="border-y border-slate-200 bg-slate-50 py-16 lg:py-20">
        <div className="container-page grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-extrabold text-ink">Supported document types</h2>
            <p className="mt-3 text-ink-muted">
              Built for the public-information documents people struggle with most.
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                "Government notices & circulars",
                "Welfare & subsidy schemes",
                "Health & vaccination advisories",
                "Pension & insurance information",
                "Scholarship & education notices",
                "Public-service instructions",
              ].map((d) => (
                <li key={d} className="flex items-start gap-2.5 rounded-xl bg-white p-3 text-sm text-ink-soft shadow-card">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-brand-600" />
                  {d}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-ink-muted">
              Accepts text-based PDFs and pasted text. Scanned image-only PDFs are detected and reported.
            </p>
          </div>
          <div className="card p-6">
            <h3 className="text-xl font-bold text-ink">Why factual verification matters</h3>
            <p className="mt-2 text-sm text-ink-muted">
              Simplification is only useful if it stays true. SaarthiText extracts the
              important facts from the original and checks each one against the simplified text.
            </p>
            <div className="mt-5 space-y-3">
              {[
                { c: "bg-emerald-500", t: "Verified", d: "Fact is present and consistent." },
                { c: "bg-amber-500", t: "Partially verified", d: "Present but less specific." },
                { c: "bg-red-500", t: "Conflict", d: "Value or meaning was changed." },
                { c: "bg-slate-400", t: "Not found", d: "Fact is missing from the simplified text." },
              ].map((s) => (
                <div key={s.t} className="flex items-start gap-3 rounded-xl border border-slate-200 p-3">
                  <span className={`mt-1 h-3 w-3 rounded-full ${s.c}`} aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-ink">{s.t}</p>
                    <p className="text-sm text-ink-muted">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Languages + Readability + Accessibility */}
      <section className="container-page py-16 lg:py-20">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="card p-6">
            <Languages className="text-brand-700" size={26} aria-hidden="true" />
            <h3 className="mt-4 text-lg font-bold text-ink">Supported languages</h3>
            <p className="mt-1.5 text-sm text-ink-muted">
              The simplified explanation is produced in your language — not just the interface.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(LANGUAGE_LABELS).map(([en, native]) => (
                <span key={en} className="chip bg-slate-100 text-ink-soft text-indic">
                  {native}
                </span>
              ))}
            </div>
          </div>
          <div className="card p-6">
            <Gauge className="text-brand-700" size={26} aria-hidden="true" />
            <h3 className="mt-4 text-lg font-bold text-ink">Readability analysis</h3>
            <p className="mt-1.5 text-sm text-ink-muted">
              Real metrics computed with industry-standard formulas — no guesswork.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-ink-soft">
              <li className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 text-brand-600" /> Flesch Reading Ease</li>
              <li className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 text-brand-600" /> Flesch-Kincaid Grade Level</li>
              <li className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 text-brand-600" /> Sentence & word complexity</li>
              <li className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 text-brand-600" /> Original vs simplified comparison</li>
            </ul>
          </div>
          <div className="card p-6">
            <Accessibility className="text-brand-700" size={26} aria-hidden="true" />
            <h3 className="mt-4 text-lg font-bold text-ink">Accessibility first</h3>
            <p className="mt-1.5 text-sm text-ink-muted">
              Designed to be usable by people who are not technically confident.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-ink-soft">
              <li className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 text-brand-600" /> High contrast & large text</li>
              <li className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 text-brand-600" /> Full keyboard navigation</li>
              <li className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 text-brand-600" /> Screen-reader friendly</li>
              <li className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 text-brand-600" /> Read-aloud support</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pb-20">
        <div className="overflow-hidden rounded-2xl bg-brand-700 px-6 py-14 text-center shadow-lift sm:px-12">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Make public information make sense
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-brand-100">
            Create a free account and simplify your first document in minutes — with the
            facts preserved and the result in your language.
          </p>
          <div className="mt-7 flex justify-center">
            <Button to="/signup" variant="secondary" className="text-base">
              Get started free <ArrowRight size={18} />
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
