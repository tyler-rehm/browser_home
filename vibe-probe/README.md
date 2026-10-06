# Disposable probe

This branch is not for merge. Each file below is an intentional hit for one signed vibe check.
Delete the branch and the pull request after the artifact is verified.

V055 has no file. `.github/dependabot.yml` is removed and the `npm audit` CI step is removed, so the advisory check is absent.
V098 is the root `engines.node` of `>=30` while CI still runs Node 22, 24, and 26.
