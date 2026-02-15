import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 mb-8">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 className="text-5xl font-bold text-white mb-4">
          Coach <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Matchmaker</span>
        </h1>
        <p className="text-xl text-gray-400 mb-8">
          The football intelligence platform for finding your perfect managerial fit.
          Data-driven shortlists based on tactical, financial, and cultural alignment.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-cyan-600 transition-all"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 border border-gray-700 text-gray-300 font-semibold rounded-xl hover:bg-gray-800 transition-all"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
