"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SiteBgVideo() {
  const pathname = usePathname();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const isPanel = pathname?.startsWith("/owner") || pathname?.startsWith("/admin");

  useEffect(() => {
    if (isPanel) return;
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase as any).from("app_config").select("value").eq("key", "site_bg_video").single();
        if (data?.value) setVideoUrl(String(data.value));
      } catch { /* no config */ }
    })();
  }, [isPanel]);

  if (isPanel || !videoUrl) return null;

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: -1 }}>
      <video
        autoPlay muted loop playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.25 }}
      >
        <source src={videoUrl} />
      </video>
      {/* Dark overlay to keep content readable */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, rgba(4,13,7,0.85) 0%, rgba(8,24,16,0.75) 40%, rgba(5,15,9,0.85) 70%, rgba(3,10,6,0.9) 100%)" }} />
    </div>
  );
}
