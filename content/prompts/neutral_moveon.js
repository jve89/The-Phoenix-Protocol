module.exports = [
// 1 - 10
  {
    format: "emotional release",
    tone: "gentle, honest, emotionally mature",
    theme: "grieving with clarity and self-compassion",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium daily guide for a user who wants to move on from their ex**.

  ### Title: Letting Go Is the Bravest Kind of Love

  ### Requirements:
  - 600–700 words
  - Reframe letting go as an act of *mutual mercy* — the release of future pain, not rejection of the past
  - Include a story of someone who created a personal goodbye ceremony that became a turning point
  - Offer 2 types of goodbye rituals (e.g., “The Letter You Don’t Send” and “The Last Anchor Walk”)
  - Include a paragraph about why holding on often feels safer than healing
  - End with: “Letting go is a soft rebellion — against pain, against delay, against the illusion that staying still is the same as staying close. This is the start of you.”

  ⚠️ SAFETY:
  Do not rush detachment. Honour the grip before loosening it.
  `
  },

  {
    format: "identity rebuild",
    tone: "empowering, clear, supportive",
    theme: "self-definition",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: Who Are You Without Them?

  ### Requirements:
  - 600–800 words
  - Explore identity loss after breakup and how roles dissolve
  - Introduce a concept called “The Echo Self” — the version of you that only existed around them
  - Share how someone disentangled from their Echo Self to rediscover personal identity
  - Provide a framework called “The 3 R’s” — Remember, Reclaim, Reinvent
  - End with: “You were never lost — just layered.”

  ⚠️ SAFETY:
  Avoid framing the relationship as a mistake. Honour what was, but redirect the focus to the unfolding self.
  `
  },

  {
    format: "closure without answers",
    tone: "accepting, emotionally intelligent, resilient",
    theme: "peace with ambiguity",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: You Might Never Know Why — and That’s Okay

  ### Requirements:
  - 600–800 words
  - Address the universal urge to find closure through explanation
  - Introduce a metaphor: “The Locked Door” — sometimes the answers are behind a door we can’t open
  - Include the story of someone who created peace by shifting the question from “Why did they?” to “What do I need now?”
  - Offer a journaling prompt titled “Meaning Without Answers”
  - End with: “Healing begins when you stop knocking.”

  ⚠️ SAFETY:
  Do not dismiss the reader’s search for clarity. Acknowledge the emotional difficulty of ambiguity and guide them gently toward internal resolution.
  `
  },

  {
    format: "daily routine",
    tone: "practical, nurturing, grounded",
    theme: "stability through structure",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: Healing Happens Between Habits

  ### Requirements:
  - 600–850 words
  - Explain how routines anchor identity during emotional chaos
  - Share a sample “emotional recovery day” — from wake-up to wind-down — with rituals for grounding, energy, self-connection, and sleep
  - Include a printable checklist called “The Daily Reset”
  - Offer a mindset shift: routines aren’t restrictive — they’re restorative
  - End with: “Structure isn’t confinement. It’s how you hold yourself together.”

  ⚠️ SAFETY:
  Avoid glorifying productivity or forcing performance. Honour small wins and emotional pacing.
  `
  },

  {
    format: "social reentry",
    tone: "warm, encouraging, grounded",
    theme: "connection after isolation",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: You’re Allowed to Be Seen Again

  ### Requirements:
  - 600–850 words
  - Explore the emotional weight of being visible again after heartbreak (e.g., shame, comparison, fear of judgement)
  - Share a short story of someone who gently returned to social spaces at their own pace
  - Include a “reentry roadmap” with 5 tiers of exposure (digital presence, solo events, group invites, etc.)
  - Offer 3 affirmations to counter self-consciousness and social fear
  - End with: “You don’t have to sparkle. You just need to show up.”

  ⚠️ SAFETY:
  Avoid glamorising distraction or suggesting social approval is the goal. Emphasise authenticity, comfort, and small steps.
  `
  },

  {
    format: "emotional triggers",
    tone: "clear, calm, compassionate",
    theme: "handling reminders",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: When Everything Reminds You of Them

  ### Requirements:
  - 600–850 words
  - Explain the neuroscience behind emotional triggers (e.g., associative memory, emotional conditioning)
  - Include a short story of someone reclaiming a space or object that held emotional weight
  - Offer 3 methods to soften or rewire painful associations (e.g., “reclaim the object,” create new meaning, neutralise with repetition)
  - Provide a “trigger first-aid kit” with grounding phrases, sensory resets, and boundary suggestions
  - End with: “It’s a memory — not a mandate.”

  ⚠️ SAFETY:
  Do not pressure the reader to erase or avoid memories. Emphasise choice, permission, and emotional self-trust.
  `
  },

  {
    format: "self-worth reset",
    tone: "empowering, direct, uplifting",
    theme: "personal value",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: You Are Not Someone’s Rejection

  ### Requirements:
  - 600–850 words
  - Reframe rejection as redirection toward alignment
  - Introduce the metaphor of a puzzle piece or radio frequency to explain emotional compatibility
  - Share a story of someone who internalised rejection and then reframed it through growth
  - Provide a 3-step “inner validation ritual” involving self-affirmation, memory check, and compassionate re-narration
  - End with: “You were not too much — you were just not aligned.”

  ⚠️ SAFETY:
  Avoid pathologising attachment. Validate the hurt without reinforcing shame.
  `
  },

  {
    format: "forgiveness",
    tone: "honest, mature, peaceful",
    theme: "releasing resentment",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: Forgiveness Is About You — Not Them

  ### Requirements:
  - 600–850 words
  - Redefine forgiveness as emotional disentanglement, not condoning or forgetting
  - Walk through a personal anecdote of someone who let go of resentment without reconciliation
  - Present a “release ritual” with 3 optional tools: unsent letter, symbolic gesture (e.g., stone in water), and voice note to self
  - Include a short myth-busting section about forgiveness (“It’s not a shortcut to healing”, “It doesn’t mean they’re right”)
  - End with: “You free yourself when you stop holding the rope.”

  ⚠️ SAFETY:
  Do not romanticise premature forgiveness. Honour grief and protect self-trust first.
  `
  },

  {
    format: "dating readiness",
    tone: "playful, cautious, empowering",
    theme: "moving on romantically",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: Are You Actually Ready to Date?

  ### Requirements:
  - 600–850 words
  - Introduce a playful but revealing self-check quiz (e.g., “Swipe or Wait?” with 6 yes/no questions)
  - Share a story of someone who jumped into dating too early and paused after realising they were emotionally outsourcing
  - Provide a “green flags” checklist for genuine readiness (emotional stability, clarity, non-comparative thinking, etc.)
  - Include a compassionate note on why craving connection doesn’t always mean you’re ready to build one
  - End with: “Flirting isn’t healing — unless it comes from wholeness.”

  ⚠️ SAFETY:
  Do not shame attraction, sexuality, or loneliness. Offer dating as a choice, not a benchmark.
  `
  },

  {
    format: "future visioning",
    tone: "hopeful, inspiring, realistic",
    theme: "life beyond this",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: The Future Isn’t a Blank Page — It’s a Map You Get to Draw

  ### Requirements:
  - 600–900 words
  - Start with a metaphor (e.g., foggy road becoming visible with each step forward)
  - Validate the fear of uncertainty without romanticising it
  - Offer a visualisation exercise: “Imagine one ordinary, good day six months from now”
  - List 5–7 core values (e.g., peace, curiosity, connection) and help the reader design a future aligned with them
  - Include a short journaling prompt: “What does the *next chapter* of your life feel like, sound like, look like?”
  - End with: “Let the past be one chapter — not the whole book.”

  ⚠️ SAFETY:
  Avoid forced optimism. Make hope actionable. Honour emotional setbacks as part of growth.
  `
  },
// 11 - 20
  {
    format: "mental pattern disruption",
    tone: "compassionate, sharp, reflective",
    theme: "repetitive thinking",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: You’re Not Crazy — It’s a Loop

  ### Requirements:
  - 600–800 words
  - Explain how breakup rumination hijacks the brain (mention emotional OCD tendencies lightly and accessibly)
  - Include a loop-breaker technique (e.g., “name–reframe–redirect” method)
  - Offer a simple 5-minute grounding exercise to stop spiralling thoughts
  - Reassure the reader that looping is common, not weakness
  - End with: “You don’t have to solve the past to survive the present.”

  ⚠️ SAFETY:
  Do not use clinical terms without context. Avoid blame or pressure to “just stop thinking.”
  `
  },

  {
    format: "life re-alignment",
    tone: "practical, strong, validating",
    theme: "reclaiming direction",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: When Your Whole Life Was Built Around Them

  ### Requirements:
  - 550–750 words
  - Describe the identity collapse that can occur when life goals were shared with a partner
  - Help the reader untangle borrowed dreams from personal ones
  - Include a “goal realignment map” with 3 categories: Still Mine, Let Go, To Be Discovered
  - Invite reflection with: “What’s something small but real you can aim for now?”
  - End with: “You’re allowed to want again — even if it’s different now.”

  ⚠️ SAFETY:
  Avoid framing dreams as “wrong” — honour the grief of losing shared goals.
  `
  },

  {
    format: "social strategy",
    tone: "grounded, self-aware, supportive",
    theme: "healthy emotional boundaries",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: You Don’t Owe Everyone Your Pain

  ### Requirements:
  - 500–650 words
  - Talk about how some people process by talking — but not all listening is helpful
  - Offer a 3-tier support system: Inner Circle (safe), Outer Circle (neutral), Curious Crowd (non-essential)
  - Include a sample phrase like: “Thanks for asking — I’m focusing on healing quietly for now”
  - Include a personal boundary template
  - End with: “You don’t need to be understood by everyone to be supported by the right ones.”

  ⚠️ SAFETY:
  Do not shame vulnerability. Just offer structure for safer sharing.
  `
  },

  {
    format: "science-backed insight",
    tone: "curious, gentle, empowering",
    theme: "neurochemical grief",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: Missing Them Isn’t a Sign — It’s a Chemical Echo

  ### Requirements:
  - 600–850 words
  - Explain how oxytocin, dopamine, and habit loops affect longing
  - Use the metaphor of “phantom limb syndrome” for emotional habits
  - Reassure reader that missing someone doesn’t mean you should be with them
  - Offer a grounding affirmation set to soothe the nervous system
  - End with: “Missing is just a sign you loved — not a command to return.”

  ⚠️ SAFETY:
  Avoid over-medicalisation. Make science empowering, not dismissive.
  `
  },

  {
    format: "emergency emotional first-aid",
    tone: "calm, grounded, firm",
    theme: "emotional safety",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: If You’re Crying on the Bathroom Floor, Read This

  ### Requirements:
  - 450–650 words
  - Offer a step-by-step “emotional first-aid” guide (e.g., 1. Touch something cold, 2. Count your breaths, 3. Say one safe truth)
  - Remind them that this is a moment, not forever
  - Include a single-sentence mantra: “You are not broken — you are breaking open”
  - End with: “Even in pain, you are still moving forward.”

  ⚠️ SAFETY:
  No spiritual bypassing. Ground the reader in *physical* and *emotional* presence.
  `
  },

  {
    format: "reframing regret",
    tone: "reflective, honest, warm",
    theme: "rumination and imagined outcomes",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: The “What Ifs” Will Eat You — Unless You Feed Them Something Better

  ### Requirements:
  - 600–850 words
  - Discuss common loops: “What if I’d said this?”, “What if I’d stayed?”, etc.
  - Offer a journaling reframe tool called “The Fork in the Path” — exploring both realities and anchoring back to the present
  - Include a client story of someone trapped in what-ifs who reclaimed the present
  - End with: “You deserve peace more than you deserve perfect answers.”

  ⚠️ SAFETY:
  Don’t shame overthinking — treat it as a grief mechanism, not a flaw.
  `
  },

  {
    format: "digital detox coaching",
    tone: "clear, respectful, encouraging",
    theme: "online boundaries",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: No, You Don’t Need to Check Their Profile Again

  ### Requirements:
  - 500–700 words
  - Explore the dopamine hit of checking their activity
  - Include a “delay–distract–delete” protocol for regaining control
  - Offer a success story of someone who went cold turkey for 30 days
  - End with: “Freedom sometimes begins with the app you didn’t open.”

  ⚠️ SAFETY:
  Avoid guilt-tripping. Treat social relapse as a pattern, not a failure.
  `
  },

  {
    format: "self-concept healing",
    tone: "empowering, kind, direct",
    theme: "worthiness and self-talk",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: You Were Not Too Much — You Were Just With Too Little

  ### Requirements:
  - 550–750 words
  - Unpack the idea of feeling “hard to love” after heartbreak
  - Include a metaphor: “emotional resonance” — some frequencies just don’t match
  - Include a mirror script for rebuilding self-perception
  - End with: “Your intensity isn’t a flaw — it’s a filter.”

  ⚠️ SAFETY:
  Avoid bashing the ex. Focus on personal resonance, not blame.
  `
  },

  {
    format: "emotional navigation",
    tone: "grounded, gentle, emotionally intelligent",
    theme: "mixed feelings and uncertainty",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: Missing Them and Moving On Can Happen at the Same Time

  ### Requirements:
  - 500–700 words
  - Explain emotional duality (missing + moving forward aren’t opposites)
  - Include a “Both/And Map” — a journaling tool for emotional contradictions
  - Share a short example of someone who held both feelings and still healed
  - End with: “Conflicting emotions don’t mean you’re stuck — they mean you’re human.”

  ⚠️ SAFETY:
  Don’t pathologise ambivalence. Make it normal, even necessary.
  `
  },

  {
    format: "narrative repair",
    tone: "reflective, structured, calm",
    theme: "storytelling for closure",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: Retell the Story — But With You at the Center

  ### Requirements:
  - 600–850 words
  - Discuss how people become side characters in their own breakup narrative
  - Offer a 3-part structure: Before, During, After — focused on personal agency
  - Include a reflective writing prompt for each phase
  - End with: “This was never just their story — it’s your origin chapter too.”

  ⚠️ SAFETY:
  Avoid toxic rewriting (“everything happens for a reason”). Honour the truth while reclaiming voice.
  `
  },
// 21 - 30
  {
    format: "normalising plateaus",
    tone: "calm, validating, steady",
    theme: "invisible progress",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: If You Don’t Feel Better Yet, That Doesn’t Mean You’re Broken

  ### Requirements:
  - 500–750 words
  - Explain why progress can feel invisible (plateaus, rewiring, emotional cycles)
  - Include a metaphor: healing as tectonic shifts — slow, deep, powerful
  - Offer a timeline audit exercise to notice subtle gains
  - End with: “Stillness is not the same as being stuck.”

  ⚠️ SAFETY:
  Avoid implying delay is failure. Validate flat emotional states as normal.
  `
  },

  {
    format: "post-breakup identity",
    tone: "inspiring, empowering, focused",
    theme: "new standards for a new self",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: Redefine What “Success” Means for You Now

  ### Requirements:
  - 600–800 words
  - Unpack inherited definitions of success (relationship status, timelines)
  - Offer a “values clarity” worksheet to set post-breakup intentions
  - Include a short reflection from someone who shifted their vision
  - End with: “Healing isn’t about milestones — it’s about alignment.”

  ⚠️ SAFETY:
  Do not pit personal growth against traditional desires. Respect all paths.
  `
  },

  {
    format: "emotional authenticity",
    tone: "honest, kind, non-judgmental",
    theme: "performing okayness",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: You Don’t Have to Pretend You’re Fine

  ### Requirements:
  - 450–650 words
  - Talk about the pressure to perform healing on social media or among friends
  - Include a short self-checklist: “Am I masking pain or expressing healing?”
  - Suggest micro-practices for authenticity in low-risk spaces
  - End with: “Let yourself be real — you’re not here to impress anyone.”

  ⚠️ SAFETY:
  Avoid glorifying emotional exposure. Honour pacing and privacy.
  `
  },

  {
    format: "impulse awareness",
    tone: "gentle, clear, non-punitive",
    theme: "urge to reach out",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: Wanting to Reach Out Doesn’t Mean You Should

  ### Requirements:
  - 500–700 words
  - Explain the psychology of contact cravings (unfinished cycles, nervous system memory)
  - Offer a “Pause–Process–Plan” tool for emotional impulses
  - Include a short story of someone who held back and grew stronger
  - End with: “Silence can be self-respect.”

  ⚠️ SAFETY:
  Avoid framing contact as weak. Emphasise agency over impulse.
  `
  },

  {
    format: "practical mental health support",
    tone: "professional, clear, supportive",
    theme: "external help",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: Not All Therapy Is the Same — Here’s What Can Help Most

  ### Requirements:
  - 600–900 words
  - Introduce 3 therapy styles particularly helpful after breakup (e.g., CBT, IFS, somatic)
  - Share example sessions and what each one targets
  - Provide tips for finding the right therapist (online or local)
  - End with: “You don’t have to do this alone — and you shouldn’t.”

  ⚠️ SAFETY:
  Do not sell therapy as a fix-all. Validate solo healing too.
  `
  },

  {
    format: "physical-symbol reset",
    tone: "reflective, calm, gently motivating",
    theme: "clearing space",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: It’s Time to Clear the Drawer

  ### Requirements:
  - 500–700 words
  - Talk about the emotional imprint of physical objects (gifts, notes, clothes)
  - Provide a 3-step process: reflect, choose, transform (e.g., box, burn, donate)
  - Include a micro-story of someone who delayed decluttering and how it finally shifted things
  - End with: “You can honour a memory — without housing it forever.”

  ⚠️ SAFETY:
  Avoid pressure to purge immediately. Emphasise emotional readiness.
  `
  },

  {
    format: "emotional logic reframe",
    tone: "warm, insightful, protective",
    theme: "navigating emotional confusion",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: When You Miss Them, Ask What You’re Actually Missing

  ### Requirements:
  - 500–750 words
  - Help the reader distinguish between missing the person vs. the feeling of closeness
  - Provide a “Name the Need” worksheet (e.g., connection, safety, identity)
  - Include examples of substitute rituals (calls, journaling, walks)
  - End with: “You’re not wrong to miss love — but you don’t need to chase the past to feel it.”

  ⚠️ SAFETY:
  Do not shame longing. Validate complexity while guarding forward motion.
  `
  },

  {
    format: "digital detox",
    tone: "clear, firm, compassionate",
    theme: "social triggers",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: Your Feed Is Not a Healing Space

  ### Requirements:
  - 500–700 words
  - Explain how social platforms re-trigger memory loops and create comparison traps
  - Offer a 7-day “scroll pause” challenge with reflection questions
  - Include one case study of someone who healed faster after disconnecting
  - End with: “Silence online creates space for clarity inside.”

  ⚠️ SAFETY:
  Avoid demonising technology. Focus on mindful use and boundaries.
  `
  },

  {
    format: "time reframe",
    tone: "reassuring, wise, liberating",
    theme: "meaning and growth",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: That Relationship Wasn’t a Waste — It Was a Chapter

  ### Requirements:
  - 450–650 words
  - Reframe “lost years” into learned years
  - Introduce the “Experience Ledger” tool — tracking growth, skills, perspective
  - Include a reader prompt: “What did you discover about love, life, or yourself?”
  - End with: “You walked through it for a reason — even if you’re still learning what that reason is.”

  ⚠️ SAFETY:
  Avoid toxic positivity. Honour disappointment while opening space for insight.
  `
  },

  {
    format: "internal reset",
    tone: "confident, clear, self-protective",
    theme: "boundaries and silence",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: You Don’t Owe Anyone an Explanation

  ### Requirements:
  - 500–700 words
  - Talk about the pressure to explain the breakup to friends, family, or the ex
  - Offer short scripts for common situations (“Why did it end?” / “You seemed happy!”)
  - Reframe privacy as emotional sovereignty, not secrecy
  - End with: “You’re allowed to heal quietly.”

  ⚠️ SAFETY:
  Avoid encouraging total isolation. Distinguish healthy privacy from shutdown.
  `
  },
// 31 - 40
  {
    format: "thought loop reframe",
    tone: "gentle, focused, grounding",
    theme: "mental repetition",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: Stop Rewriting the Ending in Your Mind

  ### Requirements:
  - 450–650 words
  - Explain the psychological loop of imagining alternate outcomes
  - Share a technique: “reality lock” — gently affirming what actually happened
  - Provide a short journaling prompt: “What was true, even if it hurt?”
  - End with: “You’re not losing possibilities — you’re returning to truth.”

  ⚠️ SAFETY:
  Avoid harsh confrontation. Focus on clarity, not judgment.
  `
  },

  {
    format: "self-dialogue",
    tone: "intimate, calm, reassuring",
    theme: "inner voice realignment",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: What Would You Say to a Friend in Your Situation?

  ### Requirements:
  - 450–600 words
  - Guide the reader in imagining their own story from an outside perspective
  - Include a script for a mirror dialogue (spoken out loud or journaled)
  - Reframe harsh self-talk with language of support and grace
  - End with: “You deserve the kindness you give others.”

  ⚠️ SAFETY:
  Avoid clichés. Keep language grounded and emotionally accurate.
  `
  },

  {
    format: "values reflection",
    tone: "insightful, respectful, clarifying",
    theme: "learning from regret",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: Let Regret Point You Forward

  ### Requirements:
  - 500–700 words
  - Explore how regret reveals personal values (e.g. honesty, boundaries, care)
  - Introduce a 3-part journaling structure: "What I did / What I wish / What I’ll protect next time"
  - Use the metaphor of a compass: regret isn’t punishment — it’s direction
  - End with: “You’re not reliving the past — you’re learning how to honour your future.”

  ⚠️ SAFETY:
  Avoid over-analysis traps. Ground reflection in purpose, not perfection.
  `
  },

  {
    format: "evening ritual",
    tone: "soothing, slow, gentle",
    theme: "nighttime healing",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: Your Nervous System Needs a Soft Landing

  ### Requirements:
  - 450–600 words
  - Address why evenings can trigger overthinking or longing
  - Offer a calming pre-sleep routine: music, scent, breathwork, visualisation
  - Include a mantra or script to say aloud before bed
  - End with: “Rest is resistance — and repair.”

  ⚠️ SAFETY:
  Don’t pathologise insomnia. Emphasise self-compassion, not fixes.
  `
  },

  {
    format: "emotional relapse normalisation",
    tone: "reassuring, validating, anchored",
    theme: "nonlinear healing",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: Healing Isn’t a Straight Line

  ### Requirements:
  - 500–650 words
  - Normalize emotional fluctuations (e.g. sudden crying, unexpected dreams, good days followed by dips)
  - Use the metaphor of a tide: movement doesn’t mean regression
  - Include a reader note tracker template: “Today I felt / I chose / I’ll try again tomorrow”
  - End with: “You’re not back at the beginning — just moving through the wave.”

  ⚠️ SAFETY:
  Do not dismiss pain. Honour emotional spirals without fear.
  `
  },

  {
    format: "inner closure",
    tone: "gentle, therapeutic, mature",
    theme: "what you wish you could say",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: You Don’t Have to Say It to Let It Go

  ### Requirements:
  - 500–700 words
  - Address the imaginary arguments, messages, or confessions we rehearse post-breakup
  - Validate the emotional need for "finishing the sentence"
  - Offer a private writing ritual (e.g. a voice memo or unsent message)
  - End with: “Not every truth needs a witness. Sometimes, your own heart is enough.”

  ⚠️ SAFETY:
  Don’t encourage actual contact. Keep it internal, symbolic, and safe.
  `
  },

  {
    format: "environmental reset",
    tone: "practical, uplifting, symbolic",
    theme: "physical surroundings and memory",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: Make Your Space Yours Again

  ### Requirements:
  - 450–600 words
  - Explore how environments hold memory, emotion, and energy
  - Include practical suggestions: rearranging furniture, lighting candles, swapping scents
  - Introduce a small ritual for reclaiming your room or bed
  - End with: “You’re not erasing — you’re rewriting the atmosphere.”

  ⚠️ SAFETY:
  Avoid implying the reader must purge everything. Focus on subtle empowerment.
  `
  },

  {
    format: "urge interruption",
    tone: "firm, understanding, actionable",
    theme: "resisting contact impulses",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: The Text You’re About to Send

  ### Requirements:
  - 450–650 words
  - Validate the emotional build-up that creates texting urges
  - Provide a 3-minute pause exercise: name the urge, feel it, choose a redirect
  - Suggest a "Message to Self" journal where you write it — but don’t send
  - End with: “Wanting to reach out is human. Not doing so can be healing.”

  ⚠️ SAFETY:
  Avoid judgment. Honour emotional cravings while teaching redirection.
  `
  },

  {
    format: "relationship inventory",
    tone: "clear-eyed, kind, steady",
    theme: "truthful reflection",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: Name What It Was — and What It Wasn’t

  ### Requirements:
  - 500–750 words
  - Help the reader distinguish between real love, projection, and unmet needs
  - Use a two-column journaling format: “What I Felt” vs “What Was Shown”
  - Offer an optional audio reflection exercise (self-narrated)
  - End with: “It doesn’t have to be all good or all bad. It just has to be real.”

  ⚠️ SAFETY:
  Avoid retroactive blame. Encourage compassionate clarity.
  `
  },

  {
    format: "external validation detox",
    tone: "compassionate, strengthening, self-trusting",
    theme: "outsider misunderstanding",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: You Don’t Owe Anyone an Explanation

  ### Requirements:
  - 500–650 words
  - Address the sting of being judged (“Why aren't you over it?”)
  - Teach a self-validation technique: “I know my story. I trust my pace.”
  - Include a social boundary checklist: what to share, what to protect
  - End with: “Let them wonder. You’re busy rebuilding.”

  ⚠️ SAFETY:
  Avoid isolating the reader. Encourage connection with emotionally safe people.
  `
  },
// 41 - 50
  {
    format: "reframing",
    tone: "gentle, wise, uplifting",
    theme: "understanding incompatibility",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: You’re Not Broken — You Were Just the Wrong Puzzle Piece

  ### Requirements:
  - 450–600 words
  - Use the puzzle metaphor to reframe mismatch (not failure, just misfit)
  - Share an anecdote of someone who stopped trying to "shrink themselves to fit"
  - Include a visual reflection tool: “Where do you truly fit?”
  - End with: “Compatibility isn’t earned. It’s recognised.”

  ⚠️ SAFETY:
  Avoid blaming either person. Focus on peaceful understanding.
  `
  },

  {
    format: "emotional phase guide",
    tone: "honest, validating, stabilising",
    theme: "navigating anger",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: When Anger Hits — And What to Do with It

  ### Requirements:
  - 500–650 words
  - Explain anger as a phase of grief, not a character flaw
  - Offer safe outlets (rage walks, voice memos, creative expression)
  - Include an “anger translation” worksheet: What is this emotion trying to protect?
  - End with: “Anger isn’t toxic. Suppression is.”

  ⚠️ SAFETY:
  Encourage expression — not harm. Avoid promoting venting at others.
  `
  },

  {
    format: "micro-routine",
    tone: "quiet, grounding, restorative",
    theme: "early day emotion",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: The Morning After — and the Next One

  ### Requirements:
  - 450–600 words
  - Focus on the specific pain of waking up alone or remembering loss
  - Offer a morning ritual: breathwork, tea-making, sun-stepping, journaling
  - Include a mantra or intention-setting line: “Today I’ll meet myself kindly.”
  - End with: “Healing begins before the world wakes.”

  ⚠️ SAFETY:
  Avoid productivity framing. Honour emotional weight of mornings.
  `
  },

  {
    format: "cognitive distortion check",
    tone: "calm, structured, empowering",
    theme: "mind traps",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: Your Brain After a Breakup — What to Question

  ### Requirements:
  - 500–700 words
  - Explain common cognitive distortions (e.g. catastrophising, “always/never” thinking)
  - Provide a “thought audit” worksheet to challenge recurring beliefs
  - Include a reframe exercise using more balanced inner language
  - End with: “Your thoughts are loud — but not always right.”

  ⚠️ SAFETY:
  Avoid gaslighting real emotions. Clarify difference between feelings and facts.
  `
  },

  {
    format: "lost future processing",
    tone: "emotional, poetic, clear",
    theme: "expectation grief",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: Saying Goodbye to the Life You Imagined

  ### Requirements:
  - 500–750 words
  - Validate grief over imagined futures (weddings, homes, traditions)
  - Share a story of someone who honoured that grief (e.g. burning unused wedding invites)
  - Include a guided writing exercise: “The goodbye I never got to give”
  - End with: “Dreams don’t have to come true to have mattered.”

  ⚠️ SAFETY:
  Avoid diminishing fantasy loss. Honour symbolic grief.
  `
  },

  {
    format: "emotional honesty",
    tone: "gentle, validating, emotionally literate",
    theme: "missing without meaning regression",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: Missing Them Doesn’t Mean You Should Go Back

  ### Requirements:
  - 450–600 words
  - Normalise missing someone while still choosing separation
  - Include a metaphor (e.g., a song you still love but don’t need on repeat)
  - Offer a journaling prompt: “What exactly do I miss — and is it still true?”
  - End with: “Missing isn’t a mistake. It’s memory passing through.”

  ⚠️ SAFETY:
  Do not imply feelings mean failure. Honour complexity of emotions.
  `
  },

  {
    format: "decluttering ritual",
    tone: "calm, clear, action-oriented",
    theme: "physical and symbolic release",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: Make Space — In Your Room, and in You

  ### Requirements:
  - 450–600 words
  - Offer a gentle step-by-step guide to decluttering breakup objects (texts, photos, gifts)
  - Include a decision aid: “Keep, store, or release?” flowchart
  - End with a ritual: repurposing or releasing one object
  - Final line: “Space invites renewal.”

  ⚠️ SAFETY:
  Avoid pushing purging. Offer slow, intentional emotional pacing.
  `
  },

  {
    format: "night-time emotional care",
    tone: "nurturing, soothing, grounded",
    theme: "evening pain points",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: Nights Are the Hardest — Here’s What Helps

  ### Requirements:
  - 500–650 words
  - Validate nighttime loneliness, memories, and overthinking
  - Provide a comfort protocol (e.g., no-phone wind-down, weighted blanket, soft media)
  - Include a grounding bedtime mantra
  - End with: “You made it through another night — that counts.”

  ⚠️ SAFETY:
  Avoid implying sleep fixes pain. Honour emotional safety needs.
  `
  },

  {
    format: "direction setting",
    tone: "empowering, thoughtful, focused",
    theme: "what comes next",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: Finding North Again — Your Post-Breakup Compass

  ### Requirements:
  - 500–700 words
  - Explain “compass values” — personal drivers (e.g., growth, peace, creativity)
  - Include a short values ranking exercise
  - Guide the reader to set one “compass-aligned” goal for the next month
  - End with: “You’re not lost. You’re just between destinations.”

  ⚠️ SAFETY:
  Avoid urgency. Honour internal motivation over pressure.
  `
  },

  {
    format: "relapse normalisation",
    tone: "compassionate, steadying, non-judgemental",
    theme: "nonlinear recovery",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to move on from their ex**.

  ### Topic: Healing Isn’t Linear — You’re Still Progressing

  ### Requirements:
  - 500–700 words
  - Share a story of someone who reached out to their ex and learned from it
  - Reframe setbacks as moments of insight, not failure
  - Include a “Setback Response Plan” worksheet
  - End with: “You didn’t go backward. You just paused. Keep walking.”

  ⚠️ SAFETY:
  Avoid punishment framing. Encourage reflection without shame.
  `
  }
];