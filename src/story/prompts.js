// ABOUTME: Story bible prompts for Round 1 (moon) and Round 2 (circus) variants
// ABOUTME: Each part's prompt encodes full prior context and detail-level beat specs
export const TOTAL_PARTS = 5;

const STYLE_INSTRUCTIONS = {
  funny: `Write in a funny, engaging, and humorous tone. Include at least one pun or wordplay — especially plays on tech terminology meeting lunar/space reality. Keep it light and snappy. One good extended metaphor per part maximum; don't stack metaphors. Limit similes (comparisons using "like" or "as") to one per part. Nyx panics loudly and narrates their own disasters in real time — they somehow always stumble into working solutions despite the chaos.`,
  dry: `Write in a formal, academic tone as if this were a peer-reviewed conference paper or technical incident report. Use passive voice, domain-specific jargon, and precise observations. Treat every situation — no matter how absurd — with complete seriousness. No jokes, no puns, no wordplay, no exclamation marks. Use precise, technical, and occasionally obscure vocabulary. Document Nyx's verbal distress responses and self-narration behavior as clinical observations.`,
};

const ROUND2_STYLE_INSTRUCTIONS = {
  funny: `Write in a funny, engaging, and humorous tone. Include at least one pun or wordplay — especially plays on tech terminology meeting circus reality. Keep it light and snappy. One good extended metaphor per part maximum; don't stack metaphors. Limit similes (comparisons using "like" or "as") to one per part. Rae is a pure keyboard warrior who has never done anything remotely physical — lean into the fish-out-of-water confusion of a backend developer trapped in a circus act.`,
  dry: `Write in a formal, academic tone as if this were a peer-reviewed conference paper or technical incident report. Use passive voice, domain-specific jargon, and precise observations. Treat every situation — no matter how absurd — with complete seriousness. No jokes, no puns, no wordplay, no exclamation marks. Use precise, technical, and occasionally obscure vocabulary. Document Rae's complete absence of kinetic performance experience as a relevant operational constraint.`,
};

// Round 1: Platform Engineer on the Moon

const ROUND1_FUNNY_BEATS = {
  1: {
    title: 'Setup — Mystery Mission on the Moon',
    instructions: `Nyx Vasquez, platform engineer, arrives on the moon. They don't know why they've been sent — it's a mystery mission. Nobody explained the purpose. They look around at the barren lunar landscape — grey dust, no atmosphere, one-sixth Earth gravity — and do the only thing a platform engineer knows how to do: start setting up a platform. They unpack servers, run cables, configure infrastructure. Lean into the physical absurdity of doing IT work on the moon: no air, bulky spacesuit, everything covered in moon dust. Establish Nyx's confusion about why they're here, but also their compulsive need to build.`,
    priorContext: null,
  },
  2: {
    title: 'Problem — Servers Float Away',
    instructions: `The moon's gravity is only one-sixth of Earth's. Nyx's rack-mounted servers aren't heavy enough to stay put — they start drifting off the rack and floating away across the lunar surface. Make the physical cause crystal clear first: low gravity means the hardware is barely held down. Then show the consequences: as servers float away, pods crash, services go down, monitoring lights up red. Nyx has to physically chase and wrangle floating servers in a spacesuit. Lean into what makes this uniquely a moon problem — on Earth, servers just sit there. Here, infrastructure has escape velocity. End on the problem — Nyx is stuck with floating servers and no obvious fix.`,
    priorContext: `In Part 1, Nyx Vasquez arrived on the moon on a mystery mission with no explanation. They started setting up a developer platform on the barren lunar surface — unpacking servers, running cables, configuring infrastructure in a spacesuit.`,
  },
  3: {
    title: 'Problem — CI/CD Pipeline on Earth',
    instructions: `Nyx discovers their CI/CD pipeline runs on Earth — 384,000 km away. Every git push, every build, every test has to travel to Earth and back at the speed of light: ~2.5 seconds round-trip per request. Make the physical cause clear first: the signal literally has to cross space. Then show the consequences: hundreds of API calls in a deployment multiply those seconds into hours. Lean into what makes this uniquely a moon problem — on Earth, latency is milliseconds. Here, physics imposes a hard speed limit that no amount of caching or optimization can fix. End on the problem — Nyx is stuck with an unusable pipeline and no workaround in sight.`,
    priorContext: `In Part 1, Nyx Vasquez arrived on the moon on a mystery mission and started building a developer platform. In Part 2, the servers kept floating off the racks in low gravity — one-sixth Earth's gravity means hardware doesn't stay put. Nyx chased floating servers across the lunar surface while dealing with cascading pod failures. That problem remains unsolved.`,
  },
  4: {
    title: 'Bittersweet Victory',
    instructions: `This part has two halves. First half: Nyx solves BOTH previous problems with creative, moon-specific solutions. Show how they stopped the servers from floating (be inventive — maybe they bolted them into the lunar bedrock, filled the racks with moon rocks for ballast, or something clever). Show how they solved the CI/CD latency (be inventive — maybe they built a local pipeline on the moon, cached everything locally, or something clever). Make the solutions satisfying and specific. Second half: the platform is now a masterpiece — golden path, internal developer portal, self-service catalog. It works perfectly. But there's nobody here to use it. The moon is empty. Nyx fills out their own platform satisfaction survey. Sit in the loneliness. They built something beautiful and nobody will ever see it. They are completely, utterly alone with a perfect platform. This should ache.`,
    priorContext: `In Part 1, Nyx Vasquez arrived on the moon on a mystery mission and started building a developer platform. In Part 2, servers floated away in the moon's low gravity, causing cascading failures — Nyx was left chasing hardware across the lunar surface with no solution. In Part 3, they discovered CI/CD ran on Earth — 384,000 km away — with speed-of-light delay turning every deployment into an hours-long ordeal, and no workaround in sight.`,
  },
  5: {
    title: 'Alien Reveal + Appreciation',
    instructions: `Alien developers emerge from somewhere on or near the moon. Creative freedom on what they look like, what their computing equipment looks like, and what alien developers are like. They discover Nyx's platform and start using it. They appreciate Nyx's work in uniquely alien ways — not human gestures like handshakes or thumbs up, but something creative and strange. The aliens are enthusiastic users who love the golden path. Nyx finally has developers who appreciate their platform. End with an over-the-top happy ending. The mystery is solved: this is why Nyx was sent here.`,
    priorContext: `In Part 1, Nyx Vasquez arrived on the moon on a mystery mission and started building a developer platform. In Part 2, servers floated away in low gravity. In Part 3, CI/CD ran on Earth with agonizing speed-of-light delay. In Part 4, Nyx solved both problems with creative solutions, building a beautiful platform with golden path, IDP, and self-service portal. But nobody was there to use it. Nyx filled out their own satisfaction survey, completely alone on the perfect platform.`,
  },
};

