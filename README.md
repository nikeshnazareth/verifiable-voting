# Verifiable Voting

## Overview

This repository is (yet another) electronic voting system based on Ethereum.

The main contribution is the use of RSA blinding to ensure voter anonymity.

A video series describing the process and security properties ( aimed at the intelligent layperson ),
as well as the current (incomplete) version of the system is available
[here](https://verifiable-voting.nikeshnazareth.com)

The videos will be uploaded to [d.tube](https://d.tube/) once the system is operational

## Properties of the system

The advantage of using Ethereum and RSA blinding for voting include:
* All the efficiency, convenience and precision gains of electronic voting
* Complete transparency and auditing of the voting procedure. In particular, voters can verify:
   * their own vote was counted
   * they remained anonymous throughout the procedure
   * all legitimate (defined on a case-by-case basis) voters were registered
   * all registered voters were able to vote exactly once
   * all votes were identified correctly and were tamper-proof
   * no fraudulent votes were added
   * the votes were counted correctly
* Using Ethereum also ensures a high level of availability and no single point of failure
(except for the registration authority, as explained below)
* Statistics about voter registration and participation are readily available, provably correct and transparent

The disadvantages include:
* There is a registration authority who must be trusted to:
   * register all legitimate voters that choose to participate
   * refrain from fraudulently registering illegitimate voters
   * protect their own cryptographic keys to prevent other people from registering illegitimate voters
* There is no coercion resistance: voters can prove who they voted for 
(and can therefore be coerced or bribed into voting a particular way)