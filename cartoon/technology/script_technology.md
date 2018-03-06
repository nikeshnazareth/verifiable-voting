# Technology

## Title

Welcome. This is the second video in this series, where we will cover the technologies underpinning the Verifiable Voting scheme.

##  Ethereum

Let's start with the Ethereum Blockchain.

There are many interesting properties and claims about blockchains, which can be overwhelming for newcomers to the field.

For our purposes, we can narrow our focus, and consider the Ethereum Blockchain to be a public, tamper-proof and pseudononymous ledger.

### Public

Taking those one at a time, a public ledger simply means that anyone with an internet connection, anywhere in the world can write to it or read from it.

### Tamper Proof

Additionally, to a very good first approximation, all records are tamper-proof, which means that once written, they cannot be deleted or modified by anyone (not even by the original author)

This is, of course, not merely a description but a strong security claim that distinguishes Ethereum (and blockchains generally) from most databases.

If you're the kind of person who would watch this video, you might be wondering: why should I believe that claim? Or you might be curious about the potential traps and complexities hidden by the caveat.

A full explanation would be too long for this video, so instead I will simply point out that the security mechanism is completely content agnostic: all records that occur at the same time are equally malleable. This means that it is as easy to change a one million dollar transaction, as it is to change a one dollar transaction.

At the time of recording, the global population collectively relies on the tamper-proof mechanism to secure over 100 billion US dollars.

Of course, as we all know, "a public-opinion poll is no substitute for thought", so if you are not convinced, I encourage you to research how, and to what extent, Ethereum provides this feature.

### Pseudononymous

The last important property is that interactions are pseudononymous.

Every record must be added to the ledger with an Ethereum account, which is listed right next to the record. The account itself does not contain any identifying information, but any observer can see whenever the same account creates multiple records. Moreover, if someone knows the identity associated with one account, they may be able to leverage this with other external information to learn the identity of other accounts.

Fortunately, any user can create new accounts whenever desired.

So, if an individual creates a new account, uses it to add a record to the ledger, never uses it for anything else and never reveals it anyone - that account (and therefore that record) is truly anonymous, at least at the blockchain level.

## Voting

To return to the voting use case, if each voter simply creates a new account and writes their vote to the ledger, then all votes are public and tamper-proof, even though the voters themselves are anonymous. This means that anyone can verify the results.

However, there is still one major problem that needs to be solved: if anyone can create multiple anonymous accounts, how do we authorise the legitimate accounts without compromising anonymity?

## RSA Blinding

There is a cryptographic solution, known as RSA blinding. To understand it, we must first explain digital signatures.

A digital signature, unsuprisingly, is the digital equivalent of a signature, although much more secure: A single person or entity can sign any message in such a way that anyone with the public reference value ( known as the verification key ) can confirm that it was signed by the right person or entity.

RSA blinding is an extension of this mechanism, which allows someone (let's call him Bob), to sign a message provided by someone else (let's call her Alice), without actually knowing what he's signing. The protocol works like this:
* Alice creates the message that she wants Bob to sign
* She seals it in such a way that only she can open it, but Bob can sign it
* She gives Bob the sealed message
* Bob signs it and returns it to Alice
* Alice opens the message, retaining Bob's signature

## Close

Join me in the next video where we will walk through the steps of using these two technologies to create a verifiable voting system.
