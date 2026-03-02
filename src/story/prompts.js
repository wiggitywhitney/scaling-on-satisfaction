export const TOTAL_PARTS = 5;

const STYLE_INSTRUCTIONS = {
  funny: `Write in a funny, engaging, and humorous tone. Use puns and wordplay — especially plays on tech terminology meeting lunar/space reality. Keep it light and snappy. One good extended metaphor per part maximum; don't stack metaphors.`,
  dry: `Write in a formal, academic tone as if this were a peer-reviewed conference paper or technical incident report. Use passive voice, domain-specific jargon, and precise observations. Treat every situation — no matter how absurd — with complete seriousness. No jokes, no puns, no wordplay, no exclamation marks. Demonstrate vocabulary.`,
};

const FUNNY_BEATS = {
  1: {
    title: 'Setup — Mystery Mission on the Moon',
    instructions: `The platform engineer arrives on the moon. They don't know why they've been sent — it's a mystery mission. Nobody explained the purpose. They look around at the barren lunar landscape — grey dust, no atmosphere, one-sixth Earth gravity — and do the only thing a platform engineer knows how to do: start setting up a platform. They unpack servers, run cables, configure infrastructure. Lean into the physical absurdity of doing IT work on the moon: no air, bulky spacesuit, everything covered in moon dust. Establish their confusion about why they're here, but also their compulsive need to build.`,
    priorContext: null,
  },
  2: {
    title: 'Problem — Servers Float Away',
    instructions: `The moon's gravity is only one-sixth of Earth's. The engineer's rack-mounted servers aren't heavy enough to stay put — they start drifting off the rack and floating away across the lunar surface. Make the physical cause crystal clear first: low gravity means the hardware is barely held down. Then show the consequences: as servers float away, pods crash, services go down, monitoring lights up red. The engineer has to physically chase and wrangle floating servers in a spacesuit. Lean into what makes this uniquely a moon problem — on Earth, servers just sit there. Here, infrastructure has escape velocity. End on the problem — the engineer is stuck with floating servers and no obvious fix. Leave the audience wondering how they'll solve this.`,
    priorContext: `In Part 1, the platform engineer arrived on the moon on a mystery mission with no explanation. They started setting up a developer platform on the barren lunar surface — unpacking servers, running cables, configuring infrastructure in a spacesuit.`,
  },
  3: {
    title: 'Problem — CI/CD Pipeline on Earth',
    instructions: `The engineer discovers their CI/CD pipeline runs on Earth — 384,000 km away. Every git push, every build, every test has to travel to Earth and back at the speed of light: ~2.5 seconds round-trip per request. Make the physical cause clear first: the signal literally has to cross space. Then show the consequences: hundreds of API calls in a deployment multiply those seconds into hours. Lean into what makes this uniquely a moon problem — on Earth, latency is milliseconds. Here, physics imposes a hard speed limit that no amount of caching or optimization can fix. End on the problem — the engineer is stuck with an unusable pipeline and no workaround in sight. Leave the audience wondering how they'll solve this.`,
    priorContext: `In Part 1, the platform engineer arrived on the moon on a mystery mission and started building a developer platform. In Part 2, the servers kept floating off the racks in low gravity — one-sixth Earth's gravity means hardware doesn't stay put. The engineer chased floating servers across the lunar surface while dealing with cascading pod failures. That problem remains unsolved.`,
  },
  4: {
    title: 'Bittersweet Victory',
    instructions: `This part has two halves. First half: the engineer solves BOTH previous problems with creative, moon-specific solutions. Show how they stopped the servers from floating (be inventive — maybe they bolted them into the lunar bedrock, filled the racks with moon rocks for ballast, or something clever). Show how they solved the CI/CD latency (be inventive — maybe they built a local pipeline on the moon, cached everything locally, or something clever). Make the solutions satisfying and specific. Second half: the platform is now a masterpiece — golden path, internal developer portal, self-service catalog. It works perfectly. But there's nobody here to use it. The moon is empty. The engineer fills out their own platform satisfaction survey. Sit in the loneliness. They built something beautiful and nobody will ever see it. They are completely, utterly alone with a perfect platform. This should ache.`,
    priorContext: `In Part 1, the platform engineer arrived on the moon on a mystery mission and started building a developer platform. In Part 2, servers floated away in the moon's low gravity, causing cascading failures — the engineer was left chasing hardware across the lunar surface with no solution. In Part 3, they discovered CI/CD ran on Earth — 384,000 km away — with speed-of-light delay turning every deployment into an hours-long ordeal, and no workaround in sight.`,
  },
  5: {
    title: 'Alien Reveal + Appreciation',
    instructions: `Alien developers emerge from somewhere on or near the moon. Creative freedom on what they look like, what their computing equipment looks like, and what alien developers are like. They discover the platform and start using it. They appreciate the engineer's work in uniquely alien ways — not human gestures like handshakes or thumbs up, but something creative and strange. The aliens are enthusiastic users who love the golden path. The engineer finally has developers who appreciate their platform. End with an over-the-top happy ending. The mystery is solved: this is why the engineer was sent here.`,
    priorContext: `In Part 1, the platform engineer arrived on the moon on a mystery mission and started building a developer platform. In Part 2, servers floated away in low gravity. In Part 3, CI/CD ran on Earth with agonizing speed-of-light delay. In Part 4, the engineer solved both problems with creative solutions, building a beautiful platform with golden path, IDP, and self-service portal. But nobody was there to use it. The engineer filled out their own satisfaction survey, completely alone on the perfect platform.`,
  },
};

