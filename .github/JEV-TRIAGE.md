# Jev issue triage

The **Triage issues with Jev** workflow runs when an issue is opened. It sends the issue title and body, plus a short repository description, to TypeSafe's hosted Jev API. It asks two independent Choice questions in one request: the issue category and the worker for the requested task. It does not send repository files or comments.

| Jev category | GitHub label |
| --- | --- |
| Documentation | `documentation` |
| Bug report | `bug` |
| New feature or enhancement | `enhancement` |
| Unclear, unrelated, or confidence below 0.7 | `needs-triage` |

A bug label classifies a report; it does not verify the bug. Confidence is a statistic derived from the probability distribution, not a measured accuracy percentage. The initial 0.7 threshold is provisional and should be evaluated against real maintainer decisions.

## Agent routing

| Work required | Agent label |
| --- | --- |
| 3D, 2D game design, image generation, game development and runtime debugging, 3D animations, Blender models/animations, computer use, or visual work requiring spacing and spatial understanding | `agent:codex` |
| Other complex programming, architecture/project structure, databases, infrastructure, frontend or backend implementation | `agent:claude` |
| Clearly small, routine work such as typos, brief documentation corrections, supplied copy changes, and mechanical edits | `agent:claude-haiku` |
| No actionable task, insufficient information, invalid routing response, or agent confidence below 0.7 | `needs-agent-triage` |

These are the owner's routing preferences. Required Codex specialties take precedence in mixed tasks, even when the task includes backend work or only a small spatial fix. A typo in Blender documentation is routine text work for Haiku; a new facial expression or attachment offset is Codex work. Ordinary web forms and backend APIs go to Claude even though this is a 3D repository. Direct browser/computer operation goes to Codex even without source-code changes. Vague tasks are never assumed to be suitable for Haiku.

Category and routing decisions have separate confidence thresholds. A routing failure or uncertain agent does not discard a valid category; an uncertain category does not discard a clear agent decision. Existing `agent:*` labels are preserved, including choices made during inference. Rerunning an unassigned issue can resolve and remove `needs-agent-triage`.

The factory already recognizes these three `agent:*` labels. Jev only selects the worker type; it does not launch a worker. Wait for triage and resolve `needs-agent-triage` before adding `ready` yourself. The factory's existing default-worker behavior is unchanged if no agent label is set.

## Configuration

- Add a repository Actions secret named `TYPESAFE_API_KEY` with your TypeSafe API key. Never put the key in source files.
- Ensure `documentation`, `bug`, `enhancement`, `needs-triage`, `agent:codex`, `agent:claude`, `agent:claude-haiku`, and `needs-agent-triage` exist as repository labels.
- The workflow must be on the default branch. Change `JEV_MODEL`, `JEV_CONFIDENCE_THRESHOLD` (category), and `JEV_AGENT_CONFIDENCE_THRESHOLD` (routing) in the workflow to select a pinned model version or tune thresholds. Both thresholds initially use 0.7; the initial model is `jev-latest`.

The workflow only adds allowed category and routing labels and removes the corresponding fallback label when a later manual run resolves it. Existing category and agent labels are respected independently, other labels are preserved, and it never adds `ready` or starts the software factory. It rechecks the issue after inference and skips label changes if its text or open state changed. It does not automatically reclassify edited issues.

Every processed open issue receives a GitHub Actions bot comment with the suggested category and agent, separate raw confidence scores and percentages, both probability distributions and thresholds, and the actual labeling outcomes. Expand the request section to inspect the exact JSON context, instructions, criteria, and requested model sent to Jev. Expand the response section for the full parsed JSON, including the resolved model and token usage. Authentication headers are excluded and exact API-key matches are redacted. Unusually large payloads are explicitly marked as truncated to fit GitHub's comment limit.

Reruns update the existing bot report instead of creating duplicates. Even an issue with an existing category receives a report; its label is preserved. If no API call could be made or no JSON response was received, the comment says so rather than inventing a confidence score. A failed label update also leaves a report explaining the failure.

API/network errors get bounded retries; persistent failures add `needs-triage` where the category is missing and `needs-agent-triage` where an agent is missing, and mark the run failed. Empty input or more than 16,000 combined title/body characters goes directly to these fallback labels. Logs contain the selected labels and confidence, without the issue text or key. The Actions summary contains the same detailed report as the comment. All issue content is passed as JSON data; it is never inserted into shell commands or evaluated as code.

## Try it

Open **Actions → Triage issues with Jev → Run workflow**, enter an issue number, and leave **dry_run** checked. This also works on closed or already labeled issues and makes no label or comment changes. Inspect the run summary to preview the entire report. Uncheck **dry_run** to classify an open issue and publish its report; category and agent labels are only added when their respective dimension is missing. This can also route an older issue that already has a category.

Run `npm run check:triage` for dependency-free tests of category/agent selection, independent thresholds, retries, dry runs, input handling, and preservation of human changes. Run `npm run check:triage:live` with `TYPESAFE_API_KEY` in your environment for 17 live examples across all three agents, mixed work, routine text changes, and uncertain tasks; this uses the paid API but does not write to GitHub. The original category examples remain checked; copy-only and direct-computer-use examples check agent routing without forcing a category. These examples are smoke tests, not an accuracy benchmark. The repository initially had only one historical issue, with no category label, so there is not yet a labeled evaluation set.

References: [TypeSafe Choice](https://docs.typesafe.ai/primitives/choice), [TypeSafe confidence](https://docs.typesafe.ai/confidence), [GitHub issue events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#issues).
