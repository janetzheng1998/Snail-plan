import Link from "next/link";
import { TypewriterHeadline } from "@/components/home/typewriter-headline";
import { PageShell } from "@/components/page-shell";
import { buttonClasses } from "@/components/ui/button";

export default function HomePage() {
  const desktopTrackPath =
    "M8 78 C40 78 40 46 72 46 C104 46 104 78 136 78 C168 78 168 46 200 46 C232 46 232 78 264 78 C296 78 296 46 328 46 C360 46 360 78 392 78 C424 78 424 46 456 46 C488 46 488 78 520 78 C552 78 552 46 584 46 C616 46 616 78 648 78 C680 78 680 46 712 46 C744 46 744 78 776 78 C808 78 808 46 840 46 C872 46 872 78 904 78 C936 78 936 46 968 46 C1000 46 1000 78 1032 78 C1064 78 1064 46 1096 46 C1128 46 1128 78 1160 78";
  const mobileTrackPath =
    "M14 58 C30 58 30 42 46 42 C62 42 62 58 78 58 C94 58 94 42 110 42 C126 42 126 58 142 58 C158 58 158 42 174 42 C190 42 190 58 206 58 C222 58 222 42 238 42 C254 42 254 58 270 58 C286 58 286 42 302 42 C318 42 318 58 334 58";

  return (
    <PageShell currentPath="/" heroTone="home">
      <section className="mx-auto max-w-5xl">
        <div className="motion-float-in rounded-[2rem] border border-white/80 bg-gradient-to-b from-white/82 to-moss-50/58 px-5 py-9 text-center shadow-[0_24px_56px_-46px_rgba(31,42,38,0.62)] sm:px-10 sm:py-12">
          <div className="relative mx-auto mt-1 h-24 w-full max-w-4xl overflow-hidden bg-transparent sm:mt-2 sm:h-32">
            <svg
              className="absolute inset-0 hidden h-full w-full text-[#d0d6d2] sm:block"
              viewBox="0 0 1200 120"
              preserveAspectRatio="xMidYMid meet"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="8" cy="78" r="8.5" fill="currentColor" />
              <path
                id="hero-track-path-desktop"
                d={desktopTrackPath}
                stroke="currentColor"
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="11 9"
              />
              <path
                d="M1188 78 L1164 65 M1188 78 L1164 91"
                stroke="currentColor"
                strokeWidth="4.5"
                strokeLinecap="round"
              />
              <g className="text-moss-700">
                <path
                  d="M8 0c0-4-3-7-7-7S-6-4-6 0s3 7 7 7c3 0 5-2 5-5 0-2-1.8-3.5-3.6-3.5S-1 0-1 1.8c0 1.3.9 2.2 2.1 2.2"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M-10 8h13c6 0 11 4 12 9H2c-7 0-12-3.5-12-9Z"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M5 8l2.5-4.2" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
                <path d="M9 8l3.4-4" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
                <animateMotion dur="28s" repeatCount="indefinite" rotate="0">
                  <mpath href="#hero-track-path-desktop" />
                </animateMotion>
              </g>
            </svg>

            <svg
              className="absolute inset-0 h-full w-full text-[#d0d6d2] sm:hidden"
              viewBox="0 0 360 96"
              preserveAspectRatio="xMidYMid meet"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="14" cy="58" r="6" fill="currentColor" />
              <path
                id="hero-track-path-mobile"
                d={mobileTrackPath}
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="9 8"
              />
              <path
                d="M350 58 L334 48 M350 58 L334 68"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <g className="text-moss-700">
                <path
                  d="M7 0c0-3.6-2.8-6.2-6.2-6.2S-5.4-3.6-5.4 0s2.8 6.2 6.2 6.2c2.7 0 4.5-1.8 4.5-4.5 0-1.8-1.6-3-3.2-3S-0.8 0-0.8 1.5c0 1.1.8 1.9 1.9 1.9"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M-9 7h12c5.4 0 9.8 3.7 10.8 8.2H2c-6.4 0-11-3.2-11-8.2Z"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M4.8 7l2.1-3.7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                <path d="M8.3 7l3-3.4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                <animateMotion dur="28s" repeatCount="indefinite" rotate="0">
                  <mpath href="#hero-track-path-mobile" />
                </animateMotion>
              </g>
            </svg>
          </div>

          <TypewriterHeadline
            text="慢一点也没关系，持续前进就很好"
            className="mx-auto mt-7 min-h-[6.5rem] w-fit max-w-[18rem] text-left text-[1.8rem] leading-[1.42] text-ink-900 sm:mt-8 sm:min-h-[4.3rem] sm:max-w-3xl sm:text-center sm:text-[2.45rem]"
            speedMs={180}
            pauseMs={3000}
            mobileBreakBefore="持续前进就很好"
          />

          <div className="motion-fade-up motion-delay-2 mt-7 space-y-3 sm:mt-8">
            <Link href="/plans/new" className={buttonClasses("primary", "lg") + " h-11 px-7"}>
              开始记录
            </Link>
            <p className="text-sm text-ink-900/50">
              已有计划？前往
              <Link href="/plans" className="mx-1 text-moss-700 hover:underline">
                “我的计划”
              </Link>
              继续记录
            </p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
