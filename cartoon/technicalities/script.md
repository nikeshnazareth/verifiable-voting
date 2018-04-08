+# Technicalities

## Title

Welcome. This is the fourth and final video in this series, where we will cover some technicalities of the verifiable voting scheme.

The previous videos explained how the system works conceptually. 

This one describes some implementation challenges, including why the system is not yet operational.

## Interaction Fee

In particular, there are two important constraints of the Ethereum blockchain.

The first is that there is a small fee associated with every interaction, denoted in Ether, the native crytocurrency of Ethereum.

Currently, this fee must be paid using the account that creates the record, which means the anonymous accounts must obtain Ether before voting.

Unfortunately, all plausible mechanisms for transferring Ether to the account are undesirable:
* The voter could request Ether from a faucet, which is someone who will donate small amounts of Ether to anyone. 
  This is only convenient and scalable on the test network.
* The voter could transfer funds from a separate account to the anonymous one. 
  However, this publicly associates those accounts with each other, destroying anonymity.
* The organiser could establish a separate process for anonymous accounts to prove their authorisation and request funds, 
  but this weakens the guarantee that all authorised voters were able to vote.

As the technology matures, it will become possible for the organiser to directly pay the fees on behalf of the voters.

It will also become possible to leverage the blockchain's security without directly interacting with it.

Either option will preserve anonymity and security.

Until then, the verifiable voting scheme only runs on the test network, which undermines any security guarantees.

## Storage Fee

The second constraint is that there is a large fee associated with storing data on the blockchain.

Once again, as the technology matures, the storage fees will be reduced, and possibly eliminated. 

Nevertheless, it is still good practice to limit Ethereum data storage requirements.

To this end, the verifiable voting scheme uses the Interplanetary File System (IPFS).

### IPFS

IPFS is a decentralised storage system, where data can be downloaded from any participating computer that has it.

The data is identified and requested using a fingerprint, similar to the hash commitment described in the previous video. 

This means that instead of storing data on the Ethereum blockchain, the (much smaller) fingerprint can be stored instead, 
while the data itself is stored in IPFS.

As long as at least one active IPFS node has the data, it will remain retrievable.

Note that anyone in the world can host a node, including the voters and vote organiser, if they want to ensure data availability.

### Security

It is worth noting that there is an obscure vulnerability introduced by IPFS. 

It is possible for someone to publish an IPFS fingerprint to Ethereum, without publishing the corresponding data to IPFS. 

This will result in users being unable to retrieve the data, and likely ignoring it.

From a strictly record-keeping perspective, this situation is indistinguishable from one in which a user simply 
disregards votes that they don't like, while claiming they were never published.

Given the extreme transparency of the scheme, the truth will almost always be obvious from other considerations, 
such as whether other people could retrieve the data.

However, a well coordinated effort might leave room for uncertainty. 

This is not an attack on the actual voting procedure, since any missing records will be restored whenever the data becomes public,
but it may be an attack on the reputation of some participants.

This can be mitigated with additional transparency requirements (such as publishing IPFS logs), 
but is likely unnecessary in most cases.

## Close

That concludes this video series.

Follow the link on the screen to try out the system.