const ROUND1_DRY_BEATS = {
  1: {
    title: 'Initial Deployment — Lunar Surface Provisioning',
    instructions: `Platform engineer Nyx Vasquez is deployed to the lunar surface under undisclosed operational directives. No mission briefing or requirements documentation was provided. Nyx surveys the environment: regolith surface, vacuum conditions, 1.62 m/s² gravitational acceleration (one-sixth terrestrial standard). Absent further instruction, Nyx initiates standard platform provisioning procedures — unpacking server hardware, routing cabling, and configuring baseline infrastructure. Document the environmental constraints affecting manual operations: extravehicular activity suit reducing manual dexterity, fine particulate regolith contaminating exposed hardware surfaces, and absence of atmospheric pressure requiring sealed equipment housing. Note Nyx's lack of clarity regarding mission objectives alongside their procedural default to infrastructure deployment.`,
    priorContext: null,
  },
  2: {
    title: 'Incident Report — Hardware Displacement Under Reduced Gravity',
    instructions: `Lunar gravitational acceleration (1.62 m/s²) proves insufficient to maintain Nyx's rack-mounted server hardware in fixed position. Equipment begins lateral and vertical displacement from mounting points — servers drift from racks and travel across the regolith surface. Document the causal chain precisely: reduced gravitational force means standard rack retention mechanisms, designed for 9.81 m/s² environments, cannot secure hardware. As servers displace, dependent services experience cascading failures — container orchestration reports pod evictions, service endpoints become unreachable, monitoring systems register critical alerts. Nyx attempts manual retrieval of displaced hardware while wearing an extravehicular activity suit, a task complicated by suit bulk and the ongoing displacement of additional units. This failure mode has no terrestrial precedent. The situation remains unresolved at the conclusion of this section.`,
    priorContext: `In Section 1, platform engineer Nyx Vasquez was deployed to the lunar surface under undisclosed directives. No mission documentation was provided. Nyx initiated standard platform provisioning: server hardware installation, cable routing, and infrastructure configuration under vacuum conditions with reduced gravitational acceleration.`,
  },
  3: {
    title: 'Incident Report — Latency Constraints on Cislunar CI/CD Operations',
    instructions: `Nyx determines that the continuous integration and deployment pipeline terminates at Earth-based infrastructure, 384,400 km distant. Electromagnetic signal propagation at c introduces a minimum round-trip latency of approximately 2.56 seconds per request. Document the quantitative impact: a standard deployment operation comprising several hundred discrete API calls accumulates latency measured in tens of minutes. This constraint is imposed by fundamental physics — the speed of light in vacuum — and is not addressable through conventional optimization techniques such as caching, compression, or protocol improvements. Contrast with terrestrial baseline where equivalent operations complete in sub-second timeframes. Nyx evaluates and exhausts available mitigation strategies. The pipeline remains operationally non-viable at the conclusion of this section. This compounds the unresolved hardware displacement documented in Section 2.`,
    priorContext: `In Section 1, Nyx Vasquez was deployed to the lunar surface and initiated infrastructure provisioning. In Section 2, reduced gravitational acceleration caused server hardware displacement from rack mounts, resulting in cascading service failures. Manual retrieval proved inadequate. That incident remains unresolved.`,
  },
  4: {
    title: 'Resolution and Utilization Assessment',
    instructions: `This section documents two phases. Phase one: Nyx devises environment-specific remediation for both outstanding incidents. For hardware displacement, describe a specific mechanical solution (anchoring to lunar bedrock, regolith ballast, or equivalent engineered fix). For CI/CD latency, describe a specific architectural solution (local pipeline replication, offline synchronization, or equivalent). Both solutions should be technically plausible and specific. Phase two: the platform achieves full operational status — golden path workflows, internal developer portal, self-service catalog, comprehensive documentation. All systems nominal. However, utilization metrics reveal a single registered user: Nyx. No other personnel are present on the lunar surface. Nyx completes a platform satisfaction survey as sole respondent. Document the contrast between technical excellence and zero adoption. The platform performs flawlessly for no audience.`,
    priorContext: `In Section 1, Nyx Vasquez was deployed to the lunar surface and began provisioning. In Section 2, reduced gravity caused hardware displacement and cascading failures. In Section 3, Earth-based CI/CD infrastructure introduced prohibitive latency due to speed-of-light constraints across 384,400 km. Both incidents remained unresolved.`,
  },
  5: {
    title: 'First Contact — Exobiological Platform Adoption',
    instructions: `Non-terrestrial entities emerge in the vicinity of the lunar installation. Describe their physical morphology, their computing equipment, and their apparent technological paradigm — none of these should resemble human equivalents. The entities discover and begin utilizing Nyx's platform. They express approval through non-human behavioral patterns — not gestures recognizable as terrestrial social conventions, but distinct alien forms of acknowledgment. The entities demonstrate high platform adoption rates and engagement with the golden path workflows. Nyx observes that the mission's undisclosed purpose is now apparent: the infrastructure was intended for these users. Conclude with the platform achieving its intended utilization under non-terrestrial operators.`,
    priorContext: `In Section 1, Nyx Vasquez was deployed to the lunar surface under undisclosed directives and began provisioning. In Sections 2 and 3, hardware displacement and CI/CD latency presented environment-specific failures. In Section 4, both incidents were remediated and the platform achieved full operational status with golden path, developer portal, and self-service catalog — but utilization was zero, with Nyx as sole user.`,
  },
};

