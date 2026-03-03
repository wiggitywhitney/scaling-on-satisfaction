export const TOTAL_PARTS = 5;

const STYLE_INSTRUCTIONS = {
  funny: `Write in a funny, engaging, and humorous tone. Use puns and wordplay — especially plays on tech terminology meeting lunar/space reality. Keep it light and snappy. One good extended metaphor per part maximum; don't stack metaphors.`,
  dry: `Write in a formal, academic tone as if this were a peer-reviewed conference paper or technical incident report. Use passive voice, domain-specific jargon, and precise observations. Treat every situation — no matter how absurd — with complete seriousness. No jokes, no puns, no wordplay, no exclamation marks. Use precise, technical, and occasionally obscure vocabulary.`,
};

const ROUND2_STYLE_INSTRUCTIONS = {
  funny: `Write in a funny, engaging, and humorous tone. Use puns and wordplay — especially plays on tech terminology meeting circus reality. Keep it light and snappy. One good extended metaphor per part maximum; don't stack metaphors.`,
  dry: `Write in a formal, academic tone as if this were a peer-reviewed conference paper or technical incident report. Use passive voice, domain-specific jargon, and precise observations. Treat every situation — no matter how absurd — with complete seriousness. No jokes, no puns, no wordplay, no exclamation marks. Use precise, technical, and occasionally obscure vocabulary.`,
};

// Round 1: Platform Engineer on the Moon

