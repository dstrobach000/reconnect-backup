'use client';

import InlineAutoplayVideo from '../media/InlineAutoplayVideo';

const LEFT_COLUMN_PARAGRAPHS = [
  `Reconnect provides an annual opportunity for a focused assessment of the current state of the music trade and its associated art scenes – both within the specific context of the host city of Brno and within a broader European framework, with particular attention to scenes in Eastern Europe and the former “concrete fence” countries.`,
  `Despite the richness and diversity of these scenes, Eastern European artists remain underrepresented within the wider European music circuit. This structural imbalance often leads to marginalisation not only in terms of visibility, but also economic stability and long-term opportunity. One of its recurring consequences is a transient relationship to cities such as Brno – artists pass through them rather than settling within them, not due to a lack of local potential, but because exposure, financial security, and sustained creative opportunities are insufficient to support long-term practice. This dynamic can be observed across much of the former Eastern Bloc: cities that function as informal “transfer zones,” capable of producing artists and ideas, yet rarely able to afford retaining them long enough for meaningful knowledge exchange and the development of local talent ecosystems.`,
  `While it is undoubtedly possible to create compelling work using nothing more than a laptop and the proverbial cracked copy of Ableton Live – and while access to expensive studios and rare equipment is no longer a prerequisite for artistic production – the reality is that sustained artistic growth rarely occurs in isolation. Regular creative exchange, live performance opportunities, and exposure to new contexts remain crucial for artists to prosper and fully develop their practice. These structural conditions are not unique to Eastern Europe; similar patterns can be observed even more starkly in many African music scenes, where limited access to infrastructure, touring networks, and institutional support further amplifies cycles of extraction and displacement.`,
];

const RIGHT_COLUMN_PARAGRAPHS = [
  `Reconnect positions itself as a temporary counterweight to this extractive circulation, creating conditions in which knowledge, labour, and attention can remain locally concentrated – if only for a limited time.`,
  `The post-COVID shift in music economics (and creative economies more broadly) has further reshaped this landscape. Brno can be seen as a particularly illustrative example of these changes: traditional headliner-driven models are steadily losing dominance, while independent and underground electronic music scenes are thriving. This growth is driven by adventurous, open-minded communities built from the ground up – communities composed of forward-thinking artists, risk-taking promoters and venue owners, frontline cultural workers (from sound and lighting engineers to bartenders and door staff), and, crucially, committed listeners and dancers.`,
  `Reconnect seeks to bring these individuals together across several venues over three days: to initiate critical discussions, present challenging and exploratory performances, and strengthen existing relationships while forging new ones. The goal is to cultivate durable, supportive networks that benefit artists, cultural workers, and engaged audiences alike – networks capable of sustaining creative practices beyond the event itself.`,
];

export default function ReconnectClosingSection() {
  return (
    <section className="w-full border-y border-[rgb(var(--signal-rgb)/0.22)] bg-white text-black">
      <div className="mx-auto w-full max-w-7xl px-6 py-14 md:py-20">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[minmax(170px,0.8fr)_1fr_1fr] md:grid-rows-[auto_1fr] md:gap-12">
          <div className="order-2 md:row-span-2 md:row-start-1">
            <div className="relative aspect-square w-full max-w-[260px] overflow-hidden bg-black [contain:paint]">
              <InlineAutoplayVideo
                src="/exports/512_dot_01.mp4"
                className="absolute inset-0 block h-full w-full object-cover [backface-visibility:hidden] [transform:translateZ(0)]"
                preload="metadata"
              />
            </div>
          </div>

          <div className="order-1 md:col-span-2 md:col-start-2">
            <h2
              className="text-5xl leading-none tracking-tight md:text-6xl"
              style={{ fontFamily: 'var(--font-mekanikal)' }}
            >
              Reconnect:
            </h2>
          </div>

          <div className="order-3 md:col-start-2">
            <div className="space-y-5 text-[15px] leading-[1.5] md:text-[14px]" style={{ fontFamily: 'var(--font-roobertmono)' }}>
              {LEFT_COLUMN_PARAGRAPHS.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div className="order-4 space-y-5 text-[15px] leading-[1.5] md:col-start-3 md:text-[14px]" style={{ fontFamily: 'var(--font-roobertmono)' }}>
            {RIGHT_COLUMN_PARAGRAPHS.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