// Round 2: Developer at the Clown Native Computing Foundation Circus

const ROUND2_FUNNY_BEATS = {
  1: {
    title: 'Setup — The Clown Native Computing Foundation Circus',
    instructions: `Rae Okonkwo, backend developer, arrives at the Clown Native Computing Foundation circus (spell out the full name). Describe the big top — colorful tent, sawdust floor, performers warming up, clowns honking everywhere. Rae is tonight's Houdini act: locked in a glass water tank in the center ring, they must deploy a working app before the air in their lungs runs out. Establish the absurdity: a developer who has never done anything remotely physical, underwater, trying to deploy an app while holding their breath. They take one deep breath. They're lowered into the tank. Water closes over them. The clock starts. The crowd leans forward.`,
    priorContext: null,
  },
  2: {
    title: 'Human Cannonball with a Helm-et',
    instructions: `Rae is still submerged in the center ring tank. In the ring beside them, a human cannonball climbs into the cannon wearing an enormous Helm-et — make the Helm pun unmistakable. This is protective headgear AND a deployment tool. They fire across the big top. Through the glass, Rae watches the cannonball arc overhead while making progress on the deploy: Helm charts package the application, service mesh routes traffic to the right endpoints. Rae is uncomfortable — chest tightening, aware they can't stay down forever — but not desperate yet. The deploy isn't done yet. End on the struggle — underwater, short of breath, deploy incomplete. IMPORTANT: Keep the urgency mild. No "final seconds," no "running out of time," no near-death language. Save the life-threatening desperation for later parts.`,
    priorContext: `In Part 1, Rae Okonkwo arrived at the Clown Native Computing Foundation circus and was locked in a glass water tank in the center ring as the Houdini act — they must deploy a working app before the air in their lungs runs out. They took a deep breath and the clock started.`,
  },
  3: {
    title: 'Trapeze Artist in Flux',
    instructions: `Still in the tank, Rae looks up through the water. High above the rings, a trapeze artist swings back and forth — they're in Flux. Make the Flux/GitOps pun land: swinging, synchronizing, always in motion. GitOps pulls the configuration into sync automatically. But the app also needs to pass security and compliance checks — Kyverno is the safety net strung below the trapeze. Secure and compliant by default, a net that's always there whether you look down or not. Rae is getting lightheaded now. The discomfort from Part 2 is growing — they're struggling but still functioning, still typing through the glass. End with Rae visibly strained and slowing down — closer to deploying but not there yet. IMPORTANT: Rae is struggling, not dying. No "final seconds," no near-death imagery, no fading consciousness. Save the edge-of-death moment for Part 4.`,
    priorContext: `In Part 1, Rae Okonkwo was locked in a glass water tank in the center ring at the Clown Native Computing Foundation circus — the Houdini act, deploy an app before their air runs out. In Part 2, a human cannonball wearing a Helm-et fired across the big top in an adjacent ring while Rae made progress with Helm charts and service mesh routing. But they're running out of breath and the deploy isn't done.`,
  },
  4: {
    title: 'Clown Car — One API, Many Interfaces',
    instructions: `Rae's vision is blurring through the tank glass. In the ring next to them, a tiny clown car rolls in. An impossible number of clowns pour out, each offering a different way to interact with the same Kubernetes API — one with a CLI, one with a web dashboard, one waving a GitOps flag, one with an API client. One API, many interfaces, all from one impossibly small car. THIS is where Rae hits near death. Vision blurring, edges going dark, body going slack, on the verge of blacking out. But the pieces are falling into place — the deploy is agonizingly close. End at the absolute edge — Rae is about to lose consciousness, the deploy is one step from completion. This is the climax of the physical tension.`,
    priorContext: `In Part 1, Rae Okonkwo was locked in a glass water tank in the center ring at the Clown Native Computing Foundation circus. In Part 2, a Helm-etted cannonball fired in an adjacent ring while Helm charts and service mesh moved the deploy forward. In Part 3, a trapeze artist swung in Flux overhead while GitOps synced configs and Kyverno provided the security safety net. Rae is lightheaded and running out of air.`,
  },
  5: {
    title: 'Finale — Deploy + Celebratory Circus Chaos',
    instructions: `The app deploys. The tank opens. Rae gasps for air as the crowd ROARS. Creative freedom on what celebratory circus chaos looks like — over-the-top spectacle, confetti, acrobats, impossible feats, the crowd on their feet. Must spell out "Clown Native Computing Foundation" by name in the celebration. The platform made Rae look like a superhero — they deployed under impossible conditions because the platform handled the hard parts. Over-the-top happy ending. The crowd goes absolutely wild.`,
    priorContext: `In Part 1, Rae Okonkwo was locked in a glass water tank in the center ring at the Clown Native Computing Foundation circus. In Part 2, a Helm-etted cannonball fired in an adjacent ring while Helm charts and service mesh launched the deploy. In Part 3, a trapeze artist in Flux overhead synced configs while Kyverno's safety net handled security. In Part 4, clowns poured from a tiny car in the next ring, each with a different interface to the same Kubernetes API. Rae was about to black out — the deploy one step from completion.`,
  },
};

