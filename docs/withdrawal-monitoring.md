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

The withdrawal process follows these sequential phases, each with specific timing constraints:

1. **Withdrawal Initiated**: User submits withdrawal transaction on L2
2. **Batch Inclusion**: Transaction included in L2 batch
3. **L1 Batch Submission**: Batch submitted to L1 (up to `batchSubmissionFrequency` delay)
4. **Output Root Proposal**: Output root proposed on L1 (up to `outputRootFrequency` delay)
5. **Challenge Period**: Security waiting period (`challengePeriod` duration)
6. **Withdrawal Ready**: User can complete withdrawal on L1

> **Note**: The actual timing may vary based on network conditions, gas prices, and sequencer behavior. The `batchSubmissionFrequency` and `outputRootFrequency` represent maximum delays.

```mermaid
graph TD
    A[User Initiates Withdrawal] --> B[Transaction Included in L2 Block]
    B --> C[Batch Submitted to L1]
    C --> D[Output Root Proposed]
    D --> E[Challenge Period Starts]
    E --> F[Challenge Period Ends]
    F --> G[Withdrawal Available]

    %% Timing constraints
    C -.->|Up to batchSubmissionFrequency delay| D
    D -.->|challengePeriod duration| F

    %% Styling
    classDef userAction fill:#e1f5fe
    classDef l2Action fill:#f3e5f5
    classDef l1Action fill:#e8f5e8
    classDef securityAction fill:#fff3e0
    classDef finalAction fill:#fce4ec

    class A userAction
    class B,C l2Action
    class D l1Action
    class E,F securityAction
    class G finalAction
```

### Timing Diagram

The following diagram shows a typical withdrawal timeline with realistic timing:

```mermaid
gantt
    title Withdrawal Timeline (Typical Values)
    dateFormat X
    axisFormat %s

    section L2 Processing
    Transaction Included    :done, t1, 0, 2
    Batch Submission       :done, t2, 2, 4

    section L1 Processing
    Output Root Proposed   :done, t3, 4, 6

    section Security
    Challenge Period       :active, t4, 6, 18

    section Completion
    Withdrawal Available   :milestone, t5, 18, 18
```

**Timing Breakdown:**
- **L2 Processing**: ~2-4 seconds (immediate block inclusion)
- **Batch Submission**: Up to `batchSubmissionFrequency` (typically 1440s = 24 minutes)
- **Output Root Proposal**: Up to `outputRootFrequency` (typically 240s = 4 minutes)
- **Challenge Period**: `challengePeriod` duration (typically 120s = 2 minutes)
- **Total Expected Delay**: `expectedWithdrawalDelay` (typically ~26 minutes)

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
- `challengePeriod`: Challenge period duration (seconds) - Security delay for dispute resolution
- `batchSubmissionFrequency`: Batch submission interval (seconds) - Maximum time between L2→L1 batch submissions
- `outputRootFrequency`: Output root submission interval (seconds) - Maximum time between output root proposals

**Configuration Location:**
These parameters are now located in the `withdrawalConfig` object within the rollup metadata, making them easier to find and manage alongside other withdrawal-related settings.

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