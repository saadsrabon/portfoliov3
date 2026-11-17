---
title: "Email imports need a recovery path"
description: "A draft about duplicate protection, quarantine, and replay in a mailbox sync workflow."
draft: true
readTime: "5 min read"
tags: [email, reliability]
---

Mailbox sync is not a one-time import. Messages can be retried, providers can return incomplete data, and an operator sometimes needs to understand why a record did not arrive.

The LeadPylot email service combines IMAP sync with Gmail OAuth, SMTP delivery, approvals, and inbound-email lead creation. Its import workflow includes duplicate protection plus quarantine and replay for failed imports.

Those pieces make failures easier to inspect and recover from. A quarantine keeps a problematic item from silently disappearing into the happy path; replay gives the system a deliberate way to try again after the cause is understood.

> Editorial note: this is an unpublished draft based on project notes. Review it before publishing.
