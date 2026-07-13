"use client";

import { Suspense, useEffect } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { GA_MEASUREMENT_ID } from "@/lib/analytics/gtag";
import { POSTHOG_KEY, initPostHog } from "@/lib/analytics/posthog";
import { trackPageview } from "@/lib/analytics/events";

function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    trackPageview(query ? `${pathname}?${query}` : pathname);
  }, [pathname, searchParams]);

  return null;
}

export default function Analytics() {
  useEffect(() => {
    initPostHog();
  }, []);

  return (
    <>
      {GA_MEASUREMENT_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
            `}
          </Script>
        </>
      )}
      {(GA_MEASUREMENT_ID || POSTHOG_KEY) && (
        <Suspense fallback={null}>
          <PageviewTracker />
        </Suspense>
      )}
    </>
  );
}
