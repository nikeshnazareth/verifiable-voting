# Verifiable Voting

## Project no longer being updated

This project was intended to help me build the skills and integrate the
technologies required to create and explain a moderately complex Ethereum dapp.
It has achieved that purpose.

This app:
* Exercises all the features of Solidity, including contracts that deploy each other,
  inherit from each other, and change execution paths depending on the state of
  other interchangeable contracts
* Tests all the contracts
* Stores all the data on my personal IPFS node
* Reads and interacts with the contracts and with IPFS through a browser
* Uses Angular and RXJS to propagate and manipulate events.
* Tests the frontend
* Uses cryptography in interesting ways to achieving anonymity on a
  public blockchain.
* Contains a video series explaining how it all works

It does not use any Layer 2 technologies ( but my next project will ).

There are many things still to be done to extend the functionality and
improve the security and user experience, but none of those things are likely to
teach me anything new.

Nevertheless, I may return to this project at a later date.

The code is under the MIT licence, but if anyone would like to build on it,
I will reiterate the disclaimer from the first explanatory video:

> Hopefully obvious disclaimer: all the claims made in this video series are accurate,
> but the entire project is one guy's effort to learn and practise the skills required
> to design, build and explain a moderately complex security system.
> It does not cover many aspects (such as securing the user's personal machine,
> ensuring connectivity to the right nodes, coercion resistance, etc.)
> that would need to be considered in a critical deployment.

> Security is hard, especially for online voting systems, and there are rivers of
> academic ink devoted to getting it right. Don't be the person who makes important
> decisions based on a random video that says the word "blockchain"

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