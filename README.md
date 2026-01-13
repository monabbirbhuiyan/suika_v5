Suika — Product Documentation (v5)

1. Product Overview
   Name
   Suika
   Tagline
   “From Chaos To Clarity”
   One-sentence definition
   Suika is a sensemaking and progress-visualization tool for exploratory, thinking-heavy work where progress happens before tasks exist.

2. Problem Statement
   Modern project management tools assume:
   work is linear
   Progress equals completed tasks
   Clarity exists before execution
   This assumption fails for:
   ADHD creatives
   researchers / PhD students
   solo developers designing systems
   Anyone doing exploratory, ambiguous work
   The Core Pain
   Users often feel:
   “I worked all day, but nothing is done.”
   Even when:
   understanding improved
   options narrowed
   constraints discovered
   wrong paths eliminated
   Traditional tools erase this progress, creating guilt, burnout, and false stagnation.

3. Product Philosophy
   Core Belief
   Understanding is progress.
   Suika treats:
   uncertainty as real
   exploration as valuable
   contradiction as insight
   clarity as the true milestone
   What Suika Is
   A progress interpreter
   A mirror of thinking
   A pre-task system
   What Suika Is Not
   Not a task manager
   Not a kanban board
   Not a whiteboard
   Not a note-taking app
   Not a collaboration platform (v5)

4. Target Audience
   Primary Audience
   People doing exploratory, non-linear, thinking-heavy work, especially:
   ADHD creatives
   researchers / PhD students
   solo developers designing or refactoring systems
   Psychographic Traits
   Think in fragments
   Start before they’re sure
   Feel pressure from “productivity theater.”
   Hate fake progress bars
   Value calm, clarity, and truth over speed

5. Core Concepts & Vocabulary
   5.1 Problem Space
   A Problem Space represents an area of inquiry or decision-making.
   Examples:
   “Should I rebuild auth or extract it?”
   “New app architecture options”
   “Why does onboarding drop-off increase after step 2?”
   A Problem Space is not a project plan.
   It is a container for uncertainty.

5.2 Fragment (Core Object)
A Fragment is a single piece of thinking.
Fragments are intentionally:
small
incomplete
imperfect
Fragment Types
Question – something unclear
Idea – a possible approach
Constraint – a limitation discovered
Observation – something noticed
Conclusion (emerges later)
Fragments are always text-based.

5.3 Resolution State
Each Fragment has a state:
Unresolved
Resolved
Resolution means:
“This is clear enough for now.”
Resolution does not mean:
finished
correct forever
shipped

Resolution is reversible.

6. AI-Assisted Connections (Core Differentiator)
   Purpose
   Reduce cognitive load by having AI analyze fragments and propose meaningful relationships, allowing the user to focus on thinking—not wiring diagrams.

7. Relationship Types (Semantic Links)
   Fragments can be connected by exactly three meanings:
   Clarifies
   “This helps explain or support that.”

Contradicts
“This challenges or invalidates that.”

Resolves
“This answers that question.”
There are no freeform edges.

8. AI’s Role (Critical Design Principle)
   Core Rule
   AI suggests. Humans decide.
   The AI:
   proposes connections
   explains its reasoning
   estimates confidence
   The user:
   accepts
   edits
   rejects
   Nothing becomes “real” without user confirmation.
   This preserves trust, agency, and intellectual ownership.

9. AI Capabilities
   10.1 Connection Suggestions (Primary)
   The AI analyzes all fragments within a Problem Space and proposes:
   source fragment
   target fragment
   relationship type
   confidence score
   one-sentence rationale
   The AI never introduces new facts—it only reasons over user-written content.

10.2 Resolution Suggestions (Secondary)
The AI may suggest:
“This question appears resolved by these fragments.”
Only when:
The target is a Question
There is strong supporting content
No strong contradiction exists
Resolution suggestions are always optional.

10.3 Clustering (Layout-Only, Optional)
AI may softly group fragments into conceptual clusters to improve visualization.
Clusters are not a taxonomy
They affect the layout only
They may remain invisible to users

11. AI Suggestion Inbox (UX)
    Each Problem Space includes a Suggestions Panel.
    Each Suggestion Shows:
    Relationship type badge
    Source → Target preview
    Confidence (Low / Medium / High)
    Short rationale
    User Actions:
    ✅ Accept
    ✏️ Edit (change type or direction)
    ❌ Reject
    (Optional) “Mute similar suggestions”
    Batch Actions:
    “Accept all High confidence.”
    “Review next batch.”
    Rejected suggestions are not shown again.
12. The Clarity Graph (Signature Feature)
    Purpose
    Visualize how understanding evolves over time.

Core Constraint
The Clarity Graph is read-only.
Users cannot:
drag nodes
arrange layout
resize elements
customize styles

This eliminates:
organizational anxiety
aesthetic decision fatigue
whiteboard chaos
The graph is a reflection, not a canvas.

Graph Semantics
Nodes
Each node = one Fragment
Visual state reflects:

fragment type
resolution status
Edges
Each edge represents a confirmed relationship
Edge style reflects meaning

Visual Language
Unresolved Fragments
Higher contrast
Slightly larger
Gentle “breathing” animation
Positioned toward center

Resolved Fragments
Lower opacity
Smaller
Stable positioning
Drift outward or downward

Relationship Styles
Clarifies → calm accent
Contradicts → coral / tension
Resolves → mint / settling

Suggested vs Accepted Edges
Accepted edges: solid, primary
Suggested edges: dotted, lighter (toggleable)
Default view shows accepted only.

13. Progress Model (No Tasks)
    Progress is communicated via state change, not completion.
    Progress Indicators
    Open questions count
    Resolved fragments count
    Contradictions surfaced

No:
percentages
progress bars
velocity metrics
Progress tells a story, not a score.

14. User Flows
    14.1 Create Problem Space
    Enter title + optional description
    Empty state encourages first fragment

14.2 Add Fragment
Select type
Write text
Fragment appears immediately
AI may generate suggestions (opt-in or button)

14.3 Review AI Suggestions
User opens Suggestions Panel
Reviews proposed links
Accepts / edits / rejects
Accepted links appear in graph.

14.4 Resolve Fragment
Toggle resolved
Graph visually settles
Counts update

14.5 Session Mode (Optional)
Lightweight focus aid:
Start session
Choose energy level (Low / Medium / High)
Suika suggests gentle next step
No timers. No pressure.

15. Pages & Structure
    Marketing
    Landing page with floating UI elements

Emphasis on philosophy, not features

App
Auth (mock)
Dashboard (clarity overview)
Problem Spaces list
Problem Space detail (Fragments + Graph)
Full Graph view
Settings

16. Non-Goals (Explicit)
    Suika v5 will NOT include:
    collaboration
    comments
    deadlines
    tasks
    exports
    integrations
    AI content generation
    These are intentionally excluded.

17. Emotional Design Principles
    Suika should feel:
    calm
    validating
    non-judgmental
    intellectually respectful
    It should never feel:
    demanding
    gamified
    performative
    overwhelming

18. MVP Success Criteria
    Suika v5 succeeds if users say:
    “This matches how my brain works.”
    “I can finally see my progress.”
    “This removes pressure.”
    “This helps before tasks exist.”

19. Final Product Truth
    Suika doesn’t help you do more.
    It helps you recognize the work your mind is already doing.
    That’s the product.
    That’s the moat.
    That’s the soul.
