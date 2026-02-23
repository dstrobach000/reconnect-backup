export const BLOCK_A = `Reconnect provides an annual opportunity for a focused assessment of the current state of the music trade and its associated art scenes – both within the specific context of the host city of Brno and within a broader European framework, with particular attention to scenes in Eastern Europe and the former “concrete fence” countries.

Despite the richness and diversity of these scenes, Eastern European artists remain underrepresented within the wider European music circuit. This structural imbalance often leads to marginalisation not only in terms of visibility, but also economic stability and long-term opportunity. One of its recurring consequences is a transient relationship to cities such as Brno – artists pass through them rather than settling within them, not due to a lack of local potential, but because exposure, financial security, and sustained creative opportunities are insufficient to support long-term practice. This dynamic can be observed across much of the former Eastern Bloc: cities that function as informal “transfer zones,” capable of producing artists and ideas, yet rarely able to afford retaining them long enough for meaningful knowledge exchange and the development of local talent ecosystems.`;

export const BLOCK_B = `While it is undoubtedly possible to create compelling work using nothing more than a laptop and the proverbial cracked copy of Ableton Live – and while access to expensive studios and rare equipment is no longer a prerequisite for artistic production – the reality is that sustained artistic growth rarely occurs in isolation. Regular creative exchange, live performance opportunities, and exposure to new contexts remain crucial for artists to prosper and fully develop their practice. These structural conditions are not unique to Eastern Europe; similar patterns can be observed even more starkly in many African music scenes, where limited access to infrastructure, touring networks, and institutional support further amplifies cycles of extraction and displacement.

Reconnect positions itself as a temporary counterweight to this extractive circulation, creating conditions in which knowledge, labour, and attention can remain locally concentrated – if only for a limited time.

The post-COVID shift in music economics (and creative economies more broadly) has further reshaped this landscape. Brno can be seen as a particularly illustrative example of these changes: traditional headliner-driven models are steadily losing dominance, while independent and underground electronic music scenes are thriving. This growth is driven by adventurous, open-minded communities built from the ground up – communities composed of forward-thinking artists, risk-taking promoters and venue owners, frontline cultural workers (from sound and lighting engineers to bartenders and door staff), and, crucially, committed listeners and dancers.

Reconnect seeks to bring these individuals together across several venues over three days: to initiate critical discussions, present challenging and exploratory performances, and strengthen existing relationships while forging new ones. The goal is to cultivate durable, supportive networks that benefit artists, cultural workers, and engaged audiences alike – networks capable of sustaining creative practices beyond the event itself.`;

export const SECTION_CONFIG = [
  {
    id: 'section-2',
    headingFont: 'var(--font-hofmann)',
    bodyFont: 'var(--font-dazzed)',
    glyph: 'squares',
  },
  {
    id: 'section-3',
    headingFont: 'var(--font-mekanikal)',
    bodyFont: 'var(--font-documan)',
    glyph: 'sonarWave',
  },
  {
    id: 'section-4',
    headingFont: 'var(--font-ofform)',
    bodyFont: 'var(--font-lazzer)',
    glyph: 'sun',
  },
  {
    id: 'section-5',
    headingFont: 'var(--font-hofmann)',
    bodyFont: 'var(--font-newedge666)',
    glyph: 'compassGrid',
  },
  {
    id: 'section-6',
    headingFont: 'var(--font-mekanikal)',
    bodyFont: 'var(--font-roobertmono)',
    glyph: 'updown',
  },
  {
    id: 'section-7',
    headingFont: 'var(--font-ofform)',
    bodyFont: 'var(--font-documan)',
    glyph: 'radarSector',
  },
];

export function splitParagraphs(content) {
  return content.split('\n\n');
}
