# Manual AI Council Workbench

> **An offline-first, blind-shuffled, multi-stage manual consensus orchestrator for LLM councils.**

Manual AI Council Workbench is a specialized, game-theoretically sound alignment tool designed to coordinate multiple independent AI models into a single, highly refined consensus answer. Rather than allowing one model to dictate the narrative, or relying on simple auto-regressive cascading, this workbench structures a rigorous, manual **coordination game** based on democratic voting theory, blind evaluation, and strict constitutional constraints.

The application is styled with a gorgeous, high-contrast **Sophisticated Dark** aesthetic—crafted with a rich slate canvas, sharp charcoal lines, deep emerald and amber status accents, and elegant editorial serif typography.

---

## 🏛️ Core Philosophy: The Coordination Game

When multiple language models are queried, they produce diverse answers containing distinct strengths and flaws. Simply choosing one at random or letting an AI judge pick its favorite results in selection bias and self-expression over factual accuracy. 

The Workbench treats consensus as a **multi-stage coordination game**:
1. **Epistemic Humility**: Diverse independent models answer a prompt in complete isolation.
2. **Double-Blind Refereeing**: Evaluators critique, rank, and score anonymized answers under randomized layouts seeded deterministically per-judge. This prevents name-brand bias (e.g., favoring "ChatGPT" or "Gemini" automatically) and eliminates positioning bias.
3. **Rigorous Democratic Consolidation**: We compute group preferences across **five distinct election systems** (Condorcet, Instant Runoff, Borda Count, Range Voting, and Approval Voting) to identify a mathematically robust "constitution" (The Consensus Ledger).
4. **Targeted Redrafting**: Editors are restricted to modifying the selected baseline text to fulfill the exact constraints of the Consensus Ledger, preventing style bloat or creative divergence.
5. **Closure & Approval**: The compiled drafts are judged once more under double-blind shuffling. The system breaks ties using median consensus scores, veto counts, and a strict brevity tiebreaker to declare the ultimate, authoritative answer.

---

## 🔄 Workflow Stages

The application guides you step-by-step through a rigorous 5-step consensus loop:

### 1. Stage 1 — Independent Answers
* **Action**: Define your original prompt.
* **Mechanism**: Copy the unified briefing to your clipboard or download individual text prompts for each model. Paste each model's independent, uninfluenced response back into its designated editor slot.
* **Goal**: Capture raw, diverse perspectives without cross-influence.

### 2. Stage 2 — Blind Evaluation
* **Action**: Generate blind evaluation prompts for each of your judges.
* **Mechanism**: The workbench uses a deterministic, seed-based shuffle to present anonymized candidates labeled dynamically (e.g., *Candidate A*, *Candidate B*) to each judge. 
* **Goal**: Each judge rates the candidates, ranks them, flags **fatal flaws**, and proposes precise **must-include/must-fix corrections** without knowing which model wrote which text.

### 3. Stage 2B — Election Results
* **Action**: Automatically calculate the group preference.
* **Mechanism**: Analyzes parsed ballots under five math systems:
  * **Condorcet Method**: Pairs every candidate head-to-head to find the true majority winner.
  * **Instant Runoff (IRV)**: Simulates ranked-choice elimination rounds.
  * **Borda Count**: Distributes weighted points based on ranking depth.
  * **Score Voting**: Averages the raw 0–10 utility scores.
  * **Approval Voting**: Tallies binary approvals.
* **Goal**: Identify a mathematically optimal baseline candidate and high-quality runner-ups.

### 4. Stage 2C — Consensus Ledger
* **Action**: Compile the "Council Constitution."
* **Mechanism**: Aggregate all judges' individual critiques, Must-Include facts, Must-Fix logic errors, and Must-Exclude style bloat. Filter and sort them by the weight of judge support into a consolidated, unified ledger.
* **Goal**: Establish a single shared criteria list that all final proposals must satisfy.

### 5. Stage 3 — Consensus Proposals
* **Action**: Task model editors with draft synthesis.
* **Mechanism**: Send a specialized editing briefing containing the chosen baseline answer, the consensus ledger guidelines, and the alternative runner-up snippets to the models.
* **Goal**: Editors output a cohesive, polished revision wrapped inside a structured JSON codeblock.