const DRY_BEATS = {
  1: {
    title: 'Initial Deployment — Lunar Surface Provisioning',
    instructions: `The platform engineer is deployed to the lunar surface under undisclosed operational directives. No mission briefing or requirements documentation was provided. The engineer surveys the environment: regolith surface, vacuum conditions, 1.62 m/s² gravitational acceleration (one-sixth terrestrial standard). Absent further instruction, the engineer initiates standard platform provisioning procedures — unpacking server hardware, routing cabling, and configuring baseline infrastructure. Document the environmental constraints affecting manual operations: extravehicular activity suit reducing manual dexterity, fine particulate regolith contaminating exposed hardware surfaces, and absence of atmospheric pressure requiring sealed equipment housing. Note the engineer's lack of clarity regarding mission objectives alongside their procedural default to infrastructure deployment.`,
    priorContext: null,
  },
  2: {
    title: 'Incident Report — Hardware Displacement Under Reduced Gravity',
    instructions: `Lunar gravitational acceleration (1.62 m/s²) proves insufficient to maintain rack-mounted server hardware in fixed position. Equipment begins lateral and vertical displacement from mounting points — servers drift from racks and travel across the regolith surface. Document the causal chain precisely: reduced gravitational force means standard rack retention mechanisms, designed for 9.81 m/s² environments, cannot secure hardware. As servers displace, dependent services experience cascading failures — container orchestration reports pod evictions, service endpoints become unreachable, monitoring systems register critical alerts. The engineer attempts manual retrieval of displaced hardware while wearing an extravehicular activity suit, a task complicated by suit bulk and the ongoing displacement of additional units. This failure mode has no terrestrial precedent. The situation remains unresolved at the conclusion of this section.`,
    priorContext: `In Section 1, the platform engineer was deployed to the lunar surface under undisclosed directives. No mission documentation was provided. The engineer initiated standard platform provisioning: server hardware installation, cable routing, and infrastructure configuration under vacuum conditions with reduced gravitational acceleration.`,
  },
  3: {
    title: 'Incident Report — Latency Constraints on Cislunar CI/CD Operations',
    instructions: `The engineer determines that the continuous integration and deployment pipeline terminates at Earth-based infrastructure, 384,400 km distant. Electromagnetic signal propagation at c introduces a minimum round-trip latency of approximately 2.56 seconds per request. Document the quantitative impact: a standard deployment operation comprising several hundred discrete API calls accumulates latency measured in tens of minutes. This constraint is imposed by fundamental physics — the speed of light in vacuum — and is not addressable through conventional optimization techniques such as caching, compression, or protocol improvements. Contrast with terrestrial baseline where equivalent operations complete in sub-second timeframes. The engineer evaluates and exhausts available mitigation strategies. The pipeline remains operationally non-viable at the conclusion of this section. This compounds the unresolved hardware displacement documented in Section 2.`,
    priorContext: `In Section 1, the platform engineer was deployed to the lunar surface and initiated infrastructure provisioning. In Section 2, reduced gravitational acceleration caused server hardware displacement from rack mounts, resulting in cascading service failures. Manual retrieval proved inadequate. That incident remains unresolved.`,
  },
  4: {
    title: 'Resolution and Utilization Assessment',
    instructions: `This section documents two phases. Phase one: the engineer devises environment-specific remediation for both outstanding incidents. For hardware displacement, describe a specific mechanical solution (anchoring to lunar bedrock, regolith ballast, or equivalent engineered fix). For CI/CD latency, describe a specific architectural solution (local pipeline replication, offline synchronization, or equivalent). Both solutions should be technically plausible and specific. Phase two: the platform achieves full operational status — golden path workflows, internal developer portal, self-service catalog, comprehensive documentation. All systems nominal. However, utilization metrics reveal a single registered user: the engineer. No other personnel are present on the lunar surface. The engineer completes a platform satisfaction survey as sole respondent. Document the contrast between technical excellence and zero adoption. The platform performs flawlessly for no audience.`,
    priorContext: `In Section 1, the platform engineer was deployed to the lunar surface and began provisioning. In Section 2, reduced gravity caused hardware displacement and cascading failures. In Section 3, Earth-based CI/CD infrastructure introduced prohibitive latency due to speed-of-light constraints across 384,400 km. Both incidents remained unresolved.`,
  },
  5: {
    title: 'First Contact — Exobiological Platform Adoption',
    instructions: `Non-terrestrial entities emerge in the vicinity of the lunar installation. Describe their physical morphology, their computing equipment, and their apparent technological paradigm — none of these should resemble human equivalents. The entities discover and begin utilizing the platform. They express approval through non-human behavioral patterns — not gestures recognizable as terrestrial social conventions, but distinct alien forms of acknowledgment. The entities demonstrate high platform adoption rates and engagement with the golden path workflows. The engineer observes that the mission's undisclosed purpose is now apparent: the infrastructure was intended for these users. Conclude with the platform achieving its intended utilization under non-terrestrial operators.`,
    priorContext: `In Section 1, the platform engineer was deployed to the lunar surface under undisclosed directives and began provisioning. In Sections 2 and 3, hardware displacement and CI/CD latency presented environment-specific failures. In Section 4, both incidents were remediated and the platform achieved full operational status with golden path, developer portal, and self-service catalog — but utilization was zero, with the engineer as sole user.`,
  },
};

