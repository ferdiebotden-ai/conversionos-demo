'use client';

/**
 * Receptionist Widget Loader
 * Client Component wrapper that dynamically imports the widget with ssr: false
 * This is needed because layout.tsx is a Server Component and can't use dynamic({ ssr: false })
 */

import dynamic from 'next/dynamic';

const ReceptionistWidget = dynamic(
  () => import('./receptionist-widget').then(mod => ({ default: mod.ReceptionistWidget })),
  { ssr: false }
);

export function ReceptionistWidgetLoader() {
  return <ReceptionistWidget />;
}
