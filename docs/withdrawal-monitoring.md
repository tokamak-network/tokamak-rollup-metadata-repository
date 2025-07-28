# Withdrawal Monitoring

A guide for implementing withdrawal delay monitoring for Tokamak rollups.

## Overview

The withdrawal monitoring system tracks withdrawal completion times by monitoring L2OutputOracle events and calculating expected delays based on rollup parameters.

## Core Monitoring Concepts

### Key Parameters to Monitor

Each L2 sequencer may have different values. Check your rollup's metadata for specific parameters:

- **Batch Submission Frequency**: Time between L2 batch submissions to L1
- **Output Root Frequency**: Time between output root proposals
- **Challenge Period**: Security delay before withdrawals can be finalized
- **Expected Withdrawal Delay**: Total time from withdrawal initiation to completion

### Withdrawal Time Calculation

```javascript
// Basic formula for withdrawal delay estimation
expectedWithdrawalDelay = Math.max(batchSubmissionFrequency, outputRootFrequency) + challengePeriod

// Example with typical values:
// max(1440, 240) + 12 = 1452 seconds (approximately 24 minutes)
```

### Monitoring Timeline Phases

1. **Withdrawal Initiated**: User submits withdrawal transaction on L2
2. **Batch Inclusion**: Transaction included in L2 batch
3. **L1 Batch Submission**: Batch submitted to L1 (up to batchSubmissionFrequency delay)
4. **Output Root Proposal**: Output root proposed on L1 (up to outputRootFrequency delay)
5. **Challenge Period**: Security waiting period (challengePeriod duration)
6. **Withdrawal Ready**: User can complete withdrawal on L1

```mermaid
graph TD
    A[User Initiates Withdrawal] --> B[Transaction Included in L2 Block]
    B --> C[Batch Submitted to L1]
    C --> D[Output Root Proposed]
    D --> E[Challenge Period Starts]
    E --> F[Challenge Period Ends]
    F --> G[Withdrawal Available]

    C -.->|Up to batchSubmissionFrequency| D
    D -.->|challengePeriod| F
```

## Essential Monitoring Methods

### 1. Event-Based Monitoring

Monitor the `OutputProposed` event from L2OutputOracle contract:

```solidity
event OutputProposed(
    bytes32 indexed outputRoot,
    uint256 indexed l2OutputIndex,
    uint256 indexed l2BlockNumber,
    uint256 l1Timestamp
)
```

### 2. Status Calculation Logic

```javascript
function calculateWithdrawalStatus(withdrawalL2Block, currentTime) {
    // Find relevant output root that includes this withdrawal
    const relevantOutput = findOutputForL2Block(withdrawalL2Block);

    if (!relevantOutput) {
        return {
            status: 'waiting_for_output',
            message: 'Waiting for output root proposal'
        };
    }

    const challengeEndTime = relevantOutput.l1Timestamp + challengePeriod;

    if (currentTime < challengeEndTime) {
        return {
            status: 'in_challenge_period',
            readyTime: challengeEndTime,
            remainingSeconds: challengeEndTime - currentTime
        };
    }

    return {
        status: 'ready',
        message: 'Withdrawal can be completed'
    };
}
```

### 3. Time Estimation Methods

```javascript
// Estimate when withdrawal will be ready (before output is proposed)
function estimateWithdrawalReadyTime(withdrawalTimestamp) {
    const maxBatchDelay = batchSubmissionFrequency;
    const maxOutputDelay = outputRootFrequency;
    const securityDelay = challengePeriod;

    return withdrawalTimestamp + Math.max(maxBatchDelay, maxOutputDelay) + securityDelay;
}

// Calculate precise ready time (after output is proposed)
function calculateExactReadyTime(outputL1Timestamp) {
    return outputL1Timestamp + challengePeriod;
}
```

## Data Requirements

### Rollup Metadata Structure

Your monitoring system needs access to these parameters from rollup metadata:

```json
{
  "withdrawalConfig": {
    "challengePeriod": 12,
    "monitoringInfo": {
      "l2OutputOracleAddress": "0x...",
      "outputProposedEventTopic": "0x..."
    },
    "batchSubmissionFrequency": 1440,
    "outputRootFrequency": 240
  }
}
```

**Key Parameters:**
- `challengePeriod`: Challenge period duration (seconds)
- `batchSubmissionFrequency`: Batch submission interval (seconds)
- `outputRootFrequency`: Output root submission interval (seconds)

### Required Contract Information

- **L2OutputOracle Address**: Contract address for monitoring output proposals
- **Event Topic Hash**: For filtering OutputProposed events
- **Challenge Period**: Duration in seconds
- **Batch/Output Frequencies**: For time estimation

## Implementation Considerations

### Real-time vs Polling

- **Event Subscription**: Real-time updates via WebSocket/subscription
- **Polling Method**: Periodic checks for new outputs and status updates
- **Hybrid Approach**: Events for new outputs + polling for status updates

### Status Categories

1. **waiting_for_output**: Withdrawal initiated but output not yet proposed
2. **in_challenge_period**: Output proposed, waiting for challenge period
3. **ready**: Challenge period complete, withdrawal can be finalized
4. **completed**: Withdrawal has been finalized on L1

### Error Handling

- Network connectivity issues
- RPC endpoint failures
- Contract call failures
- Event parsing errors

## Community Development Notes

- Values vary per L2 sequencer - always check specific rollup metadata
- Focus on withdrawal time calculation methods rather than full system implementation
- Community can build monitoring tools using these core concepts
- Actual delays may vary based on network conditions and gas prices