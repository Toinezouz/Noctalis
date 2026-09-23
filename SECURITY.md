# Security policy

## Reporting a vulnerability

**Please do not open a public issue for a security problem.** Issues are
visible to everyone, including anyone who might want to exploit the problem
before it is fixed.

Use **GitHub Security Advisories** instead: the *Security* tab of the
repository, then *Report a vulnerability*
([direct link](https://github.com/Toinezouz/Umbrastra/security/advisories/new)).
It opens a private discussion with the maintainer and lets us publish an
advisory once the fix is live.

## What helps

- a description of the problem and its impact;
- the steps to reproduce it;
- the version or commit concerned;
- a suggested fix, if you have one.

## What you can expect

| | |
| --- | --- |
| Acknowledgement | within 72 hours |
| First assessment | within 7 days |
| Fix | as soon as possible, depending on severity |

The project is maintained on a volunteer basis: these delays are a promise
made in good faith, not a service contract.

You will be credited in the advisory unless you prefer to stay anonymous. The
project offers no financial reward.

## Scope

The heart of UMBRASTRA is a **confidentiality property**: nobody must ever be
able to learn the numbers of their own stars, by any means.

We therefore treat as vulnerabilities, first and foremost:

- any leak of a player's secret stars to that player — in the DOM, local
  storage, a WebSocket frame, an HTTP answer or the logs;
- any way to play in someone else's place, or out of turn;
- any hint answer that is not recomputed by the server;
- any way for an outsider to take over a game;
- any denial of service an ordinary client can trigger.

Out of scope: problems that require physical access to a player's machine,
and information people choose to share with each other.

## Supported versions

Only the `main` branch and the current deployment are supported.
