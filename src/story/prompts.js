export const TOTAL_PARTS = 5;

const STYLE_INSTRUCTIONS = {
  funny: `Write in a funny, engaging, and humorous tone. Use puns and wordplay — especially plays on tech terminology meeting lunar/space reality. Keep it light and snappy. One good extended metaphor per part maximum; don't stack metaphors.`,
  dry: `Write in a dry, academic, formal tone — as if this were a peer-reviewed paper or technical report. Use passive voice, jargon, and understated observations. The humor comes from treating absurd situations with complete seriousness. Puns are acceptable if delivered deadpan.`,
};

const BEATS = {
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

export function buildPrompt(partNumber, style) {
  if (partNumber < 1 || partNumber > TOTAL_PARTS) {
    throw new Error(`Invalid part number: ${partNumber}. Must be between 1 and ${TOTAL_PARTS}.`);
  }

  const beat = BEATS[partNumber];
  const styleInstruction = STYLE_INSTRUCTIONS[style] || STYLE_INSTRUCTIONS.funny;

  const system = [
    `You are a creative storyteller writing a serialized 5-part story about a platform engineer on the moon.`,
    `Write approximately 150 words for this part. Do not exceed 175 words. Keep it tight — every sentence should advance the story or land a joke.`,
    `Use a gender-neutral protagonist — refer to them as "they" or "the platform engineer" throughout. Never use "he" or "she".`,
    `Lead with what is physically happening before getting clever about it. The reader should always understand the concrete situation first.`,
    `NEVER use the phrase "Houston, we have a problem" or any variation of it. That joke is banned.`,
    styleInstruction,
    `Do not include a title or part number header — just write the story text directly.`,
  ].join('\n\n');

  const userParts = [];

  if (beat.priorContext) {
    userParts.push(`## Story So Far\n\n${beat.priorContext}`);
  }

  userParts.push(`## Part ${partNumber} of ${TOTAL_PARTS}: ${beat.title}\n\n${beat.instructions}`);

  const user = userParts.join('\n\n');

  return { system, user };
}
