# KargoPath Development Rules & Guidelines

**Version:** 1.0  
**Last Updated:** 2026-05-21  
**Applies To:** All developers, AI assistants, and contributors

---

## 🚨 CRITICAL RULES - MUST FOLLOW

### Rule #1: Never Change What Wasn't Requested
**DO NOT make changes to code, configuration, or content unless explicitly requested by the project owner.**

- ❌ **WRONG:** "I noticed the code could be improved, so I refactored it"
- ❌ **WRONG:** "I changed the language to Indonesian because it's more natural"
- ❌ **WRONG:** "I added this feature because it seems useful"
- ✅ **CORRECT:** "The owner asked me to add feature X, so I added only feature X"

### Rule #2: Explicit Approval Required
**For ANY change, you must have explicit approval from the project owner.**

- Get approval BEFORE making changes
- If unclear, ASK first, don't assume
- Document what you're changing and why

### Rule #3: Default Language is ENGLISH
**All user-facing text, comments, and documentation MUST be in English unless explicitly requested otherwise.**

- ❌ **WRONG:** Using Indonesian for labels, messages, or UI text
- ✅ **CORRECT:** All text in English by default
- ✅ **EXCEPTION:** Only use Indonesian if owner explicitly requests it

---

## 📋 Standard Operating Procedures

### For Human Developers

1. **Before Making Changes:**
   - Read the task/issue description carefully
   - Understand EXACTLY what is being requested
   - If unclear, ask for clarification
   - Get explicit approval for the approach

2. **During Development:**
   - Change ONLY what was requested
   - Don't "improve" or "optimize" unrequested code
   - Don't change language/wording without approval
   - Don't add features that weren't asked for

3. **After Making Changes:**
   - Test your changes
   - Document what you changed and why
   - Commit with clear, descriptive messages
   - Request review from project owner

### For AI Assistants (ChatGPT, Claude, Gemini, etc.)

1. **Session Start:**
   - Read this document FIRST
   - Check existing code/content language (should be English)
   - Ask owner for confirmation if anything seems inconsistent

2. **During Work:**
   - Follow Rule #1, #2, #3 strictly
   - For significant changes, create an implementation plan and wait for approval
   - For small changes, confirm understanding before executing
   - NEVER change language without explicit request

3. **Language Handling:**
   - **DEFAULT:** English for all text
   - **ONLY change to Indonesian if:** Owner explicitly says "change this to Indonesian"
   - **NEVER assume:** "Indonesian might be better" or "this should be in Indonesian"

4. **If You Notice Issues:**
   - ❌ **DON'T:** Fix it automatically
   - ✅ **DO:** Report it to the owner and ask if they want it fixed

---

## 🌐 Language Standards

### Default Language: ENGLISH (EN)

**All of the following MUST be in English by default:**

- ✅ User interface text (buttons, labels, placeholders)
- ✅ Form fields and validation messages
- ✅ Error messages and notifications
- ✅ API responses and documentation
- ✅ Code comments (when needed)
- ✅ Variable and function names
- ✅ Git commit messages
- ✅ Documentation files

**Exceptions (Indonesian allowed ONLY when explicitly requested):**
- Content specifically marked as "Indonesian version"
- Localization files (e.g., `id.json` for Indonesian translations)
- Marketing content if owner requests Indonesian

### How to Handle Language Changes

**If owner says:** "Change X to Indonesian"
- ✅ Change ONLY X to Indonesian
- ✅ Keep everything else in English
- ✅ Document the change

**If owner says:** "Make everything Indonesian"
- ⚠️ Confirm: "Do you want ALL text changed to Indonesian, or just specific sections?"
- ⚠️ Wait for explicit confirmation
- ✅ Then proceed with approved scope

---

## 🔄 Change Management Process

### For Small Changes (< 50 lines)
1. Understand the request
2. Confirm your understanding with owner
3. Make the change
4. Test and verify
5. Report completion

### For Medium Changes (50-200 lines)
1. Understand the request
2. Outline your approach
3. Get owner approval on approach
4. Make the change
5. Test and verify
6. Report completion with summary

### For Large Changes (> 200 lines)
1. Understand the request
2. Create detailed implementation plan
3. **STOP and wait for owner approval**
4. After approval, execute in phases
5. Test each phase
6. Create walkthrough document
7. Report completion

---

