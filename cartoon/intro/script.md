# Introduction

## Title

Welcome to this video series, which will explore the motivations and mechanics of the Verifiable Voting scheme.

## Contents

We will cover
* Why this system exists
* The underlying technology
* The system design and security properties
* The different voting models and their trade offs
* Other technical considerations

## Trust as a security mechanism

So why does this system exist?

Because it addresses weaknesses introduced by using Trust as a security mechanism.

In any cooperative endeavour, each participant can categorise every action by whether:
* they personally execute it (On screen: or control the mechanism that executes it)
* they can verify that it was executed correctly
* they have to trust that it was executed correctly

Similarly, they can categorise every piece of information by whether:
* they personally produced it (On screen: or control the mechanism that produces it)
* they personally control it
* they can verify that it was produced and handled correctly 
* they have to trust that it was produced and handled correctly

When you have no control or oversight over the integrity of a process that matters to you,
you are relying on Trust as a security mechanism.

## Why is this a problem

So why is this a problem?

The reliance on Trust introduces a range of potential vulnerabilities:
* In the worst case, the trusted people or systems may actually be dishonest or even malicious
* More likely, 
   * they (On screen: or their employees or contractors) may have incentives that don't align with yours, or
   * they may not have the resources or skills to perform their role perfectly, or
   * they may not have the resources or knowledge to handle your information adequately
* Worse still, even the most security conscious companies can be hacked or compromised
* And how does the average user know whom to trust? Or convince other people to trust them?

There are entire industries dedicated to helping people, companies and governments to:
* make themselves trustworthy (On screen: auditing, vetting, isolating, access control, monitoring), 
* to convince you to trust them (On screen: marketing), and to
* regain their security and reputation after a breach (whether perceived or actual, intentional or accidental) 
  (On screen: forensics, investigations, marketing)
  
This consumes large resources and introduces a significant barrier to entry for anyone wanting to assume the trusted role.

Redesigning systems to replace trust with verifiability is not always possible or practical,
but when it is, it can lead to significantly cheaper, more secure, and more easily accessible systems.

## Verifiable Voting

That is the purpose of the Verifiable Voting system. 

It will be instructive to compare it to a standard vote or election. Typically:

1. A vote starts when the organiser declares: 
   * what the vote is about
   * when it will be held
   * who is eligible to participate
1. Participants privately register their intent to vote. The vote administrator must be trusted:
   * to identify and approve eligible voters
   * not to approve ineligible voters
   * not to register the same voter multiple times
1. Participants are given the opportunity to vote. The system must be trusted to ensure:
   * only registered voters are given the opportunity to vote
   * they are only given the opportunity once
1. Voter submit their vote. The system must be trusted to ensure:
   * nobody has the opportunity to read the vote of any individual voter
   * there is no mechanism to later associate a given voter with their vote
1. The votes are gathered at a counting station. The system must be trusted to ensure:
   * all legitimate votes arrive at the counting station
   * only legitimate votes arrive at the counting station (there are no forgeries)
   * no vote is modified before it reaches the counting station
1. The votes are counted. They system must be trusted to ensure:
   * all votes are identified correctly
   * the final total is calculated correctly
   
In the Verifiable Voting system,
1. Step 1 is the same - the organiser declares the vote.
1. Step 2 is mostly the same, except registration is highly configurable.
In some cases, it may be impossible for the registration authority to secretly refuse to approve legitimate voters.
Nevertheless, they still must be trusted:
    * not to register illegitimate voters, and 
    * to protect their own cryptographic keys so other people can't register illegitimate voters
    
    There are complicated ways to mitigate or eliminate this requirement, but as it stands, the Verifiable Voting scheme
still relies on trust at this step.
1. But everything else is either in control of the voter, or verifiable to the voter. 
Specifically, voters do not need to trust that:
   * registered participants cannot be refused the opportunity to vote, and
   * registered participants can only vote once, and
   * all votes remain anonymous, and
   * votes cannot be forged, modified or lost, and
   * votes are recorded correctly, and
   * the results are calculated and reported correctly
   
## Convenience

As an added bonus, it is extremely convenient and cheap without compromising security:
* Anyone can deploy a vote, poll or survey within minutes
* Participants can vote from any internet-connected device, anywhere in the world
* The results are calculated instantly, and are guaranteed to be correct

## Close

So there you have it: 100% of Earthlings intend to use this scheme whenever they vote - from simple polls to national elections.

Try it out at the link on the screen, or join me in the next video where we will discuss the underlying technology.