const ROUND1_FUNNY_BEATS = {
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

const ROUND1_DRY_BEATS = {
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

// Round 2: Developer at the Clown Native Computing Foundation Circus

const ROUND2_FUNNY_BEATS = {
  1: {
    title: 'Setup — The Clown Native Computing Foundation Circus',
    instructions: `The developer arrives at the Clown Native Computing Foundation circus (spell out the full name). Describe the big top — colorful tent, sawdust floor, performers warming up, clowns honking everywhere. They're tonight's Houdini act: locked in a glass water tank, they must deploy a working app before the air in their lungs runs out. Establish the absurdity: a developer, underwater, trying to deploy an app while holding their breath. They take one deep breath. They're lowered into the tank. Water closes over them. The clock starts. The crowd leans forward.`,
    priorContext: null,
  },
  2: {
    title: 'Human Cannonball with a Helm-et',
    instructions: `A human cannonball climbs into the cannon wearing an enormous Helm-et — make the Helm pun unmistakable. This is protective headgear AND a deployment tool. They fire across the big top. Meanwhile underwater, the developer makes progress: Helm charts package the application, service mesh routes traffic to the right endpoints. The deploy launches into the cluster like the cannonball across the tent. But the developer is running out of breath. Chest tight, lungs burning. The deploy isn't done yet. End on the struggle — underwater, breathless, deploy incomplete. Leave the audience wondering if they'll make it.`,
    priorContext: `In Part 1, the developer arrived at the Clown Native Computing Foundation circus and was locked in a glass water tank as the Houdini act — they must deploy a working app before the air in their lungs runs out. They took a deep breath and the clock started.`,
  },
  3: {
    title: 'Trapeze Artist in Flux',
    instructions: `High above the ring, a trapeze artist swings back and forth — they're in Flux. Make the Flux/GitOps pun land: swinging, synchronizing, always in motion. GitOps pulls the configuration into sync automatically. But the app also needs to pass security and compliance checks — Kyverno is the safety net below the trapeze. Secure and compliant by default, a net that's always there whether you look down or not. The developer is getting lightheaded. Vision starting to swim. Lungs screaming. Still not deployed. End with the developer fading — closer but not there yet.`,
    priorContext: `In Part 1, the developer was locked in a glass water tank at the Clown Native Computing Foundation circus — the Houdini act, deploy an app before their air runs out. In Part 2, a human cannonball wearing a Helm-et fired across the big top while the developer made progress with Helm charts and service mesh routing. But they're running out of breath and the deploy isn't done.`,
  },
  4: {
    title: 'Clown Car — One API, Many Interfaces',
    instructions: `A tiny clown car rolls into the ring. An impossible number of clowns pour out, each offering a different way to interact with the same Kubernetes API — one with a CLI, one with a web dashboard, one waving a GitOps flag, one with an API client. One API, many interfaces, all from one impossibly small car. The developer is panicking now. Vision blurring, edges going dark, chest screaming for air. But the pieces are falling into place. The deploy is agonizingly close. End at the very edge — the developer is about to black out, the deploy is one step from completion.`,
    priorContext: `In Part 1, the developer was locked in a glass water tank at the Clown Native Computing Foundation circus. In Part 2, a Helm-etted cannonball fired while Helm charts and service mesh moved the deploy forward. In Part 3, a trapeze artist swung in Flux while GitOps synced configs and Kyverno provided the security safety net. The developer is lightheaded and running out of air.`,
  },
  5: {
    title: 'Finale — Deploy + Celebratory Circus Chaos',
    instructions: `The app deploys. The tank opens. The developer gasps for air as the crowd ROARS. Creative freedom on what celebratory circus chaos looks like — over-the-top spectacle, confetti, acrobats, impossible feats, the crowd on their feet. Must spell out "Clown Native Computing Foundation" by name in the celebration. The platform made the developer look like a superhero — they deployed under impossible conditions because the platform handled the hard parts. Over-the-top happy ending. The crowd goes absolutely wild.`,
    priorContext: `In Part 1, the developer was locked in a glass water tank at the Clown Native Computing Foundation circus. In Part 2, a Helm-etted cannonball fired while Helm charts and service mesh launched the deploy. In Part 3, a trapeze artist in Flux synced configs while Kyverno's safety net handled security. In Part 4, clowns poured from a tiny car, each with a different interface to the same Kubernetes API. The developer was about to black out — the deploy one step from completion.`,
  },
};

const ROUND2_DRY_BEATS = {
  1: {
    title: 'Subject Intake — Clown Native Computing Foundation Performance Venue',
    instructions: `A software developer presents at a performance venue operated by the Clown Native Computing Foundation (document the complete organizational designation). Catalogue the facility parameters: tensile fabric canopy structure, particulate substrate flooring, performers in chromatic attire engaged in various kinetic disciplines. The subject is assigned the escapologist role — confined within a transparent acrylic tank filled with water, tasked with executing an application deployment before respiratory reserves are exhausted. Document environmental constraints: subaqueous keyboard interaction, limited oxygen availability, audience proximity creating additional operational pressure. The subject inhales to maximum lung capacity and initiates the deployment sequence upon full immersion.`,
    priorContext: null,
  },
  2: {
    title: 'Performance Segment — Ballistic Performer with Protective Helm Apparatus',
    instructions: `A performer enters a pneumatic launching apparatus wearing cranial protection designated as a "Helm-et" — a nomenclature with documented correspondence to the Helm package management system. Upon launch, the performer achieves ballistic trajectory across the venue interior. The subject, submerged in the confinement tank, makes concurrent deployment progress: Helm charts organize application manifests into deployable packages, service mesh configuration establishes traffic routing to designated endpoints. However, the subject's respiratory reserves are diminishing measurably. Document physiological indicators: intercostal muscle tension, elevated cardiac rhythm, reduction in fine motor coordination. The deployment remains incomplete at segment conclusion.`,
    priorContext: `In Section 1, a software developer was confined within an acrylic water tank at the Clown Native Computing Foundation performance venue. The assignment: complete an application deployment before exhaustion of respiratory reserves. The subject inhaled to maximum capacity and initiated the deployment sequence.`,
  },
  3: {
    title: 'Aerial Performance Segment — Pendular Performer and Flux State Analysis',
    instructions: `An aerial performer executes pendular maneuvers on suspended apparatus at significant elevation — described as being "in Flux," a state with documented correspondence to the Flux GitOps synchronization system. The GitOps process achieves configuration state reconciliation automatically. The application further requires compliance validation against organizational security policies — this function is performed by Kyverno, analogous to the safety apparatus installed below the aerial performer. This represents a default security posture requiring no explicit configuration by the developer. The subject exhibits indicators of cerebral hypoxia: they are lightheaded, experiencing visual field disturbance, cognitive processing delay, and involuntary respiratory reflex suppression. Deployment progress continues incrementally. Completion is not achieved within this segment.`,
    priorContext: `In Section 1, the subject was confined in a water tank at the Clown Native Computing Foundation venue with instructions to deploy an application before respiratory failure. In Section 2, a ballistic performer wearing a "Helm-et" was launched while the subject progressed via Helm chart packaging and service mesh routing. Respiratory reserves are diminishing.`,
  },
  4: {
    title: 'Vehicular Egress Phenomenon — Single API, Multiple Interface Paradigm',
    instructions: `A vehicle of improbable dimensions enters the performance area. An excessive quantity of performers egress sequentially, each presenting a distinct interface to an identical Kubernetes API: command-line interface, graphical web dashboard, programmatic API client, GitOps declarative interface. This demonstrates the architectural principle wherein a single API supports multiple access paradigms from a single substrate. The subject's physiological condition has deteriorated to critical parameters: severe oxygen depletion, peripheral vision collapse, involuntary panic response activation, loss of fine motor control. The deployment approaches completion with minimal remaining steps. This segment concludes with the subject at the threshold of consciousness.`,
    priorContext: `In Section 1, the subject was confined in a water tank at the Clown Native Computing Foundation venue. In Section 2, Helm chart packaging and service mesh routing progressed the deployment during the ballistic performer segment. In Section 3, GitOps synchronization via Flux and default security compliance via Kyverno advanced the deployment further. The subject exhibits progressive cerebral hypoxia.`,
  },
  5: {
    title: 'Deployment Completion and Post-Performance Assessment',
    instructions: `The application deployment achieves successful completion status. The confinement tank aperture mechanism engages. The subject performs emergency respiration. Audience response registers at elevated decibel levels. The Clown Native Computing Foundation (document the complete organizational designation) initiates celebratory protocols. Describe the post-performance spectacle using formal observational language — creative freedom on the specific celebratory manifestations. Conclude with the analytical assessment that the platform engineering infrastructure served as the primary enabling factor in the subject's successful deployment under extreme physiological constraints. The platform transformed an individual developer into a high-performing operator.`,
    priorContext: `In Section 1, the subject was confined in a water tank at the Clown Native Computing Foundation venue tasked with deploying an application before respiratory failure. In Section 2, Helm charts and service mesh progressed the deployment. In Section 3, Flux GitOps and Kyverno security compliance advanced it further. In Section 4, the single Kubernetes API with multiple interfaces brought the deployment to near-completion as the subject approached loss of consciousness.`,
  },
};

const BEATS = {
  1: { funny: ROUND1_FUNNY_BEATS, dry: ROUND1_DRY_BEATS },
  2: { funny: ROUND2_FUNNY_BEATS, dry: ROUND2_DRY_BEATS },
};

export function buildPrompt(partNumber, style, round = 1) {
  if (partNumber < 1 || partNumber > TOTAL_PARTS) {
    throw new Error(`Invalid part number: ${partNumber}. Must be between 1 and ${TOTAL_PARTS}.`);
  }

  const roundBeats = BEATS[round] || BEATS[1];
  const beats = roundBeats[style] || roundBeats.funny;
  const beat = beats[partNumber];

  const styleInstruction = round === 2
    ? (ROUND2_STYLE_INSTRUCTIONS[style] || ROUND2_STYLE_INSTRUCTIONS.funny)
    : (STYLE_INSTRUCTIONS[style] || STYLE_INSTRUCTIONS.funny);

  const shared = round === 2
    ? [
      `Use gender-neutral language for ALL characters — refer to the developer, cannonball, trapeze artist, clowns, and every character as "they." Never use "he" or "she" for any character.`,
      `Lead with what is physically happening. The reader should always understand the concrete situation first.`,
      `Do not include a title or part number header — just write the story text directly.`,
      `Always spell out "Clown Native Computing Foundation" in full — never abbreviate to CNCF, never say "Cloud Native."`,
      `No animal acts — no lions, elephants, or animal performers of any kind.`,
      `Do not summarize or recap earlier parts — the audience has already read them. Start directly in the action of this part.`,
      `Use 2-3 short paragraphs. The audience reads on phone screens.`,
    ]
    : [
      `Use a gender-neutral protagonist — refer to them as "they" or "the platform engineer" throughout. Never use "he" or "she".`,
      `Lead with what is physically happening. The reader should always understand the concrete situation first.`,
      `Do not include a title or part number header — just write the story text directly.`,
      `Do not summarize or recap earlier parts — the audience has already read them. Start directly in the action of this part.`,
      `Use 2-3 short paragraphs. The audience reads on phone screens.`,
      `NEVER use the phrase "Houston, we have a problem" or any variation of it.`,
    ];

  const stylePrompts = round === 2
    ? {
      funny: [
        `You are a creative storyteller writing a serialized 5-part story about a developer performing the Houdini act at the Clown Native Computing Foundation circus.`,
        `Write at least 130 words and no more than 175 words (target 150). Keep it tight — every sentence should advance the story or land a joke.`,
        ...shared,
        styleInstruction,
      ],
      dry: [
        `You are an academic author documenting a serialized 5-part technical case study about a developer performing an escape act at a circus operated by the Clown Native Computing Foundation.`,
        `Write at least 130 words and no more than 175 words (target 150). Every sentence should convey factual observations or technical analysis.`,
        ...shared,
        styleInstruction,
      ],
    }
    : {
      funny: [
        `You are a creative storyteller writing a serialized 5-part story about a platform engineer on the moon.`,
        `Write at least 130 words and no more than 175 words (target 150). Keep it tight — every sentence should advance the story or land a joke.`,
        ...shared,
        styleInstruction,
      ],
      dry: [
        `You are an academic author documenting a serialized 5-part technical case study about a platform engineer deployed to the lunar surface.`,
        `Write at least 130 words and no more than 175 words (target 150). Every sentence should convey factual observations or technical analysis.`,
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
