import Link from "next/link";
import { TypewriterHeadline } from "@/components/home/typewriter-headline";
import { PageShell } from "@/components/page-shell";
import { buttonClasses } from "@/components/ui/button";

export default function HomePage() {
  const trackPath =
    "M8 78 C40 78 40 46 72 46 C104 46 104 78 136 78 C168 78 168 46 200 46 C232 46 232 78 264 78 C296 78 296 46 328 46 C360 46 360 78 392 78 C424 78 424 46 456 46 C488 46 488 78 520 78 C552 78 552 46 584 46 C616 46 616 78 648 78 C680 78 680 46 712 46 C744 46 744 78 776 78 C808 78 808 46 840 46 C872 46 872 78 904 78 C936 78 936 46 968 46 C1000 46 1000 78 1032 78 C1064 78 1064 46 1096 46 C1128 46 1128 78 1160 78";

  return (
    <PageShell currentPath="/" heroTone="home">
      <section className="mx-auto max-w-5xl">
        <div className="motion-float-in rounded-[2rem] border border-white/80 bg-gradient-to-b from-white/82 to-moss-50/58 px-6 py-10 text-center shadow-[0_24px_56px_-46px_rgba(31,42,38,0.62)] sm:px-10 sm:py-12">
          <div className="relative mx-auto mt-2 h-32 w-full max-w-4xl overflow-hidden rounded-2xl bg-transparent">
            <svg
              className="absolute inset-0 h-full w-full text-[#d0d6d2]"
              viewBox="0 0 1200 120"
              preserveAspectRatio="none"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="8" cy="78" r="8.5" fill="currentColor" />
              <path
                id="hero-track-path"
                d={trackPath}
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
                  <mpath href="#hero-track-path" />
                </animateMotion>
              </g>
            </svg>
          </div>

          <TypewriterHeadline
            text="慢一点也没关系，持续前进就很好"
            className="mx-auto mt-8 min-h-[3.4rem] w-fit max-w-3xl text-left text-[2rem] leading-[1.34] text-ink-900 sm:min-h-[4.3rem] sm:text-[2.45rem]"
            speedMs={280}
          />

          <div className="motion-fade-up motion-delay-2 mt-8 space-y-3">
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
