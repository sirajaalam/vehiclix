import React from 'react';

export default function FaqPage() {
  const faqs = [
    {
      q: 'How does Equal Trip Expense Splitting calculate rounding?',
      a: 'Vehiclix converts all monetary inputs into integer paise to prevent floating-point discrepancies. When a total trip expense does not divide equally by the participant count, the leftover paise remainder is deterministically allocated to participants in deterministic order (by participant ID). No random allocations occur.',
    },
    {
      q: 'Does deleting a vehicle delete my historical trips?',
      a: 'No. Trips are independent entities. If a trip was linked to a Garage vehicle and that vehicle is deleted, the trip is preserved and its vehicle reference is simply unlinked to preserve your trip history and audit trails.',
    },
    {
      q: 'Can I edit a completed trip?',
      a: 'No. Completed trips are strictly immutable and read-only. This guarantees that finalized expense calculations and equal split settlements remain tamper-proof.',
    },
    {
      q: 'Are PDF reports stored in the database?',
      a: 'No. To maintain a clean and lightweight database, PDF reports are dynamically compiled and streamed directly to your browser on demand.',
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold text-white sm:text-4xl">Frequently Asked Questions</h1>
        <p className="mt-2 text-sm text-slate-400">Clear answers to common questions about Vehiclix rules and architecture.</p>
      </div>

      <div className="space-y-6">
        {faqs.map((faq, i) => (
          <div key={i} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h3 className="text-base font-semibold text-white">{faq.q}</h3>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