### 6. Stage 4 — Final Approval Ballots
* **Action**: Execute ranked approval voting.
* **Mechanism**: The compiled consensus drafts are shuffled and blind-labeled once more. Judges score (0-10), approve, or veto each proposal.
* **Goal**: Gather rigorous feedback on the integrated proposals.

### 7. Final Answer Output
* **Action**: Declare the ultimate consensus winner.
* **Mechanism**: The system filters proposals by approval, breaking ties using median score, veto count, mean score, and finally, length (brevity is preferred when quality is equal).
* **Goal**: Copy or download the definitive, battle-tested, peer-reviewed Markdown output.

---

## 🎭 The Roster: Western & Eastern Blocs

To counter geographic, corporate, and cultural bias, the workbench divides models into balanced geopolitical blocs:

* **Western Bloc (Atlantic Core)**:
  * **ChatGPT** (OpenAI)
  * **Gemini** (Google)
  * **Grok** (xAI)
* **Eastern Bloc (Pacific Core)**:
  * **DeepSeek** (DeepSeek)
  * **Qwen** (Alibaba)
  * **Kimi** (Moonshot AI)

*Note: You can easily add, remove, customize, or restore default models in the Roster Manager.*

---

## 🎨 Visual Identity: Sophisticated Dark Theme

The application interface is meticulously styled to support long-term analytical work and deep focus:

* **The Canvas**: Immersive near-black background (`#0a0b0e`) paired with high-contrast, text-stable slate-white typography (`#e2e8f0`).
* **Visual Rhythm**: High-density slate card panels (`#12151c`) framed with sharp, thin charcoal borders (`#1f2937`).
* **Accents**: 
  * Primary actions & focus highlights set in a deep, professional blue (`#3b82f6`).
  * Strict semantic signaling: Green (`#10b981`) for approvals, Amber (`#f59e0b`) for warnings, and Rose (`#f43f5e`) for fatal flaws or vetoes.
* **Typography Pairing**: Clean, highly-legible **Inter** for user interface buttons, menus, and controls, paired with the timeless elegance of **Playfair Display** (italicized serifs) for model name badges and winners, and **JetBrains Mono** for raw prompt scripts, point values, and system outputs.

---

## 🚀 How to Use

### Step 1: Initialize Workspace
1. Launch the app and click **Workspaces** in the header.
2. Create a new project workspace (e.g., *"Global Climate Policy Consensus"*).
3. (Optional) Click **Model Roster** to add any custom local or cloud models you want to include in the council.

### Step 2: Query Stage 1
1. Enter your original research prompt in **Stage 1**.
2. Click **Copy Prompt** for each model, paste it into the respective model's chat tab, and copy their response back.
3. Once all responses are pasted, click **Generate Blind Evaluation Briefings**.

### Step 3: Run Blind Evaluation
1. In **Stage 2**, copy the randomized ballot prompts.
2. Query each model judge with their customized, blind-shuffled ballot.
3. Paste their returned ballots (including the `BEGIN_BALLOT_JSON` block) back into the app.
4. Click **Aggregate Critiques** and proceed to see the robust election statistics.

### Step 4: Refine the Ledger
1. View the democratic voting breakdown in the **Results** tab.
2. In **Consensus Ledger**, review the aggregated corrections, exclusions, and disputes. Save the shared constitution.

### Step 5: Generate the Final Consensus Proposal
1. In **Stage 3**, copy the synthesis prompts to the models.
2. Paste their compiled drafts.
3. In **Stage 4**, evaluate the final proposals with another round of blind approval ballots.
4. Go to **Final Output** to discover the mathematically superior, peer-approved consensus response.

---

## 🛠️ Local Development & Commands

The workbench is built on a modern **React 18** and **TypeScript** stack powered by **Vite** and styled with **Tailwind CSS**.

### Setup
```bash
# Install dependencies
npm install

# Start the local development server
npm run dev

# Compile the production bundle
npm run build
```

---

*Manual AI Council Workbench is designed to keep your data private, offering robust export/import backup configurations to save or restore your entire council run in a single JSON file.*
