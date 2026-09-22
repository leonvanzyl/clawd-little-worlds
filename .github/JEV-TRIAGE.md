# Jev issue triage

The **Triage issues with Jev** workflow runs when an issue is opened. It sends the issue title and body, plus a short repository description, to TypeSafe's hosted Jev API. It does not send repository files or comments.

| Jev category | GitHub label |
| --- | --- |
| Documentation | `documentation` |
| Bug report | `bug` |
| New feature or enhancement | `enhancement` |
| Unclear, unrelated, or confidence below 0.7 | `needs-triage` |

A bug label classifies a report; it does not verify the bug. Confidence is a statistic derived from the probability distribution, not a measured accuracy percentage. The initial 0.7 threshold is provisional and should be evaluated against real maintainer decisions.

## Configuration

- Add a repository Actions secret named `TYPESAFE_API_KEY` with your TypeSafe API key. Never put the key in source files.
- Ensure `documentation`, `bug`, `enhancement`, and `needs-triage` exist as repository labels.
- The workflow must be on the default branch. Change `JEV_MODEL` and `JEV_CONFIDENCE_THRESHOLD` in the workflow to select a pinned model version or tune the threshold. The initial model is `jev-latest`.

The workflow only adds an allowed category label and removes `needs-triage` when a later manual run resolves it. Existing category labels are respected, other labels are preserved, and it never adds `ready` or starts the software factory. It rechecks the issue after inference and skips writes if its text, open state, or category changed. It does not automatically reclassify edited issues.

API/network errors get bounded retries; persistent failures add `needs-triage` and mark the run failed. Empty input or more than 16,000 combined title/body characters goes directly to `needs-triage`. Logs and the Actions summary contain the selected label and confidence, without the issue text or key. All issue content is passed as JSON data; it is never inserted into shell commands or evaluated as code.

## Try it

Open **Actions → Triage issues with Jev → Run workflow**, enter an issue number, and leave **dry_run** checked. This also works on closed or already labeled issues and makes no label changes. Inspect the run summary for the result. Uncheck **dry_run** to classify an open issue that has no category label, including one currently marked `needs-triage`.

Run `npm run check:triage` for dependency-free tests of label selection, retries, dry runs, input handling, and preservation of human changes. Run `npm run check:triage:live` with `TYPESAFE_API_KEY` in your environment for six live example classifications; this uses the paid API but does not write to GitHub. These examples are smoke tests, not an accuracy benchmark. The repository initially had only one historical issue, with no category label, so there is not yet a labeled evaluation set.

References: [TypeSafe Choice](https://docs.typesafe.ai/primitives/choice), [TypeSafe confidence](https://docs.typesafe.ai/confidence), [GitHub issue events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#issues).
