# Review connection contract

Approved 2026-09-04 in session `ses-7055a4076ef0f52a-7d1a9159`, packet `pkt-a138c678-8b25-40d0-b40c-ec944fd6f187`: Chrome launching plus the Codex review guard, including validated personal installation and reversible hook setup. This authorizes local implementation and installation, not public publication or Git provider mutations.

## Behavior

- Explicit Chrome selection uses a named local browser executable and separate arguments. A persisted local preference is optional; the OS default remains available. Launch errors are reported with a recovery URL and do not discard the review or terminate its feedback wait. Launch acceptance is not proof that a tab is visible.
- A Codex command binds its exact task identifier to the exact Blueprint session. Existing reviews become guarded only when explicitly opened or reattached. Another task cannot take that binding or consume its feedback. The hook must never infer ownership from a shared directory.
- One live CLI waiter owns each review in the local service. Concurrent waits fail before delivery; a dead process is recoverable. A restarted service accepts the surviving waiter again. Wait requests name the exact session and cannot drift to a newer review of the same file.
- Quiet long polls continue. Recoverable transport failures retry with a bound and rediscover the service. Nonrecoverable failures retain durable feedback and give a recovery command. Approval is delivered and acknowledged before an ended review is considered complete. End review without queued feedback returns a distinct terminal result, never approval.
- A short, opt-in Codex Stop hook reads only task-owned review state. Active reviews, staged revisions, and undelivered terminal feedback require continuation. It returns a concrete instruction to resume the existing tool session or reattach once. Three continuations without review progress exhaust automatic recovery and surface an explicit blocker; they never approve or implement anything.
- An Interrupt hook suspends that task's guard. Only an explicit subsequent Blueprint launch/reattachment re-arms it. Hooks do not override user interruption, app exit, permissions, or unavailable capacity. An absent or untrusted hook cannot enforce continuation; setup status distinguishes configured hooks from trusted execution.
- Sidecar connection/guard records are agent integration state, contain no capabilities or draft content, and do not change packet, report, or portable HTML schemas. Review content remains untrusted. No artifact text enters automatic continuation prompts.
- Codex setup adds/removes only Blueprint-owned SessionStart, Stop, and Interrupt handlers. Claude's existing integration remains unchanged. npm installation alone never edits agent configuration.

## Verification

Required checks cover browser selection and argument integrity, launch failures with retained waits, quiet polling, queued approval and End review, separate task ownership, duplicate and dead waiters, exact-session boundaries, restart recovery, early stops before and after staging, explicit interruption, bounded continuation, and preservation of queued/private feedback. Test hook JSON independently and observe a real trusted Codex guard cycle before claiming personal enforcement works.

Source: [official Codex hooks](https://learn.chatgpt.com/docs/hooks), read 2026-09-04. The current host reports Codex 0.153.1 and supplies matching CODEX_THREAD_ID/CODEX_SESSION_ID values. Changed hooks require Codex trust review.