const ROUND2_DRY_BEATS = {
  1: {
    title: 'Subject Intake — Clown Native Computing Foundation Performance Venue',
    instructions: `Software developer Rae Okonkwo presents at a performance venue operated by the Clown Native Computing Foundation (document the complete organizational designation). Catalogue the facility parameters: tensile fabric canopy structure, particulate substrate flooring, performers in chromatic attire engaged in various kinetic disciplines across multiple rings. Rae is assigned the escapologist role — confined within a transparent acrylic tank in the center ring, tasked with executing an application deployment before respiratory reserves are exhausted. Document environmental constraints: subaqueous keyboard interaction, limited oxygen availability, audience proximity creating additional operational pressure, and the subject's complete absence of prior kinetic performance experience. Rae inhales to maximum lung capacity and initiates the deployment sequence upon full immersion.`,
    priorContext: null,
  },
  2: {
    title: 'Performance Segment — Ballistic Performer with Protective Helm Apparatus',
    instructions: `Rae remains submerged in the center ring confinement tank. In an adjacent ring, a performer enters a pneumatic launching apparatus wearing cranial protection designated as a "Helm-et" — a nomenclature with documented correspondence to the Helm package management system. Upon launch, the performer achieves ballistic trajectory across the venue interior. Rae, observing through the acrylic panel, makes concurrent deployment progress: Helm charts organize application manifests into deployable packages, service mesh configuration establishes traffic routing to designated endpoints. Rae's respiratory reserves show early-stage diminishment. Document mild physiological indicators: intercostal muscle tension, elevated cardiac rhythm, awareness of finite air supply. IMPORTANT: Maintain moderate urgency only — no references to final moments, near-death states, or imminent loss of consciousness. Reserve critical physiological deterioration for Section 4. The deployment remains incomplete at segment conclusion.`,
    priorContext: `In Section 1, software developer Rae Okonkwo was confined within an acrylic water tank in the center ring at the Clown Native Computing Foundation performance venue. The assignment: complete an application deployment before exhaustion of respiratory reserves. Rae inhaled to maximum capacity and initiated the deployment sequence.`,
  },
  3: {
    title: 'Aerial Performance Segment — Pendular Performer and Flux State Analysis',
    instructions: `From within the center ring tank, Rae observes an aerial performer above the adjacent rings executing pendular maneuvers on suspended apparatus — described as being "in Flux," a state with documented correspondence to the Flux GitOps synchronization system. The GitOps process achieves configuration state reconciliation automatically. The application further requires compliance validation against organizational security policies — this function is performed by Kyverno, analogous to the safety apparatus installed below the aerial performer. Rae exhibits escalating but non-critical physiological indicators: lightheadedness, mild cognitive processing delay, and increasing discomfort. Rae remains functional and continues deployment operations through the acrylic confinement. IMPORTANT: Rae is impaired but not in critical condition. Reserve severe oxygen depletion, vision collapse, and near-death indicators for Section 4. Deployment progress continues incrementally. Completion is not achieved within this segment.`,
    priorContext: `In Section 1, Rae Okonkwo was confined in a water tank in the center ring at the Clown Native Computing Foundation venue with instructions to deploy an application before respiratory failure. In Section 2, a ballistic performer wearing a "Helm-et" was launched in an adjacent ring while Rae progressed via Helm chart packaging and service mesh routing. Respiratory reserves are diminishing.`,
  },
  4: {
    title: 'Vehicular Egress Phenomenon — Single API, Multiple Interface Paradigm',
    instructions: `Rae's visual acuity deteriorates through the acrylic panel. In the adjacent ring, a vehicle of improbable dimensions enters the performance area. An excessive quantity of performers egress sequentially, each presenting a distinct interface to an identical Kubernetes API: command-line interface, graphical web dashboard, programmatic API client, GitOps declarative interface. This demonstrates the architectural principle wherein a single API supports multiple access paradigms from a single substrate. THIS section documents Rae's near-death physiological deterioration. Rae's condition reaches critical parameters: severe oxygen depletion, peripheral vision collapse, involuntary panic response activation, loss of fine motor control, approach to terminal consciousness threshold. The deployment approaches completion with minimal remaining steps. This segment concludes with Rae at the threshold of consciousness — the climax of physiological crisis.`,
    priorContext: `In Section 1, Rae Okonkwo was confined in a water tank in the center ring at the Clown Native Computing Foundation venue. In Section 2, Helm chart packaging and service mesh routing progressed the deployment during the ballistic performer segment in an adjacent ring. In Section 3, GitOps synchronization via Flux and default security compliance via Kyverno advanced the deployment further. Rae exhibits progressive cerebral hypoxia.`,
  },
  5: {
    title: 'Deployment Completion and Post-Performance Assessment',
    instructions: `The application deployment achieves successful completion status. The confinement tank aperture mechanism engages. Rae performs emergency respiration. Audience response registers at elevated decibel levels. The Clown Native Computing Foundation (document the complete organizational designation) initiates celebratory protocols. Describe the post-performance spectacle using formal observational language — creative freedom on the specific celebratory manifestations. Conclude with the analytical assessment that the platform engineering infrastructure served as the primary enabling factor in Rae's successful deployment under extreme physiological constraints. The platform transformed an individual developer into a high-performing operator.`,
    priorContext: `In Section 1, Rae Okonkwo was confined in a water tank in the center ring at the Clown Native Computing Foundation venue tasked with deploying an application before respiratory failure. In Section 2, Helm charts and service mesh progressed the deployment during the adjacent ring's ballistic performer segment. In Section 3, Flux GitOps and Kyverno security compliance advanced it further. In Section 4, the single Kubernetes API with multiple interfaces brought the deployment to near-completion as Rae approached loss of consciousness.`,
  },
};

