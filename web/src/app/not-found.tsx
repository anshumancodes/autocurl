import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "404 - Page Not Found",
  description: "The page you requested could not be found on autocurl.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <>
      <div className="bg" aria-hidden="true"></div>
      <Navbar />

      <main className="min-h-[70vh] flex items-center justify-center px-6 py-20">
        <div className="max-w-145 w-full text-center">
          <div className="font-mono text-sun text-[14px] font-semibold tracking-wider uppercase mb-3">
            Error 404
          </div>
          <h1 className="font-extrabold text-[clamp(32px,5vw,52px)] leading-[1.1] tracking-[-0.03em] mb-4">
            Command Not Found
          </h1>
          <p className="text-mute text-[16px] sm:text-[18px] mb-8">
            The page you are looking for does not exist or has been moved. Pick
            a destination below to get back on track.
          </p>

          <div className="bg-[#0e0c13] border border-line rounded-xl p-5 font-mono text-[13.5px] text-left mb-8 overflow-x-auto">
            <span className="text-sun">$</span> autocurl --find-page
            <div className="text-mute mt-1">
              autocurl: page not found in index.autocurl
            </div>
            <div className="text-sky mt-1">
              Available routes: /, /docs, /docs/getting-started, /docs/commands
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center px-5 py-2.5 rounded-lg bg-sun text-ink font-semibold text-[15px] hover:brightness-105 transition-all no-underline"
            >
              Back to Home
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center px-5 py-2.5 rounded-lg bg-[rgba(21,19,27,0.8)] border border-line text-bone font-medium text-[15px] hover:border-sun/40 transition-all no-underline"
            >
              Explore Documentation
            </Link>
            <Link
              href="/docs/getting-started"
              className="inline-flex items-center px-5 py-2.5 rounded-lg bg-[rgba(21,19,27,0.8)] border border-line text-bone font-medium text-[15px] hover:border-sun/40 transition-all no-underline"
            >
              Quickstart Guide
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