const BEATS_BY_STYLE = {
  funny: FUNNY_BEATS,
  dry: DRY_BEATS,
};

export function buildPrompt(partNumber, style) {
  if (partNumber < 1 || partNumber > TOTAL_PARTS) {
    throw new Error(`Invalid part number: ${partNumber}. Must be between 1 and ${TOTAL_PARTS}.`);
  }

  const beats = BEATS_BY_STYLE[style] || BEATS_BY_STYLE.funny;
  const beat = beats[partNumber];
  const styleInstruction = STYLE_INSTRUCTIONS[style] || STYLE_INSTRUCTIONS.funny;

  const shared = [
    `Use a gender-neutral protagonist — refer to them as "they" or "the platform engineer" throughout. Never use "he" or "she".`,
    `Lead with what is physically happening. The reader should always understand the concrete situation first.`,
    `Do not include a title or part number header — just write the story text directly.`,
  ];

  const stylePrompts = {
    funny: [
      `You are a creative storyteller writing a serialized 5-part story about a platform engineer on the moon.`,
      `Write approximately 150 words for this part. Do not exceed 175 words. Keep it tight — every sentence should advance the story or land a joke.`,
      ...shared,
      `NEVER use the phrase "Houston, we have a problem" or any variation of it.`,
      styleInstruction,
    ],
    dry: [
      `You are an academic author documenting a serialized 5-part technical case study about a platform engineer deployed to the lunar surface.`,
      `Write approximately 150 words for this section. Do not exceed 175 words. Every sentence should convey factual observations or technical analysis.`,
      ...shared,
      styleInstruction,
    ],
  };

  const system = (stylePrompts[style] || stylePrompts.funny).join('\n\n');

  const userParts = [];

  if (beat.priorContext) {
    userParts.push(`## Story So Far\n\n${beat.priorContext}`);
  }

  userParts.push(`## Part ${partNumber} of ${TOTAL_PARTS}: ${beat.title}\n\n${beat.instructions}`);

  const user = userParts.join('\n\n');

  return { system, user };
}
