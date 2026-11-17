---
title: "Designing payment flows that can be retried"
description: "A draft on idempotency, webhook verification, and keeping payment state consistent across retries."
draft: true
readTime: "6 min read"
tags: [payments, reliability]
---

Payment systems have to expect repetition. A network can fail after a provider accepts a request, and a webhook can arrive more than once. Treating every delivery as a new event makes duplicate work likely.

In the SimFree backend, payment webhooks use an eight-day idempotency window. That detail sits beside verification and catalog caching: a provider event should be checked, recorded, and applied in a way that remains safe if the same event is seen again.

A useful starting point is to give each provider event a stable identity, verify its signature before changing state, and make the state transition conditional on what the system has already recorded. Retries then become a recovery path rather than a second payment.

> Editorial note: this is an unpublished draft based on project notes. Review it before publishing.
