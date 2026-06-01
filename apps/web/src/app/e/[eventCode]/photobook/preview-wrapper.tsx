"use client";

import dynamic from "next/dynamic";

// The actual preview client uses @react-pdf/renderer, which accesses 
// browser globals like 'window'. We MUST import it dynamically with SSR disabled,
// and this dynamic import MUST happen inside a Client Component.
const DynamicPreviewClient = dynamic(() => import("./preview-client"), {
  ssr: false,
});

type Props = {
  eventCode: string;
  eventId: string;
  eventName: string;
};

export function PreviewWrapper(props: Props) {
  return <DynamicPreviewClient {...props} />;
}
