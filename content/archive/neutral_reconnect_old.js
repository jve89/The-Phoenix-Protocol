module.exports = [
  // 1 - 10
  {
    format: "relationship audit",
    tone: "honest, reflective, calm",
    theme: "breakup clarity",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: Why Did the Breakup Happen?

  ### Requirements:
  - 550–700 words
  - Gently walk the reader through a mutual cause analysis (not blame)
  - Use a framework like **Attachment Styles** or **Conflict Loops**
  - Include a short case of someone who misread the cause and got clarity later
  - End with: “Clarity is the first kindness we offer ourselves.”

  ⚠️ SAFETY:
  Do not promote oversharing or premature conclusions. Keep the pace safe and curious.
  `,
  },

  {
    format: "change motivation",
    tone: "hopeful, realistic, growth-oriented",
    theme: "personal growth",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: Change Isn’t Begging — It’s Evolving

  ### Requirements:
  - 500–650 words
  - Reframe growth as internal alignment, not persuasive action
  - Tell a story of someone who made inward changes and attracted reconnection through peace
  - Include a “change for me vs for them” self-check
  - End with: “You’re not chasing — you’re becoming.”

  ⚠️ SAFETY:
  Never imply change equals guaranteed return. Focus on authentic alignment.
  `,
  },

  {
    format: "communication skills",
    tone: "mature, respectful, constructive",
    theme: "conflict resolution",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: Can You Talk Without Triggering Each Other?

  ### Requirements:
  - 550–700 words
  - Break down common pitfalls in post-breakup communication
  - Introduce emotional safety markers before dialogue happens
  - Include a 3-part “Readiness to Talk” checklist
  - Offer examples of how to express vulnerability without pressure
  - End with: “The right words come from the right nervous system.”

  ⚠️ SAFETY:
  Avoid scripts. Focus on timing, tone, and inner state first.
  `,
  },

  {
    format: "mindset prep",
    tone: "balanced, cautious, emotionally intelligent",
    theme: "risk awareness",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: What If It Doesn’t Work Out?

  ### Requirements:
  - 500–650 words
  - Acknowledge both hope and uncertainty without fear-mongering
  - Share a story of someone who pursued reconnection and found peace in letting go
  - Include a journaling exercise: “What’s the value in trying, even without outcome?”
  - End with: “Some attempts are healing — even without reunion.”

  ⚠️ SAFETY:
  Don’t encourage emotional gambling. Emphasise self-respect regardless of result.
  `,
  },

  {
    format: "self-esteem boost",
    tone: "warm, confident, supportive",
    theme: "confidence rebuilding",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: You Are Worthy — With or Without Them

  ### Requirements:
  - 500–650 words
  - Anchor self-worth in identity, not in relationship status
  - Share a story of someone who reconnected from a place of self-containment
  - Include mirror affirmations and a grounding ritual
  - End with: “Reconnection is a mirror — not a medicine.”

  ⚠️ SAFETY:
  Avoid language that reinforces “fix yourself to win them back.” Focus on rooted self-worth.
  `,
  },

  {
    format: "honest intentions",
    tone: "truthful, self-inquisitive, gentle",
    theme: "motivation clarity",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: Do You Miss *Them* — Or the Feeling?

  ### Requirements:
  - 500–650 words
  - Help the reader explore emotional hunger vs compatibility
  - Include a guided self-check with five questions to separate craving from connection
  - Share a short case of someone who mistook nostalgia for truth
  - End with: “Healing means telling the truth — especially to yourself.”

  ⚠️ SAFETY:
  No shame for longing. The goal is clarity, not detachment.
  `,
  },

  {
    format: "timing wisdom",
    tone: "measured, strategic, respectful",
    theme: "reconnection pacing",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: It’s Not About When You Text — It’s About Who You Are When You Do

  ### Requirements:
  - 500–650 words
  - Break the myth of perfect timing
  - Offer examples of timing driven by emotional wholeness, not fear
  - Include a mini readiness quiz: “Are you texting from calm or urgency?”
  - End with: “When you’re anchored, any time is the right time.”

  ⚠️ SAFETY:
  Do not offer contact scripts or games. Honour emotional maturity first.
  `,
  },

  {
    format: "emotional safety",
    tone: "calm, secure, mindful",
    theme: "nervous system healing",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: Reconnecting Starts with a Regulated Nervous System

  ### Requirements:
  - 500–650 words
  - Introduce fight/flight/freeze states with clarity and non-clinical tone
  - Teach somatic grounding rituals (breathing, tapping, self-touch)
  - Offer a one-minute emotional reset before any reconnective action
  - End with: “Your calm is your clearest message.”

  ⚠️ SAFETY:
  Avoid pathologising or medical claims. Keep grounded and body-based.
  `,
  },

  {
    format: "hope realism",
    tone: "anchored, realistic, constructive",
    theme: "hope with boundaries",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: Hope Is a Candle — Not a Contract

  ### Requirements:
  - 500–600 words
  - Help the reader stay warm with hope while holding healthy boundaries
  - Share a story of someone who used hope to stay grounded, not obsessed
  - Include journaling prompts about what they *can* control
  - End with: “Carry the flame — don’t burn your hands.”

  ⚠️ SAFETY:
  Never equate hope with outcome. Honour stability over fantasy.
  `,
  },

  {
    format: "values alignment",
    tone: "clear, grounded, introspective",
    theme: "relationship standards",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: Do You Even Want the Same Things?

  ### Requirements:
  - 500–650 words
  - Lead the reader through a “values inventory” of what truly matters long-term
  - Include a “dealbreakers vs negotiables” worksheet
  - Share a case of someone who reconnected *after* clarifying shared life direction
  - End with: “Love needs a path — not just a pulse.”

  ⚠️ SAFETY:
  Avoid implying people must compromise values. Honour clarity over comfort.
  `,
  },
  // 11 - 20
  {
    format: "emotional readiness audit",
    tone: "gentle, realistic, grounded",
    theme: "availability check",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: Is Your Ex Even Emotionally Available?

  ### Requirements:
  - 500–650 words
  - Explain the signs of emotional openness vs avoidant/dismissive behaviour
  - Include a story of someone who paused reconnection after recognising avoidant signals
  - Offer a checklist of red/yellow/green flags
  - End with: “You’re not reconnecting with potential — you’re reconnecting with presence.”

  ⚠️ SAFETY:
  Avoid diagnosing. Focus on observed patterns, not clinical labels.
  `,
  },

  {
    format: "intention clarity",
    tone: "clear, self-respecting, steady",
    theme: "inner alignment",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: You Don’t Need to Convince Them — You Need to Be Clear

  ### Requirements:
  - 500–650 words
  - Reframe reconnection as mutual clarity, not a persuasion process
  - Include a mini journaling sequence to clarify what the user is truly seeking
  - Offer a short mantra ritual to anchor clarity before communication
  - End with: “Certainty in yourself changes every conversation.”

  ⚠️ SAFETY:
  Avoid framing love as a pitch or strategy. Honour inner truth above all.
  `,
  },

  {
    format: "no-contact perspective",
    tone: "soothing, wise, introspective",
    theme: "healing silence",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: The Silent Phase Isn’t Wasted Time

  ### Requirements:
  - 500–650 words
  - Offer perspective on how no-contact can deepen clarity and readiness
  - Share a story of someone who emerged from silence stronger and more grounded
  - Include a “use the silence” checklist (growth, boundaries, reconnection prep)
  - End with: “Stillness is not absence — it’s a preparation.”

  ⚠️ SAFETY:
  Avoid glorifying ghosting. Focus on purposeful space, not passive waiting.
  `,
  },

  {
    format: "pattern interrupt",
    tone: "honest, empowering, aware",
    theme: "breakup dynamics",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: You Can’t Rewrite the Past — But You Can Rewrite the Pattern

  ### Requirements:
  - 500–650 words
  - Explain emotional pattern repetition in relationships
  - Include a visual metaphor (e.g. dance steps, echo loop)
  - Provide a tool to identify old patterns and consciously shift them
  - End with: “Change the rhythm — and the dance changes too.”

  ⚠️ SAFETY:
  Avoid implying that one-sided effort breaks cycles. Emphasise shared awareness.
  `,
  },

  {
    format: "relationship reframe",
    tone: "visionary, cautious, heartfelt",
    theme: "fresh start perspective",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: Are You Ready for a New Kind of Relationship — with the Same Person?

  ### Requirements:
  - 550–700 words
  - Reframe reconnection as building something *new*, not resuming what was
  - Include a micro-case of someone who reconnected with different terms and mindset
  - Offer a guided visualization of “version 2.0” — values, communication, boundaries
  - End with: “Rebuilding isn’t returning — it’s reimagining.”

  ⚠️ SAFETY:
  Do not imply forced optimism. Ground the reframe in tangible shifts.
  `,
  },

  {
    format: "emotional self-forgiveness",
    tone: "gentle, introspective, encouraging",
    theme: "healing guilt",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: When Guilt Blocks Growth

  ### Requirements:
  - 500–650 words
  - Explore how guilt can freeze progress or lead to performative change
  - Include a story of someone who moved past guilt before reconnecting with real integrity
  - Offer a self-forgiveness ritual or letter template
  - End with: “You are allowed to evolve beyond your past.”

  ⚠️ SAFETY:
  Avoid minimizing harmful behaviour. Emphasise accountability alongside compassion.
  `,
  },

  {
    format: "visualisation prompt",
    tone: "curious, calm, emotionally present",
    theme: "conversation prep",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: If You Saw Them Again Tomorrow… What Would You Say?

  ### Requirements:
  - 450–600 words
  - Guide the reader through a visualisation of a surprise encounter
  - Use prompts to explore emotional readiness, clarity, and self-regulation
  - Offer a “notes-to-self” journaling page for post-visualisation reflection
  - End with: “Sometimes your clearest words come in imagined silence first.”

  ⚠️ SAFETY:
  Avoid romantic fantasy spirals. Stay grounded in preparation, not outcome.
  `,
  },

  {
    format: "worth and competition",
    tone: "empowering, reality-based, confident",
    theme: "self-worth clarity",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: Your Ex Is Not a Reward — And You Are Not in a Contest

  ### Requirements:
  - 500–600 words
  - Deconstruct scarcity mindset and comparison traps
  - Share a case of someone who let go of “winning them back” energy
  - Offer a grounded “self-worth stabiliser” worksheet
  - End with: “You’re not trying to win — you’re learning to choose.”

  ⚠️ SAFETY:
  Avoid adversarial framing. Focus on relational alignment, not conquest.
  `,
  },

  {
    format: "accountability audit",
    tone: "serious, grounded, brave",
    theme: "post-betrayal reconnection",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: Reconnection After Infidelity: What Has Actually Changed?

  ### Requirements:
  - 600–750 words
  - Address reconnection after cheating or betrayal
  - Include a story of someone who rebuilt trust slowly after full accountability
  - Offer a three-column worksheet: Before / What Changed / Still Unclear
  - End with: “It’s not about forgetting — it’s about deciding who you are now.”

  ⚠️ SAFETY:
  Avoid sweeping forgiveness or blanket advice. Honour pain and reality.
  `,
  },

  {
    format: "external resistance",
    tone: "balanced, thoughtful, confident",
    theme: "autonomy and boundaries",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: When Friends and Family Don’t Support Your Decision

  ### Requirements:
  - 500–650 words
  - Explore the tension between personal choice and outside opinion
  - Include a story of someone who reconnected despite social resistance — and learned from it
  - Provide a boundaries script and self-check around outside influence
  - End with: “This is your story — and only you live the ending.”

  ⚠️ SAFETY:
  Avoid polarising views. Respect diverse perspectives while affirming autonomy.
  `,
  },
  // 21 - 30
  {
    format: "past reframing",
    tone: "thoughtful, spacious, reframing",
    theme: "narrative shift",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: The Breakup Was a Chapter — Not the Final Sentence

  ### Requirements:
  - 500–650 words
  - Explore how past experiences can be reinterpreted over time
  - Use a case of someone who rewrote the story they told themselves about the breakup
  - Include a guided journaling prompt for reshaping the narrative
  - End with: “This story isn’t over — but it needs a new author.”

  ⚠️ SAFETY:
  Avoid denial or rewriting pain. Honour truth while offering new perspective.
  `,
  },

  {
    format: "romantic realism",
    tone: "curious, honest, clarifying",
    theme: "truthful vision",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: Are You Chasing Nostalgia — or Building Something New?

  ### Requirements:
  - 500–600 words
  - Distinguish between longing for the past vs. co-creating a new future
  - Include a story of someone who shifted from “past-chasing” to “future-choosing”
  - Offer a “memory filter” tool (rose-tint vs reality)
  - End with: “If you return, return as new people — not just old habits.”

  ⚠️ SAFETY:
  Do not shame nostalgia. Use it as a lens for insight, not a trap.
  `,
  },

  {
    format: "relational safety",
    tone: "grounded, kind, emotionally focused",
    theme: "shared emotional space",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: What Would It Take to Feel Safe Together Again?

  ### Requirements:
  - 500–650 words
  - Explore emotional safety as the foundation for reconnection
  - Include a dialogue story of a couple slowly rebuilding trust
  - Offer a mutual safety checklist or “emotional weather report” tool
  - End with: “Without safety, love holds its breath.”

  ⚠️ SAFETY:
  Do not pathologise emotional wounds. Honour slow rebuilding.
  `,
  },

  {
    format: "authentic evolution",
    tone: "accountable, wise, self-aware",
    theme: "true behaviour shift",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: Don’t Perform Change — Practice It

  ### Requirements:
  - 500–600 words
  - Distinguish between performative gestures and embodied growth
  - Include a case study of someone who quietly improved their patterns over time
  - Offer a habit tracker or values alignment prompt
  - End with: “You don’t have to prove anything — just be consistent.”

  ⚠️ SAFETY:
  Avoid shaming performance instincts. Guide gently toward authenticity.
  `,
  },

  {
    format: "fear mapping",
    tone: "brave, steady, emotionally honest",
    theme: "fear integration",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: What’s the Worst-Case Scenario — and Could You Handle It?

  ### Requirements:
  - 550–700 words
  - Guide the reader through fear-mapping (naming, tracing, planning)
  - Include a story of someone who prepared emotionally for a “no” and grew anyway
  - Offer a “fear-to-fuel” worksheet
  - End with: “Courage isn’t being sure — it’s being ready for any answer.”

  ⚠️ SAFETY:
  Avoid fear dismissal. Validate every emotional risk while strengthening resilience.
  `,
  },

  {
    format: "emotional regulation",
    tone: "compassionate, calming, body-aware",
    theme: "self-stabilisation",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: You Can’t Reconnect if You’re Still in Survival Mode

  ### Requirements:
  - 500–650 words
  - Explain how chronic stress responses (fight/flight/freeze) block connection
  - Share a brief story of someone who found relational clarity after nervous system work
  - Provide a grounding ritual the reader can do before any reconnection steps
  - End with: “Connection thrives in calm — not chaos.”

  ⚠️ SAFETY:
  Avoid medical claims. Stay in the realm of emotional literacy and self-awareness.
  `,
  },

  {
    format: "boundary acceptance",
    tone: "respectful, reassuring, patient",
    theme: "consensual pacing",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: Respecting Their Space Doesn’t Mean You’re Giving Up

  ### Requirements:
  - 450–600 words
  - Reframe distance as part of emotional maturity
  - Share a story of someone who held space and reconnected later with integrity
  - Include a boundary tracker tool (yours + theirs)
  - End with: “Real connection can withstand respectful distance.”

  ⚠️ SAFETY:
  Avoid shaming urgency. Offer tools for patience and perspective.
  `,
  },

  {
    format: "emotional filtering",
    tone: "curious, nonjudgmental, clarifying",
    theme: "emotional discernment",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: Is This Love — or Is It Guilt?

  ### Requirements:
  - 500–650 words
  - Explore how guilt can mimic longing
  - Include a short case of someone who confused guilt for love, then clarified
  - Offer a self-reflection worksheet with emotional origin questions
  - End with: “Reconnect with truth — not obligation.”

  ⚠️ SAFETY:
  Avoid invalidating the reader’s feelings. Help them sort, not suppress.
  `,
  },

  {
    format: "emotional robustness",
    tone: "direct, empowering, stabilising",
    theme: "boundary resilience",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: Can You Handle Their Boundaries Without Collapsing?

  ### Requirements:
  - 450–600 words
  - Show how emotional maturity involves respecting “no” without shutdown
  - Include a story of someone who stayed grounded despite hearing “not yet”
  - Provide a resilience tracker: how do you react to their limits?
  - End with: “Your emotional strength is part of your message.”

  ⚠️ SAFETY:
  Avoid encouraging emotional suppression. Support healthy expression and containment.
  `,
  },

  {
    format: "empathy expansion",
    tone: "thoughtful, emotionally intelligent, curious",
    theme: "deep understanding",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: Don’t Just Want Them — Understand Them

  ### Requirements:
  - 500–650 words
  - Emphasise empathy over craving
  - Include a story of someone who rebuilt connection by deeply listening to their ex’s experience
  - Provide a list of reflective questions to understand their world better
  - End with: “When they feel seen — not claimed — they’re more likely to lean in.”

  ⚠️ SAFETY:
  Avoid placing all burden on the reader. Frame empathy as mutual, but initiated inwardly.
  `,
  },
  // 31 - 40
  {
    format: "self-compassion",
    tone: "gentle, encouraging, grounded",
    theme: "worthiness without perfection",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: You Don’t Have to Be Perfect to Be Ready

  ### Requirements:
  - 500–600 words
  - Address the pressure to “fix everything” before reaching out
  - Share a story of someone who initiated reconnection while still healing
  - Include a “readiness without perfection” checklist
  - End with: “Progress matters more than polish.”

  ⚠️ SAFETY:
  Avoid endorsing premature action. Promote self-awareness without delay paralysis.
  `,
  },

  {
    format: "emotional interpretation",
    tone: "insightful, gentle, validating",
    theme: "misheard meanings",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: When They Said “I Need Space” — Did You Hear “I Don’t Love You”?

  ### Requirements:
  - 500–650 words
  - Help the reader decode common emotionally charged phrases
  - Share a story of someone who misread distancing and later understood the nuance
  - Offer a worksheet on emotional filtering and personal projection
  - End with: “Understanding starts with accurate hearing.”

  ⚠️ SAFETY:
  Avoid promoting false hope. Offer clarity without twisting meaning.
  `,
  },

  {
    format: "consensual re-approach",
    tone: "respectful, self-aware, kind",
    theme: "non-pushy outreach",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: Reconnection Is a Door — Not a Demand

  ### Requirements:
  - 450–600 words
  - Frame reconnection attempts as an invitation, not pressure
  - Share an example of someone who offered openness without insistence
  - Include a “non-invasive message” template
  - End with: “Your role is to knock — not to barge in.”

  ⚠️ SAFETY:
  Do not promote repeated messaging or boundary crossing. Honour autonomy.
  `,
  },

  {
    format: "repair clarity",
    tone: "honest, growth-focused, reflective",
    theme: "real accountability",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: Did You Actually Apologise — or Just Explain?

  ### Requirements:
  - 500–650 words
  - Explore the difference between justification and genuine apology
  - Share a story of someone who reconnected after meaningful repair
  - Include a 3-part “real apology” formula
  - End with: “Healing starts when the wound is acknowledged — not defended.”

  ⚠️ SAFETY:
  Avoid shaming. Support learning through self-awareness and accountability.
  `,
  },

  {
    format: "motivation alignment",
    tone: "clear, curious, purpose-driven",
    theme: "forward focus",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: Are You Trying to Fix the Past — or Build a Future?

  ### Requirements:
  - 500–650 words
  - Help the reader separate nostalgic impulses from long-term vision
  - Share a story of someone who made peace with the past before rebuilding
  - Offer a “forward vision” worksheet
  - End with: “Let reconnection be a creation — not a correction.”

  ⚠️ SAFETY:
  Do not villainise past reflection. Promote balanced directionality.
  `,
  },

  {
    format: "unspoken dynamics",
    tone: "thoughtful, revealing, compassionate",
    theme: "unacknowledged patterns",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: The Silent Agreement That Broke You Both

  ### Requirements:
  - 500–600 words
  - Explore unconscious relational dynamics (e.g., over-functioning, emotional caretaking)
  - Share a story where an unspoken pattern caused disconnection
  - Include a worksheet for spotting “invisible contracts”
  - End with: “Naming it gives you a choice.”

  ⚠️ SAFETY:
  Avoid overanalysis or blame. Focus on compassionate awareness.
  `,
  },

  {
    format: "self-prioritisation",
    tone: "assertive, supportive, balanced",
    theme: "clarity through self-inquiry",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: Stop Guessing What They Want — Ask What You Need

  ### Requirements:
  - 500–650 words
  - Encourage the reader to stop mind-reading or people-pleasing
  - Share a case of someone who anchored in self-honesty before reaching out
  - Provide a “needs before negotiation” self-assessment
  - End with: “Reconnection starts from your centre — not their shadow.”

  ⚠️ SAFETY:
  Avoid encouraging self-sacrifice. Elevate needs without ego.
  `,
  },

  {
    format: "pattern-breaking",
    tone: "encouraging, wise, determined",
    theme: "growth over relapse",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: You Can Reconnect — Without Repeating

  ### Requirements:
  - 450–600 words
  - Explore the fear of falling into old dynamics
  - Share a story of someone who rebuilt from new behaviour patterns
  - Include a “cycle breaker” commitment list
  - End with: “The past is a lesson — not a loop.”

  ⚠️ SAFETY:
  Avoid demonising the past. Frame repetition as a risk, not a destiny.
  `,
  },

  {
    format: "mindset shift",
    tone: "fresh, inspiring, grounded",
    theme: "reframing reconciliation",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: It’s Not a Second Chance — It’s a New Relationship

  ### Requirements:
  - 500–650 words
  - Reframe reconnection as a rebuild from new foundations
  - Include an example of someone who treated reconnection like a new beginning
  - Offer a “clean slate” exercise or ritual
  - End with: “Same people — new promise.”

  ⚠️ SAFETY:
  Avoid fantasising change without effort. Require joint willingness.
  `,
  },

  {
    format: "reading cues",
    tone: "realistic, kind, observational",
    theme: "discernment in reconnection",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: How to Know If They’re Actually Open — or Just Polite

  ### Requirements:
  - 500–650 words
  - Teach how to distinguish true openness from courteous disengagement
  - Share a case where someone mistook politeness for interest
  - Include a “signal clarity” checklist
  - End with: “Discernment protects your dignity.”

  ⚠️ SAFETY:
  Avoid cynicism or overconfidence. Offer grounded curiosity.
  `,
  },
  // 41 - 50
  {
    format: "expectation management",
    tone: "gentle, honest, illuminating",
    theme: "fantasy vs reality",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: The Reunion Fantasy vs. The Reality Check

  ### Requirements:
  - 500–600 words
  - Explore the difference between imagined reunions and real-world dynamics
  - Include a story where fantasy clouded a reconnection attempt
  - Offer a “Hope vs. Projection” worksheet
  - End with: “Grounded hope creates real bridges.”

  ⚠️ SAFETY:
  Do not shame imagination. Honour it while guiding clarity.
  `,
  },

  {
    format: "empathy-building",
    tone: "curious, emotionally intelligent, humanising",
    theme: "perspective widening",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: What If They’re Healing Too — In Silence?

  ### Requirements:
  - 500–600 words
  - Encourage the reader to imagine the ex’s internal world
  - Share a case of reconnection that began from mutual healing, not outreach
  - Provide a “what might be true for them?” reflection guide
  - End with: “They may be quiet — not absent.”

  ⚠️ SAFETY:
  Avoid romanticising suffering. Highlight empathy without assumptions.
  `,
  },

  {
    format: "communication timing",
    tone: "cautious, emotionally aware, grounded",
    theme: "expressing love wisely",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: Should You Tell Them You Still Love Them?

  ### Requirements:
  - 500–650 words
  - Explore the risks and power of open-hearted expression
  - Share examples of premature confessions vs. grounded disclosures
  - Provide a checklist to assess readiness and intention
  - End with: “Say it when it serves both hearts — not just yours.”

  ⚠️ SAFETY:
  Do not shame vulnerability. Frame timing as a form of care.
  `,
  },

  {
    format: "accountability",
    tone: "mature, self-aware, brave",
    theme: "owning your part",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: The Apology You Never Gave — But Needed To

  ### Requirements:
  - 500–600 words
  - Reflect on unspoken accountability
  - Share a case where an honest apology created space for reconnection
  - Include a “truth and regret” writing prompt
  - End with: “A real apology repairs you first.”

  ⚠️ SAFETY:
  Do not demand reciprocation. Focus on sincere ownership.
  `,
  },

  {
    format: "discernment",
    tone: "balanced, hopeful, wise",
    theme: "choosing wisely",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: Not Every Ex Is Your Person — But Some Are

  ### Requirements:
  - 500–650 words
  - Encourage discernment without killing hope
  - Share contrasting stories: one reconnection that healed, one that hurt
  - Offer a “true partner” value compass tool
  - End with: “Hope wisely — love bravely.”

  ⚠️ SAFETY:
  Do not offer false guarantees. Champion courage and discernment.
  `,
  },

  {
    format: "de-objectification",
    tone: "grounded, respectful, clarifying",
    theme: "seeing them clearly",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: Your Ex Isn’t a Prize — They’re a Person

  ### Requirements:
  - 500–600 words
  - Reframe reconnection away from “winning them back”
  - Include a story of someone who moved from obsession to relational clarity
  - Offer a reflection guide on who the ex really is today
  - End with: “You’re not chasing a prize. You’re choosing a person.”

  ⚠️ SAFETY:
  Avoid blame or mockery. Honour emotional longing while restoring perspective.
  `,
  },

  {
    format: "trust recovery",
    tone: "methodical, nurturing, hopeful",
    theme: "rebuilding trust",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: How to Rebuild Trust — Slowly and Safely

  ### Requirements:
  - 500–650 words
  - Describe what trust requires after rupture
  - Include a 3-stage model of relational trust repair
  - Offer small examples of earned trust behaviours
  - End with: “Consistency over time becomes belief.”

  ⚠️ SAFETY:
  Avoid shaming betrayal. Emphasise safety and pacing.
  `,
  },

  {
    format: "emotional meaning-making",
    tone: "thoughtful, introspective, emotionally intelligent",
    theme: "interpreting nostalgia",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: Romantic Nostalgia: Memory or Message?

  ### Requirements:
  - 500–600 words
  - Explore the emotional weight of nostalgic moments
  - Share a story where nostalgia guided (or misled) someone
  - Include a “message or memory?” reflection journal
  - End with: “Not every echo is a call — but some are.”

  ⚠️ SAFETY:
  Do not dismiss nostalgia. Help the reader interpret with clarity.
  `,
  },

  {
    format: "boundary-setting",
    tone: "strong, kind, structured",
    theme: "relational safety",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: Boundaries Are Not Walls — They’re Bridges

  ### Requirements:
  - 500–600 words
  - Teach how clear boundaries foster real reconnection
  - Include a “Boundary Builder” worksheet (e.g. needs, limits, dealbreakers)
  - Share a case where boundaries actually improved attraction
  - End with: “You protect love by respecting its edges.”

  ⚠️ SAFETY:
  Avoid making boundaries punitive. Frame them as clarity and care.
  `,
  },

  {
    format: "radical acceptance",
    tone: "emotionally evolved, clear, unflinching",
    theme: "accepting their real self",
    prompt: (gender, goalStage) => `
  You are a breakup recovery coach writing a **premium guide for a user who wants to reconnect with their ex**.

  ### Topic: Are You Ready to See Them — Just As They Are?

  ### Requirements:
  - 500–600 words
  - Challenge the reader to drop idealisation
  - Include a story where someone reconnected after accepting both the light and the flaws
  - Offer an “Ideal vs. Real” reflection table
  - End with: “Love without illusion is the only love that lasts.”

  ⚠️ SAFETY:
  Avoid disillusionment traps. Balance realism with warmth.
  `,
  },
];
