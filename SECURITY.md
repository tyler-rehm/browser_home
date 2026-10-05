# Security policy

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability. Use GitHub private vulnerability reporting:

https://github.com/tyler-rehm/browser_home/security/advisories/new

Include reproduction steps, affected versions, and impact. Allow time for a fix before public disclosure.

## What this homepage protects

The production server binds to `127.0.0.1`, allows only the documented Host values, and serves files from the build directory. Responses set a content security policy, `nosniff`, a framing denial, and a no-referrer policy. `style-src` allows inline styles because theme colors and dialog positioning set element styles. That is not a strict style policy.

## What it does not protect

Loopback binding is not authentication. Another process on this Mac, a malicious extension, or a compromised operating system can still reach the page. Local storage is origin-bound and not encrypted. The server does not add HSTS because the origin is plain HTTP. Automated scans, including CodeQL and `npm audit`, are review input, not a security guarantee.

## Data

Links, notes, and appearance stay in the browser for `http://127.0.0.1:4173`. Search and link clicks are the user leaving that origin. The app does not send the scratchpad or backups anywhere.
