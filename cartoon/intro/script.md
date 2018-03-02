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
   * they may have incentives that don't align with yours, or
   * they may not have the resources or skills to perform their role perfectly, or
   * they may not have the resources or knowledge to handle your information adequately
* Worse still, even the most security conscious companies can be hacked or compromised
* And how does the average user know whom to trust? Or convince other people to trust them?

There are entire industries dedicated to helping people, companies and governments to:
* make themselves trustworthy 
* to convince you to trust them, and to
* regain their security and reputation after a breach 
  
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
   
All voters know these parameters. 

1. Participants then privately register their intent to vote and the registration authority acts as a gatekeeper.
Each voter knows if they were registered, but they have to trust that
   * all eligible voters were registered
   * only eligible voters were registered
   * nobody was registered multiple times

1. During the voting phase, the administration body authorises potential voters.
Each participant knows if they were granted access, but once again, they have to trust that:
   * all registered participants were authorised
   * only registered participants were authorised
   * nobody voted multiple times

1. After submitting their vote, each participant has to trust that:
   * nobody could see their vote
   * their ballot is untraceable

1. Then the votes are gathered at a counting station, and everyone has to trust that:
   * no legitimate votes were lost or excluded
   * no forgeries were added
   * no votes were modified on the way

1. Finally, the votes are counted, and everyone has to trust that:
   * all votes were identified correctly
   * the final total was calculated and reported correctly

Here is a summary of the process (show the table on screen).

The Verifiable Voting system is designed to remove trust requirements. 

However, there is one exception: a central authority is still used to register voters.
In some cases, whether or not they approve legitimate voters may be verifiable. 
Nevertheless, they must be trusted:
   * not to register illegitimate voters, and
   * to protect their cryptographic keys so other people can't register illegitimate voters.

There are complicated ways to mitigate or eliminate this requirement, but as it stands, the Verifiable Voting scheme
still relies on trust at this step.

But everything else is either in control of the voter, or verifiable to the voter. 
Specifically, voters do not need to trust that:
   * all registered participants were able to vote, and
   * only registered participants were able to vote
   * nobody voted multiple times, and
   * all votes remain anonymous, and
   * votes were not forged, modified or lost, and
   * votes were recorded correctly, and
   * the results were calculated and reported correctly
   
## Convenience

As an added bonus, it is extremely convenient and cheap without compromising security:
* Anyone can deploy a vote, poll or survey within minutes
* Participants can vote from any internet-connected device, anywhere in the world
* The results are calculated instantly, and are guaranteed to be correct

## Close

So there you have it: 100% of Earthlings intend to use this scheme whenever they vote - from simple polls to national elections.

Try it out at the link on the screen, or join me in the next video where we will discuss the underlying technology.