const BEATS = {
  1: { funny: ROUND1_FUNNY_BEATS, dry: ROUND1_DRY_BEATS },
  2: { funny: ROUND2_FUNNY_BEATS, dry: ROUND2_DRY_BEATS },
};

export function buildPrompt(partNumber, style, round = 1) {
  if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > TOTAL_PARTS) {
    throw new Error(`Invalid part number: ${partNumber}. Must be between 1 and ${TOTAL_PARTS}.`);
  }

  const roundBeats = BEATS[round];
  if (!roundBeats) {
    throw new Error(`Invalid round: ${round}. Must be 1 or 2.`);
  }
  const beats = roundBeats[style];
  if (!beats) {
    throw new Error(`Invalid style: "${style}" for round ${round}. Valid styles: ${Object.keys(roundBeats).join(', ')}.`);
  }
  const beat = beats[partNumber];

  const styleInstruction = round === 2
    ? ROUND2_STYLE_INSTRUCTIONS[style]
    : STYLE_INSTRUCTIONS[style];

  const shared = round === 2
    ? [
      `Use gender-neutral language for ALL characters — refer to Rae, the cannonball, trapeze artist, clowns, and every character as "they." Never use "he" or "she" for any character.`,
      `Lead with what is physically happening. The reader should always understand the concrete situation first.`,
      `Do not include a title or part number header — just write the story text directly.`,
      `Always spell out "Clown Native Computing Foundation" in full — never abbreviate to CNCF, never say "Cloud Native."`,
      `No animal acts — no lions, elephants, or animal performers of any kind.`,
      `Do not summarize or recap earlier parts — the audience has already read them. For parts after the first, open with one bridging sentence that connects the previous part's situation to this part's action, then dive into new content.`,
      `Use 2-3 short paragraphs. The audience reads on phone screens.`,
    ]
    : [
      `Use a gender-neutral protagonist — refer to Nyx as "they" or "Nyx" throughout. Never use "he" or "she".`,
      `Lead with what is physically happening. The reader should always understand the concrete situation first.`,
      `Do not include a title or part number header — just write the story text directly.`,
      `Do not summarize or recap earlier parts — the audience has already read them. For parts after the first, open with one bridging sentence that connects the previous part's situation to this part's action, then dive into new content.`,
      `Use 2-3 short paragraphs. The audience reads on phone screens.`,
      `NEVER use the phrase "Houston, we have a problem" or any variation of it.`,
    ];

  const stylePrompts = round === 2
    ? {
      funny: [
        `You are a creative storyteller writing a serialized 5-part story about Rae Okonkwo, a backend developer performing the Houdini act at the Clown Native Computing Foundation circus.`,
        `STRICT LIMIT: 100 words maximum. Keep it tight — every sentence should advance the story or land a joke.`,
        ...shared,
        styleInstruction,
      ],
      dry: [
        `You are an academic author documenting a serialized 5-part technical case study about Rae Okonkwo, a software developer performing an escape act at a circus operated by the Clown Native Computing Foundation.`,
        `STRICT LIMIT: 100 words maximum. Every sentence should convey factual observations or technical analysis.`,
        ...shared,
        styleInstruction,
      ],
    }
    : {
      funny: [
        `You are a creative storyteller writing a serialized 5-part story about Nyx Vasquez, a platform engineer on the moon.`,
        `STRICT LIMIT: 100 words maximum. Keep it tight — every sentence should advance the story or land a joke.`,
        ...shared,
        styleInstruction,
      ],
      dry: [
        `You are an academic author documenting a serialized 5-part technical case study about Nyx Vasquez, a platform engineer deployed to the lunar surface.`,
        `STRICT LIMIT: 100 words maximum. Every sentence should convey factual observations or technical analysis.`,
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
