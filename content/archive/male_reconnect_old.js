module.exports = [
  // 1 - 10
  {
    format: "introspective analysis",
    tone: "honest, calm, hopeful",
    theme: "breakup clarity",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a male user who wants to reconnect with his ex**.

  ### Topic: What Went Wrong? Understanding the Breakup

  ### Requirements:
  - 650–800 words
  - Guide the reader through an emotionally honest but non-blaming analysis of the breakup
  - Introduce 2 frameworks (e.g., **Imago Dynamics**, **Attachment Conflicts**)
  - Include a personal story of a man who came to painful clarity *after* the breakup
  - Offer a “cause map” reflection tool for mapping reactions vs root triggers
  - End with: “The truth doesn’t punish you. It prepares you.”

  ⚠️ SAFETY:
  Avoid demonising either partner. Clarity is not the same as blame. Invite ownership without shame.
  `,
  },

  {
    format: "healing story",
    tone: "vulnerable, real, redemptive",
    theme: "emotional responsibility",
    prompt: (gender, goalStage) => `
  You are a breakup coach writing a **premium guide for a male user who wants to reconnect with his ex**.

  ### Topic: Owning Your Part Without Shame

  ### Requirements:
  - 500–600 words in **first-person story format**, as if told by a real man
  - Describe how he spotted his own defensive patterns (e.g. shutdown, control)
  - Show how self-responsibility created inner peace — not just external change
  - Include a journaling tool called “Where I showed up small”
  - End with: “Accountability isn’t a burden. It’s the start of real strength.”

  ⚠️ SAFETY:
  Avoid macho language. The tone should feel human, raw, and hopeful — not performative.
  `,
  },

  {
    format: "step-by-step reflection",
    tone: "supportive, non-judgmental, precise",
    theme: "communication breakdown",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a male user who wants to reconnect with his ex**.

  ### Topic: The Conversations That Broke You

  ### Requirements:
  - 450–550 words
  - Break down 3 types of damaging interactions (e.g., sarcasm, emotional stonewalling, passive-aggression)
  - For each, explain what emotional wound it covered and how to do it differently next time
  - Include a guided reflection: “What did I protect — and what did it cost me?”
  - End with a downloadable or printable worksheet for analysing past arguments

  ⚠️ SAFETY:
  No finger-pointing. Keep it constructive. Focus on emotional fluency, not “debate skills.”
  `,
  },

  {
    format: "mental shift",
    tone: "honest, challenging, transformative",
    theme: "ego and control",
    prompt: (gender, goalStage) => `
  You are a breakup coach helping a man who wants to reconnect with his ex.

  ### Topic: Wanting Her vs. Needing Her

  ### Requirements:
  - 600–900 words
  - Explore the difference between desire and dependence using real-world metaphors (e.g., fire vs oxygen)
  - Include a thought experiment: “If she never came back, what life would you still be proud of?”
  - Offer a “mirror drill” to name what parts of his self-image depended on the relationship
  - End with a reframe: “Needing someone to feel whole is the first way to lose yourself.”

  ⚠️ SAFETY:
  Avoid anti-vulnerability bias. This is about reclaiming power — not performing stoicism.
  `,
  },

  {
    format: "letter-based",
    tone: "raw, heartfelt, unresolved",
    theme: "unfinished grief",
    prompt: (gender, goalStage) => `
  You are a breakup coach guiding a man who wants to reconnect with his ex.

  ### Topic: The Letter You’ll Never Send

  ### Requirements:
  - 500–700 words
  - Help the reader write a letter with 3 chapters: *What I Miss*, *What I’ve Learned*, *What I Wish For You*
  - Clarify that this is a **self-expression** tool, not a manipulative act
  - Include writing prompts to unlock difficult emotions (“What I never said was…”)
  - End with: “Letting the words out doesn’t mean letting her go. It means setting your truth free.”

  ⚠️ SAFETY:
  Do not encourage actual message delivery. This is private, reflective writing for healing.
  `,
  },

  {
    format: "internal inventory",
    tone: "calm, grounded, introspective",
    theme: "self-evolution",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach helping a man trying to reconnect with his ex.

  ### Topic: Who Were You in the Relationship?

  ### Requirements:
  - 600–800 words
  - Invite the reader to audit himself through 3 lenses: *how he handled conflict*, *how he gave (or withheld) affection*, and *how he showed up under pressure*
  - Provide a 3-column table: *What I was*, *What I feared*, *What I want to be now*
  - Share a story of a man who finally saw how he’d emotionally disappeared in the relationship
  - End with: “Start becoming the man who would never need to prove himself again.”

  ⚠️ SAFETY:
  Avoid identity shaming. This is a growth audit, not a guilt trip.
  `,
  },

  {
    format: "reframe exercise",
    tone: "psychological, structured, motivational",
    theme: "redefining rejection",
    prompt: (gender, goalStage) => `
  You are a breakup coach helping a man who wants to reconnect with his ex but feels rejected.

  ### Topic: What If This Isn’t Rejection?

  ### Requirements:
  - 450–600 words
  - Offer 4 reasons why silence doesn’t always mean “no”: space, overwhelm, grief, uncertainty
  - Share 2 stories of men who misunderstood “no contact” and later learned its real meaning
  - Include a reframe tool: *Reaction vs Reality*
  - End with a new mantra: “Not hearing back doesn’t mean you’ve failed. It means you’re being asked to pause.”

  ⚠️ SAFETY:
  Avoid false hope. The goal is emotional detachment from outcomes — not denial.
  `,
  },

  {
    format: "future-focus",
    tone: "hopeful, focused, self-assured",
    theme: "earned second chances",
    prompt: (gender, goalStage) => `
  You are a breakup coach helping a man prepare to reconnect with his ex — if the time is right.

  ### Topic: If You Got One More Chance, Are You Ready?

  ### Requirements:
  - 500–750 words
  - Help the reader **visualise** a second chance moment — what it would require, emotionally and practically
  - Include 3 reflection questions:
    1. What has truly changed in me?
    2. What patterns would I not repeat?
    3. What new version of this relationship would I want?
  - End with a checklist called “Prepared — Or Pressuring?”

  ⚠️ SAFETY:
  Do not sell the fantasy of second chances. Focus on inner preparation over external permission.
  `,
  },

  {
    format: "emotional patterning",
    tone: "psychological, methodical, empowering",
    theme: "trigger awareness",
    prompt: (gender, goalStage) => `
  You are a breakup coach helping a man rebuild emotional maturity before reconnecting with his ex.

  ### Topic: Know Your Triggers Before You Reconnect

  ### Requirements:
  - 550–700 words
  - Introduce the concept of emotional triggers using a metaphor like “emotional landmines”
  - Teach a simple 3-step process: *Spot It*, *Name It*, *Neutralise It*
  - Include a case of a man who sabotaged reconnection because of unresolved triggers
  - End with a breathing + journaling micro-routine for de-escalation

  ⚠️ SAFETY:
  Avoid pathologising emotions. Teach awareness, not avoidance.
  `,
  },

  {
    format: "guided forgiveness",
    tone: "gentle, deep, spiritual but grounded",
    theme: "past healing",
    prompt: (gender, goalStage) => `
  You are a breakup coach helping a man reconnect — not just with his ex, but with his **integrity**.

  ### Topic: Forgiveness Isn’t About Her

  ### Requirements:
  - 600–900 words
  - Guide the reader through **self-forgiveness** — especially for things he regrets but cannot undo
  - Introduce a 3-part framework: *Acknowledge honestly*, *Accept reality*, *Act differently now*
  - Offer a quiet reflection ritual (e.g., night journaling, voice memo, symbolic act)
  - End with: “You don’t need her forgiveness to forgive yourself. You need your own courage.”

  ⚠️ SAFETY:
  Do not encourage public confessions or performative apologies. Keep it inward and real.
  `,
  },
  // 11 - 20
  {
    format: "visualisation exercise",
    tone: "calm, strategic, reality-based",
    theme: "goal clarity",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a man who wants to reconnect with his ex**.

  ### Topic: What Would Winning Her Back Actually Look Like?

  ### Requirements:
  - 500–800 words
  - Help the reader get clear on what “reconnection” really means — practically and emotionally
  - Explore three scenarios: romantic reset, slow rebuild, or emotional closure
  - Include a mini guided visualisation (1 paragraph) where the man imagines the first honest conversation post-reunion
  - End with 4 clarity questions about readiness, intention, and vision

  ⚠️ SAFETY:
  Avoid fairytale framing. Emphasise maturity and realism.
  `,
  },

  {
    format: "masculine reframing",
    tone: "direct, motivational, sharp",
    theme: "personal transformation",
    prompt: (gender, goalStage) => `
  You are a breakup coach writing a **premium guide for a man who wants to reconnect with his ex**.

  ### Topic: Attraction Isn’t Fixing — It’s Evolving

  ### Requirements:
  - 600–900 words
  - Challenge the idea that self-improvement is a project to “win her back”
  - Redefine attractiveness as a by-product of internal stability, purpose, and leadership
  - Use masculine psychology principles like “mission before approval”
  - Include a checklist: *Evolving Man vs. Approval-Seeking Boy*
  - End with: “She’s not coming back for a version of you that exists only to please her.”

  ⚠️ SAFETY:
  Avoid toxic masculinity tropes. Inspire growth without posturing.
  `,
  },

  {
    format: "strategic awareness",
    tone: "honest, instructive, clear",
    theme: "trust rebuilding",
    prompt: (gender, goalStage) => `
  You are a breakup coach writing a **premium guide for a man who wants to reconnect with his ex**.

  ### Topic: The 3 Things She Needs to See Before She'll Trust You Again

  ### Requirements:
  - 500–700 words
  - List and explain 3 key shifts she needs to *see*, not just hear:
    1. Emotional stability (no desperation or mood swings)
    2. Honest ownership of past behaviour (no sugarcoating)
    3. Clear future intention (not “let’s see what happens”)
  - Include 3 “Before / After” examples from fictional men
  - End with a one-line reminder: “You don’t earn trust back by asking — you show it, steadily.”

  ⚠️ SAFETY:
  Avoid manipulation. The focus is on integrity, not tactics.
  `,
  },

  {
    format: "timing guidance",
    tone: "measured, grounded, logical",
    theme: "reconnection timing",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a man who wants to reconnect with his ex**.

  ### Topic: How Long Should You Wait Before Reaching Out?

  ### Requirements:
  - 600–850 words
  - Dispel myths like “30-day no contact”
  - Introduce three readiness criteria:
    - You can handle any response
    - You’re not using contact to soothe your own anxiety
    - You have clarity on *why* you’re reaching out
  - Share a short story of a man who waited too little, and one who waited just enough
  - End with a “Readiness Litmus Test”

  ⚠️ SAFETY:
  Avoid giving rigid timeframes. Focus on internal cues, not calendar dates.
  `,
  },

  {
    format: "emotional reality check",
    tone: "gentle, courageous, accepting",
    theme: "emotional resilience",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a man who wants to reconnect with his ex**.

  ### Topic: What If She's Moved On?

  ### Requirements:
  - 700–950 words
  - Acknowledge the reader’s hope while preparing him emotionally for reality
  - Teach how to distinguish between rejection and redirection
  - Include a 3-phase reflection model: *Hurt*, *Hope*, *Honour*
  - Share a short case of a man who reconnected with peace, not partnership
  - End with: “You can want her back — and still become the man who walks forward with grace.”

  ⚠️ SAFETY:
  Don’t crush hope — but do prepare the reader to respect her new life if she’s not coming back.
  `,
  },

  {
    format: "identity reset",
    tone: "existential, reflective, grounding",
    theme: "post-breakup identity",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a man who wants to reconnect with his ex**.

  ### Topic: Who Are You Without This Relationship?

  ### Requirements:
  - 600–850 words
  - Guide the reader to rediscover who he is beyond the role of “her partner”
  - Explore identity anchors: purpose, values, personal rhythm
  - Include a self-identity audit worksheet (3 columns: *Before*, *During*, *Becoming*)
  - End with: “You can offer her a man — not a shadow of who you were with her.”

  ⚠️ SAFETY:
  Do not suggest he must erase his past. Focus on integration, not reinvention.
  `,
  },

  {
    format: "empathy challenge",
    tone: "firm, eye-opening, practical",
    theme: "emotional insight",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a man who wants to reconnect with his ex**.

  ### Topic: Stop Guessing What She Feels — Start Understanding What You Missed

  ### Requirements:
  - 450–750 words
  - Shift focus from “what is she thinking?” to “what did I not fully see before?”
  - Introduce 3 blind spots men often have: emotional subtext, timing signals, quiet disappointment
  - Include a journaling exercise: *What might she have needed that I dismissed?*
  - End with a one-sentence reminder: “Empathy is attention — not imagination.”

  ⚠️ SAFETY:
  No assumptions about her emotions. Guide the reader inward.
  `,
  },

  {
    format: "apology breakdown",
    tone: "clear, strategic, mature",
    theme: "repair vs perform",
    prompt: (gender, goalStage) => `
  You are a breakup coach writing a **premium guide for a man who wants to reconnect with his ex**.

  ### Topic: Should You Apologise — or Show You've Changed?

  ### Requirements:
  - 500–800 words
  - Dissect when an apology is healing and when it’s performative
  - Teach the *ARC* model:
    - **Acknowledge** the impact
    - **Reframe** the intent
    - **Commit** visibly to change
  - Offer 3 apology “dos and don’ts”
  - End with a self-check: “Would I believe this if someone said it to me?”

  ⚠️ SAFETY:
  No grovelling. Emphasise dignity and clarity.
  `,
  },

  {
    format: "stoic mastery",
    tone: "strong, centered, introspective",
    theme: "emotional control",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a man who wants to reconnect with his ex**.

  ### Topic: The Power of Stillness: Why Not Reacting Is Sometimes the Most Powerful Move

  ### Requirements:
  - 600–900 words
  - Explore how masculine composure creates space for reconnection
  - Include 3 case sketches: texting too soon, emotional overreaction, pushing a call
  - Teach the concept of *Stillness as Strength* (presence without pressure)
  - End with a practical 48-hour self-hold technique before any outreach

  ⚠️ SAFETY:
  Avoid emotion suppression. Distinguish composure from avoidance.
  `,
  },

  {
    format: "de-romanticisation",
    tone: "respectful, grounded, humanising",
    theme: "letting go of control",
    prompt: (gender, goalStage) => `
  You are a breakup coach writing a **premium guide for a man who wants to reconnect with his ex**.

  ### Topic: She’s Not a Puzzle — She’s a Person

  ### Requirements:
  - 500–750 words
  - Dismantle the fantasy mindset of “figuring her out”
  - Encourage emotional maturity: curiosity over control
  - Include a visual metaphor (e.g. chessboard vs open field)
  - End with 3 questions to ask *yourself*, not her

  ⚠️ SAFETY:
  Challenge objectification or mental games. Bring the reader back to real connection.
  `,
  },
  // 21 - 30
  {
    format: "behavioural reframe",
    tone: "pragmatic, confident, motivating",
    theme: "attraction revival",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a man who wants to reconnect with his ex**.

  ### Topic: Rebuilding Attraction Without Begging

  ### Requirements:
  - 500–800 words
  - Teach how authentic confidence and purpose-driven change can reignite attraction
  - Explain the danger of over-contact, emotional neediness, and subtle manipulation
  - Offer 4 ways to become attractive again without chasing
  - Include a “magnetic identity audit”: 3 traits she was once drawn to vs what changed

  ⚠️ SAFETY:
  No tricks or pickup tactics. Focus on emotional integrity and grounded masculinity.
  `,
  },

  {
    format: "resilience coaching",
    tone: "realistic, grounded, strong",
    theme: "emotional setbacks",
    prompt: (gender, goalStage) => `
  You are a breakup coach writing a **premium guide for a man who wants to reconnect with his ex**.

  ### Topic: What If She’s Already With Someone Else?

  ### Requirements:
  - 600–900 words
  - Guide the reader through the emotional punch of seeing her move on
  - Distinguish between rebound vs real connection
  - Share a story of someone who reconnected even after she dated someone new — but only after emotional growth
  - End with a stoic journal prompt: “If this isn’t the ending I wanted, what’s the lesson I’m meant to own?”

  ⚠️ SAFETY:
  Avoid false hope. Prioritise self-respect in all scenarios.
  `,
  },

  {
    format: "challenge guide",
    tone: "strategic, clear, masculine",
    theme: "self-reinvention",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a man who wants to reconnect with his ex**.

  ### Topic: The 30-Day Challenge: Become Someone She’d Respect Again

  ### Requirements:
  - 700–1000 words
  - Provide a structured 30-day challenge:
    - Week 1: Self-awareness reset
    - Week 2: Physical & emotional discipline
    - Week 3: Legacy and long-term vision
    - Week 4: Reflection + reconnection readiness
  - Include 3 “no-contact” traps to avoid during this phase

  ⚠️ SAFETY:
  This is not about manipulation. Reinforce self-led growth.
  `,
  },

  {
    format: "emotional containment",
    tone: "direct, confronting, supportive",
    theme: "emotional boundaries",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a man who wants to reconnect with his ex**.

  ### Topic: She’s Not Your Therapist — Stop Bleeding on Her

  ### Requirements:
  - 500–700 words
  - Teach the reader to stop using his ex for emotional regulation
  - Explain the *Bleed & Burn* cycle: oversharing → discomfort → distance
  - Offer alternative outlets: brotherhood, journaling, breath work
  - End with a ritual: *Write her a message, don’t send it, then reflect on what part of you needed that moment*

  ⚠️ SAFETY:
  Do not shame vulnerability. Empower emotional ownership.
  `,
  },

  {
    format: "transformation log",
    tone: "structured, inspiring, practical",
    theme: "earned reconnection",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a man who wants to reconnect with his ex**.

  ### Topic: Don’t Just Say “I’ve Changed” — Show How You Did It

  ### Requirements:
  - 600–850 words
  - Teach the difference between performative change vs embodied growth
  - Introduce the *CHANGE* framework:
    - **C**hoice
    - **H**abit
    - **A**ction
    - **N**ew results
    - **G**rit
    - **E**vidence
  - Share a real-world micro-case where visible change reopened the door
  - End with a visual metaphor: “You don’t mail her a résumé. You *live* your proof.”

  ⚠️ SAFETY:
  Never position change as a manipulation strategy. It must serve the man first.
  `,
  },

  {
    format: "mindset reset",
    tone: "stoic, reassuring, strategic",
    theme: "no contact",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a man who wants to reconnect with his ex**.

  ### Topic: Silence Isn’t Weakness — It’s Recovery

  ### Requirements:
  - 600–800 words
  - Reframe “no contact” as a phase of rebuilding, not passivity
  - Explore how time away builds perspective, value, and emotional control
  - Include a mental model: **Silence = Strategic Recovery**
  - Offer 4 mindset shifts to embrace distance without spiralling
  - End with: “Silence isn’t doing nothing — it’s preparing for everything.”

  ⚠️ SAFETY:
  Avoid game-playing language. Promote genuine emotional reset.
  `,
  },

  {
    format: "emotional blueprint",
    tone: "deep, confronting, insightful",
    theme: "emotional suppression",
    prompt: (gender, goalStage) => `
  You are a breakup coach writing a **premium guide for a man who wants to reconnect with his ex**.

  ### Topic: The Masculine Trap: Solving Her Instead of Feeling You

  ### Requirements:
  - 550–850 words
  - Reveal how men often try to fix, diagnose, or analyse their ex — while avoiding their own emotions
  - Include a 2-column table: *Fixing Her* vs *Facing Self*
  - Offer a guided process: 1. Pause the fix. 2. Feel the ache. 3. Honour your part.
  - End with a quote: “A man who feels fully — leads powerfully.”

  ⚠️ SAFETY:
  Do not shame stoicism. Offer emotional depth as strength.
  `,
  },

  {
    format: "identity reframe",
    tone: "bold, redemptive, masculine",
    theme: "self-worth renewal",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a man who wants to reconnect with his ex**.

  ### Topic: You’re Not Her Past Mistake — Unless You Stay That Way

  ### Requirements:
  - 500–700 words
  - Help the reader step out of shame, regret, or past labels
  - Introduce the idea of a “second impression” through sustained action
  - Include a case study: a man who was remembered for how he returned, not how he left
  - End with a mantra: “Let who you are today speak louder than who you were then.”

  ⚠️ SAFETY:
  Avoid the saviour narrative. Frame growth as internal first.
  `,
  },

  {
    format: "field guide",
    tone: "precise, level-headed, masculine",
    theme: "contact strategy",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a man who wants to reconnect with his ex**.

  ### Topic: The Moment You Reach Out: Dos and Don’ts

  ### Requirements:
  - 600–900 words
  - Provide a checklist of dos and don’ts before hitting send
  - Include 2 types of messages to avoid — and why they backfire
  - Offer a structured contact example that is grounded, respectful, and non-pressuring
  - End with: “Clarity over cleverness. Respect over reaction.”

  ⚠️ SAFETY:
  Do not promise success after messaging. Emphasise self-regulation.
  `,
  },

  {
    format: "insight decoding",
    tone: "intuitive, observational, grounded",
    theme: "relationship awareness",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a man who wants to reconnect with his ex**.

  ### Topic: What She’ll Look For (Even If She Doesn’t Say It)

  ### Requirements:
  - 650–850 words
  - Decode subtle signals your ex might assess: consistency, emotional tone, life direction
  - Explain why women test for emotional safety and self-respect — not perfection
  - Include a visual metaphor: “You’re not being quizzed — you’re being felt.”
  - Offer a short readiness audit: 5 yes/no questions before re-approach

  ⚠️ SAFETY:
  Avoid the “alpha male” lens. Honour subtle emotional intelligence.
  `,
  },
  // 31 - 40
  {
    format: "realistic recovery",
    tone: "steady, composed, strategic",
    theme: "handling rejection",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a man who wants to reconnect with his ex**.

  ### Topic: From Ghosted to Grounded: What to Do When She Stops Replying

  ### Requirements:
  - 500–800 words
  - Teach men how to respond with dignity when communication suddenly stops
  - Explore common emotional traps: anxiety spirals, over-texting, rumination
  - Offer a grounded 3-step plan:
    1. Stabilise emotionally
    2. Reframe the silence
    3. Rechannel your focus
  - End with a journaling prompt: “What would staying grounded look like right now?”

  ⚠️ SAFETY:
  No blame. No “win her back” manipulation. Support emotional regulation first.
  `,
  },

  {
    format: "motivation audit",
    tone: "deep, thoughtful, reality-based",
    theme: "desire vs memory",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a man who wants to reconnect with his ex**.

  ### Topic: Do You Know What You Want *Now* — or What You Missed *Then*?

  ### Requirements:
  - 600–850 words
  - Help the reader separate genuine present desire from nostalgic distortion
  - Include a 2-part inventory:
    - *What I miss about her*
    - *What I miss about who I was with her*
  - Offer a reflective writing exercise to distinguish real longing from ego injury
  - End with: “Don’t chase the memory — meet the moment.”

  ⚠️ SAFETY:
  No idealising the ex. Build awareness before re-approach.
  `,
  },

  {
    format: "masculine mastery",
    tone: "grounded, empowering, modern",
    theme: "emotional control",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a man who wants to reconnect with his ex**.

  ### Topic: Calm Is the New Power

  ### Requirements:
  - 500–750 words
  - Teach men how composure and presence are more magnetic than intensity
  - Include a story of a man who got his ex’s attention again by becoming emotionally steady
  - Offer a 4-step “calm cultivation routine” (morning to night)
  - End with: “She may remember your words — but she’ll feel your calm.”

  ⚠️ SAFETY:
  Avoid hyper-masculine bravado. Ground the reader in inner work.
  `,
  },

  {
    format: "readiness checklist",
    tone: "straightforward, wise, non-judgmental",
    theme: "emotional maturity",
    prompt: (gender, goalStage) => `
  You are a breakup coach writing a **premium guide for a man who wants to reconnect with his ex**.

  ### Topic: The 7 Signals You’re Not Ready to Reconnect (Yet)

  ### Requirements:
  - 600–900 words
  - Offer 7 emotional or behavioural signs that show a man isn’t emotionally equipped yet
  - For each: describe what it looks like and why it matters
  - Include gentle reframes: “This isn’t a failure — it’s a signal.”
  - End with an actionable prompt: “Which of these 7 is your priority to work on?”

  ⚠️ SAFETY:
  Avoid toxic shame. Present unreadiness as an opportunity to grow.
  `,
  },

  {
    format: "emotional depth",
    tone: "philosophical, grounded, freeing",
    theme: "letting go of guarantees",
    prompt: (gender, goalStage) => `
  You are a breakup coach writing a **premium guide for a man who wants to reconnect with his ex**.

  ### Topic: You Don’t Need Closure to Be Complete

  ### Requirements:
  - 550–800 words
  - Challenge the reader’s need for a final conversation, explanation, or validation
  - Explore the myth of “perfect closure” in male psychology
  - Share a story of someone who never got the talk — but found peace
  - End with a sentence stem: “What I now understand, without her saying it, is…”

  ⚠️ SAFETY:
  Avoid bypassing pain. Honour grief while offering emotional autonomy.
  `,
  },

  {
    format: "inner work call-out",
    tone: "direct, introspective, grounding",
    theme: "emotional avoidance",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a man who wants to reconnect with his ex**.

  ### Topic: Are You Rebuilding... or Just Distracting Yourself?

  ### Requirements:
  - 600–900 words
  - Explore how men often confuse self-improvement with avoidance (e.g. gym, work, women)
  - Offer 3 clear signs of true inner work vs escapism
  - Include a personal growth audit
  - End with the mantra: “Build with your pain — not around it.”

  ⚠️ SAFETY:
  Encourage honest self-checking without shaming productivity or coping tools.
  `,
  },

  {
    format: "communication myth-busting",
    tone: "realistic, calm, slightly humorous",
    theme: "contact anxiety",
    prompt: (gender, goalStage) => `
  You are a breakup coach writing a **premium guide for a man who wants to reconnect with his ex**.

  ### Topic: The Myth of the Perfect Text

  ### Requirements:
  - 500–750 words
  - Challenge the obsessive hunt for “the right message”
  - Explain why no single sentence will undo emotional damage
  - Offer a 3-part model for real communication:
    1. **Emotional alignment**
    2. **Respectful tone**
    3. **Low-pressure content**
  - Include examples of healthy first contacts
  - End with: “The words matter less than the energy behind them.”

  ⚠️ SAFETY:
  Avoid scripts. This isn’t game-playing. Encourage authenticity.
  `,
  },

  {
    format: "identity evolution",
    tone: "transformative, self-validating, slightly bold",
    theme: "authentic change",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a man who wants to reconnect with his ex**.

  ### Topic: Would She Even Recognise You Now?

  ### Requirements:
  - 600–850 words
  - Challenge the reader to reflect on how much he’s really changed — internally
  - Offer a self-audit with 5 checkpoints: identity, behaviour, triggers, mission, mindset
  - Include a metaphor (e.g. “You’re not returning — you’re reintroducing.”)
  - End with: “Don’t rehearse your pitch — embody your evolution.”

  ⚠️ SAFETY:
  Change must be real. No fake growth for strategic gain.
  `,
  },

  {
    format: "craving interruptor",
    tone: "calm, stabilising, hands-on",
    theme: "impulse control",
    prompt: (gender, goalStage) => `
  You are a breakup coach writing a **premium guide for a man who wants to reconnect with his ex**.

  ### Topic: When You Feel the Urge to Reach Out… Do This First

  ### Requirements:
  - 500–800 words
  - Break down the neurochemical loop of craving connection
  - Teach a 4-step urge intervention:
    1. Pause and breathe
    2. Write but don’t send
    3. Move your body
    4. Re-anchor your plan
  - End with a cold-clarity checklist to help assess timing and motive

  ⚠️ SAFETY:
  Support emotional control, not suppression.
  `,
  },

  {
    format: "perspective shift",
    tone: "empathetic, masculine, relational",
    theme: "emotional intelligence",
    prompt: (gender, goalStage) => `
  You are a breakup coach writing a **premium guide for a man who wants to reconnect with his ex**.

  ### Topic: Don’t Try to Impress Her — Try to *Understand* Her

  ### Requirements:
  - 600–950 words
  - Teach men how empathy is more magnetic than status or posturing
  - Include a 3-part breakdown of:
    1. What she might’ve felt during the breakup
    2. What emotional safety looks like to her
    3. What makes her feel seen and heard
  - End with: “Women remember how you made them feel — not what you posted.”

  ⚠️ SAFETY:
  Do not reduce women to puzzles or reward systems. Prioritise empathy over strategy.
  `,
  },
  // 41 - 50
  {
    format: "reverse lens",
    tone: "revealing, honest, emotionally intelligent",
    theme: "empathy and hindsight",
    prompt: (gender, goalStage) => `
  You are a breakup coach writing a **premium guide for a man who wants to reconnect with his ex**.

  ### Topic: Why She Pulled Away — And What You Missed

  ### Requirements:
  - 600–900 words
  - Walk through 4 common silent signals women give before emotionally detaching
  - Explain how male avoidance, distraction, or indifference often masks her warning signs
  - Include a case study where the reader recognises his blind spot
  - End with a journaling exercise titled: “What was she trying to tell me without words?”

  ⚠️ SAFETY:
  Do not foster guilt. Foster deeper emotional listening and responsibility.
  `,
  },

  {
    format: "masculine recalibration",
    tone: "grounded, motivating, no-nonsense",
    theme: "entitlement detox",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a man who wants to reconnect with his ex**.

  ### Topic: Reconnection Is *Earned* — Not Asked For

  ### Requirements:
  - 500–800 words
  - Confront the idea that “saying the right thing” leads to getting her back
  - Emphasise behavioural evidence, not persuasive tactics
  - Offer a table of “Actions That Speak” — e.g. consistent behaviour, emotional regulation, honouring boundaries
  - End with: “She needs to feel safer with you than she did before. That’s not a sentence — that’s a standard.”

  ⚠️ SAFETY:
  No manipulation. No tactics. Focus on inner alignment.
  `,
  },

  {
    format: "psychological reframing",
    tone: "direct, respectful, clarity-inducing",
    theme: "emotional leadership",
    prompt: (gender, goalStage) => `
  You are a breakup coach writing a **premium guide for a man who wants to reconnect with his ex**.

  ### Topic: The Real Reason Begging Never Works

  ### Requirements:
  - 500–750 words
  - Explain how emotional pressure violates safety and triggers resistance
  - Use a metaphor (e.g. “emotional gravity vs emotional push”)
  - Include an emotional posture reframe:
    1. From need → clarity  
    2. From pleading → presence  
    3. From desperation → direction
  - End with: “You don’t chase peace. You become it.”

  ⚠️ SAFETY:
  Do not shame the reader for past mistakes — reframe them into insight.
  `,
  },

  {
    format: "reconnection audit",
    tone: "mature, practical, emotionally intelligent",
    theme: "perceived pressure",
    prompt: (gender, goalStage) => `
  You are a breakup coach writing a **premium guide for a man who wants to reconnect with his ex**.

  ### Topic: Are You Making Her Feel Safe — or Cornered?

  ### Requirements:
  - 650–950 words
  - Explain the nervous system’s response to emotional pressure (fight/flight/freeze)
  - Teach men how subtle tone, timing, and frequency can overwhelm even kind intentions
  - Include 3 high-safety reconnection behaviours and 3 low-safety ones
  - End with a recalibration checklist to review before each contact attempt

  ⚠️ SAFETY:
  Focus on her emotional autonomy. Emphasise calm pacing, not pushiness.
  `,
  },

  {
    format: "emotional detox",
    tone: "candid, cathartic, steadying",
    theme: "hidden resentment",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a man who wants to reconnect with his ex**.

  ### Topic: You Can’t Reconnect While Resenting Her

  ### Requirements:
  - 600–850 words
  - Explore subtle forms of resentment men may carry (e.g. blame, feeling abandoned, “after all I did”)
  - Include a resentment detox writing ritual
  - Share a short case study where a man ruined reconnection by holding hidden anger
  - End with: “You can either resent her — or reconnect. Not both.”

  ⚠️ SAFETY:
  Encourage emotional ownership without suppressing legitimate hurt.
  `,
  },

  {
    format: "masculine identity",
    tone: "grounded, empowering, self-respecting",
    theme: "internal leadership",
    prompt: (gender, goalStage) => `
  You are a breakup coach writing a **premium guide for a man who wants to reconnect with his ex**.

  ### Topic: Stop Guessing What She Wants — Start Becoming What You Respect

  ### Requirements:
  - 500–800 words
  - Shift focus from decoding her feelings to building his own centre
  - Include a role-model audit: “What type of man do *you* admire, even if she doesn’t come back?”
  - Include a short morning ritual for identity anchoring
  - End with: “You’re not trying to impress her. You’re remembering who you are.”

  ⚠️ SAFETY:
  Don’t promote performative masculinity — focus on self-honouring action.
  `,
  },

  {
    format: "apology reconstruction",
    tone: "respectful, clear, vulnerable",
    theme: "repair and regret",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a man who wants to reconnect with his ex**.

  ### Topic: The Apology She’ll Actually Hear

  ### Requirements:
  - 600–900 words
  - Teach the anatomy of a real apology (acknowledge impact, name behaviour, no justification)
  - Include a “Checklist of Death” — what makes apologies backfire
  - Share a case study of a man who owned his past with dignity, not desperation
  - End with a structured template the reader can adapt privately

  ⚠️ SAFETY:
  Never suggest using apologies to manipulate. The goal is emotional repair, not outcome control.
  `,
  },

  {
    format: "trust inventory",
    tone: "challenging, introspective, honest",
    theme: "emotional maturity",
    prompt: (gender, goalStage) => `
  You are a breakup coach writing a **premium guide for a man who wants to reconnect with his ex**.

  ### Topic: Do You Actually *Trust* Her — Or Just Want Her?

  ### Requirements:
  - 550–850 words
  - Examine the difference between attraction, desire, and emotional trust
  - Offer a Trust Audit with 5 questions about past patterns, consistency, and respect
  - Share a story of someone who realised desire masked a deep mistrust
  - End with: “Wanting her is easy. Trusting her is rare. Start with the truth.”

  ⚠️ SAFETY:
  Do not frame women as deceptive. Focus on the reader’s own clarity and standards.
  `,
  },

  {
    format: "inner child work",
    tone: "compassionate, steady, affirming",
    theme: "emotional reparenting",
    prompt: (gender, goalStage) => `
  You are a breakup coach writing a **premium guide for a man who wants to reconnect with his ex**.

  ### Topic: How to Reconnect Without Feeling Like a Little Boy Again

  ### Requirements:
  - 600–1000 words
  - Explore how unhealed emotional wounds make men regress in conflict or rejection
  - Teach the difference between showing emotion vs collapsing into emotional need
  - Include a 3-part “Strong Core” self-talk strategy
  - End with a grounding practice to restore adult presence in emotional moments

  ⚠️ SAFETY:
  Use compassion, not shame. Normalise vulnerability while supporting masculine strength.
  `,
  },

  {
    format: "strategic roadmap",
    tone: "clear, sober, grounded",
    theme: "real-world reconnection",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a man who wants to reconnect with his ex**.

  ### Topic: The Reconnection Plan — Built for Reality, Not Fantasy

  ### Requirements:
  - 650–950 words
  - Lay out a 3-phase reconnection path: *Inner Grounding → Casual Recontact → Emotional Depth*
  - For each, define clear signals of readiness — both in himself and in her
  - Include sample boundary-respecting messages for first contact
  - End with: “This isn’t a trick to get her back. It’s a path to walk — with or without her.”

  ⚠️ SAFETY:
  No game-playing. No text templates that bypass emotional honesty. All steps must feel grounded.
  `,
  },
];
