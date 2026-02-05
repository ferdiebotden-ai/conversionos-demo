/**
 * Estimate Layout
 * Full-screen chat experience without footer
 * Includes small bottom margin for visual polish
 */

export default function EstimateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Hide the footer for this route - full-screen chat experience */}
      <style>{`
        footer { display: none !important; }
        main { min-height: auto !important; }
      `}</style>
      <div className="flex flex-col h-[calc(100dvh-4rem)]">
        {children}
      </div>
    </>
  );
}
