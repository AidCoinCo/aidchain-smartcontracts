# AidChain Platform Smart Contracts

[![Build Status](https://travis-ci.org/AidCoinCo/aidchain-smartcontracts.svg?branch=master)](https://travis-ci.org/AidCoinCo/aidchain-smartcontracts) 
[![Coverage Status](https://coveralls.io/repos/github/AidCoinCo/aidchain-smartcontracts/badge.svg?branch=master)](https://coveralls.io/github/AidCoinCo/aidchain-smartcontracts?branch=master)
 
Website: [www.aidchain.co](https://www.aidchain.co)

 
## Installation


Install truffle.

```bash
npm install -g truffle      // Version 4.1.13+ required.
```

Solidity version used: 0.4.24



## Install dependencies


```bash
npm install
```



## Linter


Use Solium

```bash
npm run lint:sol
```

Lint and fix all

```bash
npm run lint:all:fix
```



## Compile and test the contracts.
 

Open the Truffle console

```bash
truffle develop
```

Compile 

```bash
compile 
```

Test

```bash
test
```



## Run server


Run the `liteserver` development server.

```bash
npm run dev
```



## Optional


Install the [truffle-flattener](https://github.com/alcuadrado/truffle-flattener)

```bash
npm install -g truffle-flattener
```
 
 
Usage 

```bash
truffle-flattener contracts/CharityProject.sol >> dist/CharityProject.dist.sol
```
