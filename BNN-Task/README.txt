# Distributed Neural Network
## Theta task - Hackaton 2020

## Introduction
This is an example that uses the Theta network to distribute workloads, in particular
Neural Network (NN) training, among multiple edge computing nodes. IPFS is used to share
hashes and data to verify the task has been accomplished and make it immutable.

This task can be found in the IPFS hash [QmR5JRNaxvxQtnxkoK1qb4L65yUDUfRgyYT4JQgEH8WN9x](https://explore.ipld.io/#/explore/QmR5JRNaxvxQtnxkoK1qb4L65yUDUfRgyYT4JQgEH8WN9x)

## Background

Blockchain technologies have revolutionized different industries and impacted the lives of millions around the world. The most common use case for Distributed Ledger Technology (DLT) is the transfer of value from one account to another, solving the problems like the Byzantine fault or Double Spending with a network of computers spread around the world.

The second blockchain generation enabled digital asset programmability within its network, bringing tokenomics and NFT. However, data processing and storage within those systems remained limited.

The Theta Network, a third-generation blockchain, enables decentralized data delivery with high transaction throughput using distributed nodes, with video streaming at its core functionality. Thanks to Smart Contracts and theta nodes' technical requirements, it is possible to deploy the first proof-of-concept Theta Edge Marketplace.

## Stage 1

Of the tasks listed on the Theta network, the hash is equal to the IPFS hash that
points to the "tar.gz" file that contains executable binaries for MacOS, Linux and
the instructions to follow.

This file can be downloaded from the webpage, also if you are running an IPFS daemon node:

```
ipfs get QmR5JRNaxvxQtnxkoK1qb4L65yUDUfRgyYT4JQgEH8WN9x -o ThetaTask.tar.gz
```

## Stage 2

Once the file is stored locally, it can be decompressed using the command:

```
tar zxvf ThetaTask.tar.gz
```

Preferably, untar this file within its own folder.

The uncompressed version will expand to the following:

- README.txt: This file, explaining all phases
- BiSUNA-Linux: Executable tested on Ubuntu 18.04
- BiSUNA-Darwin: Executable tested on MacOS 10.15
- TestCases/: Folder with test files used to verify the NN performance
- GenerateTestCases.ini: Configuration file needed in Stage 3
- DistributedPopulationCPA.ini: Configuration file needed to determine the type of
Neural Network to execute

The last file has all the configuration parameters needed to reach a "solved" state.
In case you have a multicore hardware, the value "ThreadNumber" must be updated
according to the number of threads such processor has. The default is "8".

In order to start solving the task, it is just about opening a terminal and run:

```
UNAMESTR=`uname`
nohup ./BiSUNA-$UNAMESTR DistributedPopulationCPA.ini > DistCPA-Exe-Log.txt 2>&1 &
```

nohup will continue the execution even if the terminal session ends. BiSUNA is the
NN algorithm. "OS" must be updated to match the operative system it will execute.
The "&" will execute this binary on the background.

## Stage 3

After few hours of training, the network will reach 100,000 "Generations", then
automatically stop and save the results. At this moment, several files have been
created with the extension "dat", these contain the information needed to recreate
the NN and encrypt data.

This stage will create the verification payload. There are two important files:

- Alice.dat: This is the NN that encrypts data
- Bob.dat: This is the NN that decrypts data

To verify these NN are fully synchronized to encrypt - decrypt data, the folder
"TestCases" will use both to read plain data, then use Alice to cypher that data,
store it, and then pass it through Bob to decrypt it. When the decrypted and plain
data are equal, then the cryptosystem is fully reversible.

To distinguish between agents, the quality of the cyphered data is analyzed, the
more "random" that data behaves, the better it is. Therefore, at this stage, you
will need to run the command:

```
./RunTestCases.sh
```

Which will generate the data needed to populate the folder "TestCases".

## Stage 4

Once NN training finishes, the output are several files that contain the base model
for an encryptor, a decryptor and an adversary. It is necessary to create a report
of the randomness score created by these agents using this command:

```
./AnalyzeLogAndTar.sh
```

That script will read all log files, create a summary and tar the necessary elements
that are going to be uploaded to IPFS.


## Stage 5

Once the report summarizes all test cases, it is time upload the tar the file to IPFS
manually as follows:

```
ipfs add ThetaResult.tar.gz
```

Optional: The user can modify the file name to distinguish you file from others. What
is used to differentiate between files and track submissions is the IPFS hash.

Once submitted using IPFS, you will need to send the hash for the tar file in DApp
the webpage, which will trigger the "commit" function in the smart contract.


## Stage 5

Once the task expiration schedule finishes, it will review all hash commit and
verify which was the one that found the most random network pair for the test case.

The NN with the highest entropy in the test case will be awarded with the TFUEL
stored in the contract. Every entry will be displayed in the leader board.
