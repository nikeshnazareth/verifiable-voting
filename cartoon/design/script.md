# Design and Security

## Title

Welcome. This is the third video in this series, where we will cover the design of the Verifiable Voting scheme.

This video will rely heavily on the technology and concepts introduced in the previous video, so please watch that one first if you haven't already.

We will first briefly outline the process, before discussing some security considerations.

## Outline

Anyone can declare a poll, survey or election, by writing the parameters to the blockchain.
In addition to the topic, timeframes and eligibility criteria, the organiser must also choose a Registration Authority, and publish its Verification Key.

Voters initiate registration by
* creating an anonymous Ethereum account
* RSA blinding it,
* and publishing it, along with proof of their eligibility

The Registration Authority first validates that the voter is eligible and has not yet registered,
and then signs their RSA blinded address, publishing the result.

Once all voters are registered, they each have a single anonymous address that was signed by the Registration Authority.
Importantly, the anonymous address was sealed before publication, so nobody else, not even the Registration Authority can map addresses to voters.

Then, they simply use that address to publish their vote, along with the signature that proves they are authorised.

Finally, everyone can independently count the votes and determine the result.

## Security

### Eligibility vs Registration

The specific eligibility criteria and approval process are intentionally not specified. Some simple cases are provided as options, but more complex criteria can easily be integrated.

One important principle to consider when designing custom criteria is that identifying eligible voters, and registering those voters are two distinct activities, and should be isolated from each other.

In many cases, the voter approval process can be public and transparent, which means it can be verified entirely on the blockchain. This also means that the system can be reused for multiple votes.

Crucially, it also constrains the role of the trusted registration authority to simply reading the blockchain and signing the relevant RSA blinded addresses, which limits the scope of potential vulnerabilities.

### Refreshing signing keys

Another consideration is that RSA blinding should be used carefully, since it is risky to sign something without reading it.
To mitigate this, the registration authority should ensure the signature is not binding in any other context,
which is easily achieved by generating a new signing and verification key for each vote.

With this precaution, a user who blinds anything other than an anonymous address does not gain anything from the signature.

### Voting models

The last security consideration we will explore is the effect of different ways of casting votes.

It may have occured to you that the system, as described, allows anyone to track the votes as they are cast.
This means that a voter can see the running total before deciding how to vote.

If this is undesirable, there are two alternatives that can be chosen by the vote organiser, each relying on a different cryptographic technique.

#### Asymmetric Encryption

The first technique is known as asymmetric encryption, which allows someone with a cryptographic lock, to seal a message that can only be opened by someone with the corresponding cryptographic key.

In the context of this scheme it would work as follows:
* Before declaring the vote, the organiser would choose a trusted Vote Authority to hold the key.
* They would then publish the lock to the blockchain
* All voters lock their vote before submitting it. This ensures it remains private.
* After the vote, the Vote Authority publishes the key, which allows everyone to open the locks and count the votes.

The main disadvantage of this scheme is the introduction of a Vote Authority, who now must be trusted not to read ( the still anonymous ) votes as they are cast, or to reveal them to anyone. They must also be trusted to publish the key.

#### Hash Commitment

The second technique is known as a hash commitment, where a voter can publish an irreversible fingerprint of their vote.

This proves that they chose their vote before creating the fingerprint.

When the voting phase ends, the voters can then publish their actual vote, which must match the commitment to be considered valid.

The main disadvantage is that this requires an extra phase, and voters need to remember and secure secret values between the phases. However, it retains the principle that voters are in control of their votes.


## Close

Join me in the next video, where we will discuss some technicalities of the system.

