## 🚫 Common Mistakes to AVOID

### ❌ Mistake #1: "Helpful" Unauthorized Changes
**Example:** Changing English text to Indonesian because "it's more natural for Indonesian users"

**Why it's wrong:** Owner didn't request it, and default language is English

**Correct approach:** Keep English unless explicitly asked to change

### ❌ Mistake #2: Assuming Intent
**Example:** Owner says "fix the login page" and you redesign the entire authentication flow

**Why it's wrong:** You changed more than requested

**Correct approach:** Ask "What specifically needs to be fixed on the login page?"

### ❌ Mistake #3: "Improving" Code Without Request
**Example:** Refactoring working code to use "better" patterns

**Why it's wrong:** If it's not broken and wasn't requested, don't change it

**Correct approach:** Only refactor if explicitly requested

### ❌ Mistake #4: Changing Language Without Confirmation
**Example:** Seeing mixed English/Indonesian and "standardizing" to Indonesian

**Why it's wrong:** Default is English, not Indonesian

**Correct approach:** Report the inconsistency and ask which language to use

---

## 📝 Version Control Guidelines

### Git Commit Messages
- Write in English
- Be specific about what changed
- Reference issue/task number if applicable
- Format: `[Component] Brief description`

**Examples:**
- ✅ `[LoginPage] Reduced input field padding from py-4 to py-3`
- ✅ `[RequestQuote] Changed all text from Indonesian to English`
- ❌ `Updated files` (too vague)
- ❌ `Fixed stuff` (not descriptive)

### Branching Strategy
- Create feature branches for new work
- Never commit directly to `main` without approval
- Branch naming: `feature/description` or `fix/description`

---

## 🤖 AI-Specific Guidelines

### For AI Assistants Working on This Project

**IMPORTANT:** Different AI sessions don't share memory. Follow these rules to maintain consistency:

1. **Always Read This Document First**
   - Before making ANY changes, read `DEVELOPMENT_RULES.md`
   - Check language standards (English is default)
   - Understand the change approval process

2. **Check Existing Code State**
   - If you see Indonesian text in code, DON'T assume it's correct
   - Report it to owner: "I noticed Indonesian text in [file]. Should this be English?"
   - Wait for confirmation before changing

3. **Document Your Changes**
   - Keep a log of what you changed and why
   - If session ends, next AI can read the log
   - Use git commits to track changes

4. **When in Doubt, ASK**
   - If request is ambiguous, ask for clarification
   - If you're unsure about language, ask
   - If scope is unclear, ask
   - **NEVER assume or guess**

5. **Respect Previous Decisions**
   - If code is in English, keep it in English
   - If owner previously said "use English", don't change to Indonesian
   - Check git history for context if needed

---

## ✅ Checklist Before Making Changes

Before you make ANY change, verify:

- [ ] I have explicit approval from project owner
- [ ] I understand EXACTLY what needs to be changed
- [ ] I'm changing ONLY what was requested
- [ ] I'm using English for all text (unless explicitly told otherwise)
- [ ] I'm not "improving" or "optimizing" unrequested code
- [ ] I'm not adding features that weren't asked for
- [ ] I have a plan for testing my changes
- [ ] I will document what I changed and why

---

## 📞 Communication Protocol

### When to Ask for Clarification

**ALWAYS ask if:**
- Request is ambiguous or unclear
- You're unsure about scope
- You're unsure about language to use
- You notice inconsistencies
- You think additional changes might be needed

**How to Ask:**
- Be specific about what's unclear
- Provide options if possible
- Wait for explicit answer before proceeding

**Example:**
> "I see the request is to 'fix the form'. Do you mean:
> 1. Fix validation errors?
> 2. Fix styling/layout?
> 3. Fix functionality?
> Please clarify so I can make the correct changes."

---

## 🎯 Summary: The Golden Rules

1. **Never change what wasn't requested**
2. **Always get explicit approval**
3. **Default language is ENGLISH**
4. **When in doubt, ASK**
5. **Document everything**
6. **Test your changes**
7. **Respect previous decisions**

---

## 📄 Document History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-05-21 | Initial document creation | AI Assistant |

---

**Questions or Clarifications?**

If you have questions about these rules, contact the project owner before proceeding with any work.

**Remember:** It's better to ask and be sure than to make unauthorized changes and cause problems.
