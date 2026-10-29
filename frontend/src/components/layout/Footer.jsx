import Brand from "./Brand";

export default function Footer() {
  return (
    <footer id="about" className="border-t border-slate-200 bg-white">
      <div className="container-page grid gap-8 py-12 md:grid-cols-3">
        <div className="max-w-sm">
          <Brand />
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            SaarthiText turns complex government, health and welfare information into clear,
            simple language in your language — and checks that the important facts are preserved.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-ink">What it does</h4>
          <ul className="mt-3 space-y-2 text-sm text-ink-muted">
            <li>Plain-language simplification</li>
            <li>Factual consistency verification</li>
            <li>Readability analysis</li>
            <li>Multilingual output</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-ink">About this project</h4>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            An academic project on automatic text simplification for low-literacy readers,
            informed by research on reliable text-simplification evaluation
            (Xu et al., TACL 2015).
          </p>
        </div>
      </div>
      <div className="border-t border-slate-200">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-ink-muted sm:flex-row">
          <p>© {new Date().getFullYear()} SaarthiText. For educational and public-benefit use.</p>
          <p>Always verify critical details against the original official document.</p>
        </div>
      </div>
    </footer>
  );
}
