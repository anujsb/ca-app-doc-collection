import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-8">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-stone-900 mb-2">
            <span className="text-stone-50 text-xl font-bold">G</span>
          </div>
          <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">GST Filing Tool</h1>
          <p className="text-sm text-stone-500 leading-relaxed">
            Collect client documents, track returns, and prepare filings — all in one place.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex w-full items-center justify-center rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-medium text-stone-50 hover:bg-stone-800 transition-colors"
        >
          Open Dashboard
        </Link>
      </div>
    </div>
  )
}