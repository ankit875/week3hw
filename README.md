# Week 3

```
npx ts-node --files ./scripts/GiveVotingTokens.ts 0x23F7810F801B265Aaf9106596bE3B750CCe9DB92 0x996A5ed069A393F0b25A08f3212F619D801bA110 20
```

Tx hash: `0x6c7be109a7a7e27e2b65fe101731f70b036742b85082658ab42ec53c53e7e502`

```
npx ts-node --files ./scripts/DeployBallotContract.ts 0x23F7810F801B265Aaf9106596bE3B750CCe9DB92 5606297 chocolate vanilla potato strawberry onion
```

TokenizedBallot contract deployed to: `0x4fc2e79612edd73a315666d9afb05fd88e19659d` Transaction hash: `0x29c609984c18e370bcf4c795dd0d875eb6d6c3c8e43b56416f2dea8d8d6d7b28`

Delegate:

```
npx ts-node --files ./scripts/DelegateToken.ts 0x23F7810F801B265Aaf9106596bE3B750CCe9DB92 0x996A5ed069A393F0b25A08f3212F619D801bA110
```

Delegation receipt: `0xd8f7c9e87e7d6ab2d1e46fa8959f83a92a801a63245f07ee482a0c669d360dd7`
