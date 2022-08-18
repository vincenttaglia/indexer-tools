<template>
  <div>
    <v-stepper alt-labels non-linear v-model="currentStep">
      <v-stepper-header>
        <v-stepper-step
            editable
            :complete="currentStep > 1"
            step="1">
          Close Allocations
        </v-stepper-step>

        <v-divider></v-divider>

        <v-stepper-step
            editable
            :complete="currentStep > 2"
            step="2">
          Pick Subgraphs
        </v-stepper-step>

        <v-divider></v-divider>

        <v-stepper-step editable step="3" :complete="currentStep > 3">
          Set Allocations
        </v-stepper-step>

        <v-divider></v-divider>

        <v-stepper-step editable step="4">
          Execute Actions
        </v-stepper-step>
      </v-stepper-header>
      <v-stepper-content step="1">
        <IndexerCurrentState :indexer="indexer" selectable @allocations-selected="selectAllocations"/>
        <div class="mt-12 mb-10 ml-5">
          <v-btn
              color="primary"
              @click="currentStep++"
          >
            Continue
          </v-btn>
        </div>
      </v-stepper-content>

      <v-stepper-content step="2">
        <SubgraphsTable :indexingRewardCut="indexingRewardCut" :key="selectedAllocationsCount" :simulateClosingAllocations="selectedAllocations" @subgraphs-selected="selectSubgraphs" selectable />
        <div class="mt-12 mb-10 ml-5">
          <v-btn
              color="primary"
              @click="currentStep++"
          >
            Continue
          </v-btn>
          <v-btn
              text
              @click="currentStep--"
          >
            Back
          </v-btn>
        </div>
      </v-stepper-content>
      <v-stepper-content step="3">
        <AllocationSetter :indexing-reward-cut="indexingRewardCut" :subgraphs-to-allocate="selectedSubgraphs" :calculated-available-stake="calculatedAvailableStake" @allocations-update="updateNewAllocations" :allocations-to-close="selectedAllocations" :key="rerenderComponent" />
        <div class="mt-12 mb-10 ml-5">
          <v-btn
              color="primary"
              @click="currentStep++"
          >
            Continue
          </v-btn>
          <v-btn
              text
              @click="currentStep--"
          >
            Back
          </v-btn>
        </div>

      </v-stepper-content>
      <v-stepper-content step="4">
        <div class="mt-12 mb-10 ml-5">
          <v-textarea readonly :value="buildCommands"></v-textarea>
          <v-btn
              text
              @click="currentStep--"
          >
            Back
          </v-btn>
        </div>

      </v-stepper-content>
    </v-stepper>

    <v-stepper
        alt-labels
        class=""
        non-linear
        v-model="currentStep"
    >
      <v-stepper-header>
        <v-stepper-step editable step="1" :complete="currentStep > 1">
          Close Allocations
        </v-stepper-step>

        <v-divider></v-divider>

        <v-stepper-step editable step="2" :complete="currentStep > 2">
          Pick Subgraphs
        </v-stepper-step>

        <v-divider></v-divider>

        <v-stepper-step editable step="3" :complete="currentStep > 3">
          Set Allocations
        </v-stepper-step>

        <v-divider></v-divider>

        <v-stepper-step editable step="4">
          Execute Actions
        </v-stepper-step>
      </v-stepper-header>
    </v-stepper>
    <v-card height="500px">
      <v-footer
          :fixed="true"
          :padless="true"
      >
        <v-card
            flat
            tile
            width="100%"
            style="background-color: #5a3c57"
            class="text-center white--text d-flex flex-row align-content-center justify-center"
        >
          <v-card style="background-color: #5a3c57">
            <v-card-text>
              Closing Allocations APR:
              <h1 class="pt-2">{{ this.calculatedClosingAPR }}%</h1>
            </v-card-text>
          </v-card>
          <v-card style="background-color: #5a3c57">
            <v-card-text>
                Allocation Remaining:
                <h1 class="pt-2">{{ numeral(web3.utils.fromWei(web3.utils.toBN(this.calculatedAvailableStake))).format('0,0') }}</h1>
            </v-card-text>
          </v-card>

          <v-card style="background-color: #5a3c57">
            <v-card-text>
              Opening Allocations APR:
              <h1 class="pt-2">{{ numeral(web3.utils.fromWei(web3.utils.toBN(this.calculatedAvailableStake))).format('0,0') }}</h1>
            </v-card-text>
          </v-card>

        </v-card>
      </v-footer>
    </v-card>
  </div>
</template>

<script>
import SubgraphsTable from "@/components/SubgraphsTable";
import IndexerCurrentState from "@/components/IndexerCurrentState";
//import gql from "graphql-tag";
//import t from "typy";
import numeral from 'numeral';
import AllocationSetter from "../components/AllocationSetter";
import gql from "graphql-tag";
import BigNumber from "bignumber.js";
export default {
  name: "AllocationWizard.vue",
  props:{
    indexer: String,
    indexingRewardCut: Number,
  },
  data () {
    return {
      currentStep: 1,
      availableStake: 0,
      web3: this.$store.state.web3,
      numeral,
      moment: this.$moment,
      selectedAllocations: [],
      selectedSubgraphs: [],
      rerenderComponent: 0,
      newAllocationSizes: {},
      drawer: false,
      selectedAllocationsCount: 0,
      activator: false,
      indexerAccounts: this.$store.state.indexerAccounts,
      newIndexerName: "",
      newIndexerAddress: "",
      dialog: false,
      stakingContractABI: [
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "indexer",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "bytes32",
              "name": "subgraphDeploymentID",
              "type": "bytes32"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "epoch",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "tokens",
              "type": "uint256"
            },
            {
              "indexed": true,
              "internalType": "address",
              "name": "allocationID",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "effectiveAllocation",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "address",
              "name": "sender",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "bytes32",
              "name": "poi",
              "type": "bytes32"
            },
            {
              "indexed": false,
              "internalType": "bool",
              "name": "isDelegator",
              "type": "bool"
            }
          ],
          "name": "AllocationClosed",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "indexer",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "bytes32",
              "name": "subgraphDeploymentID",
              "type": "bytes32"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "epoch",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "tokens",
              "type": "uint256"
            },
            {
              "indexed": true,
              "internalType": "address",
              "name": "allocationID",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "address",
              "name": "from",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "curationFees",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "rebateFees",
              "type": "uint256"
            }
          ],
          "name": "AllocationCollected",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "indexer",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "bytes32",
              "name": "subgraphDeploymentID",
              "type": "bytes32"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "epoch",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "tokens",
              "type": "uint256"
            },
            {
              "indexed": true,
              "internalType": "address",
              "name": "allocationID",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "bytes32",
              "name": "metadata",
              "type": "bytes32"
            }
          ],
          "name": "AllocationCreated",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "caller",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "address",
              "name": "assetHolder",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "bool",
              "name": "allowed",
              "type": "bool"
            }
          ],
          "name": "AssetHolderUpdate",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "indexer",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "uint32",
              "name": "indexingRewardCut",
              "type": "uint32"
            },
            {
              "indexed": false,
              "internalType": "uint32",
              "name": "queryFeeCut",
              "type": "uint32"
            },
            {
              "indexed": false,
              "internalType": "uint32",
              "name": "cooldownBlocks",
              "type": "uint32"
            }
          ],
          "name": "DelegationParametersUpdated",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "internalType": "string",
              "name": "param",
              "type": "string"
            }
          ],
          "name": "ParameterUpdated",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "indexer",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "bytes32",
              "name": "subgraphDeploymentID",
              "type": "bytes32"
            },
            {
              "indexed": true,
              "internalType": "address",
              "name": "allocationID",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "epoch",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "forEpoch",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "tokens",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "unclaimedAllocationsCount",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "delegationFees",
              "type": "uint256"
            }
          ],
          "name": "RebateClaimed",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "internalType": "address",
              "name": "controller",
              "type": "address"
            }
          ],
          "name": "SetController",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "indexer",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "address",
              "name": "operator",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "bool",
              "name": "allowed",
              "type": "bool"
            }
          ],
          "name": "SetOperator",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "caller",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "address",
              "name": "slasher",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "bool",
              "name": "allowed",
              "type": "bool"
            }
          ],
          "name": "SlasherUpdate",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "indexer",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "address",
              "name": "delegator",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "tokens",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "shares",
              "type": "uint256"
            }
          ],
          "name": "StakeDelegated",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "indexer",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "address",
              "name": "delegator",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "tokens",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "shares",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "until",
              "type": "uint256"
            }
          ],
          "name": "StakeDelegatedLocked",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "indexer",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "address",
              "name": "delegator",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "tokens",
              "type": "uint256"
            }
          ],
          "name": "StakeDelegatedWithdrawn",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "indexer",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "tokens",
              "type": "uint256"
            }
          ],
          "name": "StakeDeposited",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "indexer",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "tokens",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "until",
              "type": "uint256"
            }
          ],
          "name": "StakeLocked",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "indexer",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "tokens",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "reward",
              "type": "uint256"
            },
            {
              "indexed": false,
              "internalType": "address",
              "name": "beneficiary",
              "type": "address"
            }
          ],
          "name": "StakeSlashed",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "indexer",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "tokens",
              "type": "uint256"
            }
          ],
          "name": "StakeWithdrawn",
          "type": "event"
        },
        {
          "inputs": [
            {
              "internalType": "contract IGraphProxy",
              "name": "_proxy",
              "type": "address"
            }
          ],
          "name": "acceptProxy",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "contract IGraphProxy",
              "name": "_proxy",
              "type": "address"
            },
            {
              "internalType": "bytes",
              "name": "_data",
              "type": "bytes"
            }
          ],
          "name": "acceptProxyAndCall",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "bytes32",
              "name": "",
              "type": "bytes32"
            }
          ],
          "name": "addressCache",
          "outputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "bytes32",
              "name": "_subgraphDeploymentID",
              "type": "bytes32"
            },
            {
              "internalType": "uint256",
              "name": "_tokens",
              "type": "uint256"
            },
            {
              "internalType": "address",
              "name": "_allocationID",
              "type": "address"
            },
            {
              "internalType": "bytes32",
              "name": "_metadata",
              "type": "bytes32"
            },
            {
              "internalType": "bytes",
              "name": "_proof",
              "type": "bytes"
            }
          ],
          "name": "allocate",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "_indexer",
              "type": "address"
            },
            {
              "internalType": "bytes32",
              "name": "_subgraphDeploymentID",
              "type": "bytes32"
            },
            {
              "internalType": "uint256",
              "name": "_tokens",
              "type": "uint256"
            },
            {
              "internalType": "address",
              "name": "_allocationID",
              "type": "address"
            },
            {
              "internalType": "bytes32",
              "name": "_metadata",
              "type": "bytes32"
            },
            {
              "internalType": "bytes",
              "name": "_proof",
              "type": "bytes"
            }
          ],
          "name": "allocateFrom",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            }
          ],
          "name": "allocations",
          "outputs": [
            {
              "internalType": "address",
              "name": "indexer",
              "type": "address"
            },
            {
              "internalType": "bytes32",
              "name": "subgraphDeploymentID",
              "type": "bytes32"
            },
            {
              "internalType": "uint256",
              "name": "tokens",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "createdAtEpoch",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "closedAtEpoch",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "collectedFees",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "effectiveAllocation",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "accRewardsPerAllocatedToken",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "alphaDenominator",
          "outputs": [
            {
              "internalType": "uint32",
              "name": "",
              "type": "uint32"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "alphaNumerator",
          "outputs": [
            {
              "internalType": "uint32",
              "name": "",
              "type": "uint32"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            }
          ],
          "name": "assetHolders",
          "outputs": [
            {
              "internalType": "bool",
              "name": "",
              "type": "bool"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "channelDisputeEpochs",
          "outputs": [
            {
              "internalType": "uint32",
              "name": "",
              "type": "uint32"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "_allocationID",
              "type": "address"
            },
            {
              "internalType": "bool",
              "name": "_restake",
              "type": "bool"
            }
          ],
          "name": "claim",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address[]",
              "name": "_allocationID",
              "type": "address[]"
            },
            {
              "internalType": "bool",
              "name": "_restake",
              "type": "bool"
            }
          ],
          "name": "claimMany",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "_allocationID",
              "type": "address"
            },
            {
              "internalType": "bytes32",
              "name": "_poi",
              "type": "bytes32"
            }
          ],
          "name": "closeAllocation",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "components": [
                {
                  "internalType": "address",
                  "name": "allocationID",
                  "type": "address"
                },
                {
                  "internalType": "bytes32",
                  "name": "poi",
                  "type": "bytes32"
                }
              ],
              "internalType": "struct IStaking.CloseAllocationRequest[]",
              "name": "_requests",
              "type": "tuple[]"
            }
          ],
          "name": "closeAllocationMany",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "_closingAllocationID",
              "type": "address"
            },
            {
              "internalType": "bytes32",
              "name": "_poi",
              "type": "bytes32"
            },
            {
              "internalType": "address",
              "name": "_indexer",
              "type": "address"
            },
            {
              "internalType": "bytes32",
              "name": "_subgraphDeploymentID",
              "type": "bytes32"
            },
            {
              "internalType": "uint256",
              "name": "_tokens",
              "type": "uint256"
            },
            {
              "internalType": "address",
              "name": "_allocationID",
              "type": "address"
            },
            {
              "internalType": "bytes32",
              "name": "_metadata",
              "type": "bytes32"
            },
            {
              "internalType": "bytes",
              "name": "_proof",
              "type": "bytes"
            }
          ],
          "name": "closeAndAllocate",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "_tokens",
              "type": "uint256"
            },
            {
              "internalType": "address",
              "name": "_allocationID",
              "type": "address"
            }
          ],
          "name": "collect",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "controller",
          "outputs": [
            {
              "internalType": "contract IController",
              "name": "",
              "type": "address"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "curationPercentage",
          "outputs": [
            {
              "internalType": "uint32",
              "name": "",
              "type": "uint32"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "_indexer",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "_tokens",
              "type": "uint256"
            }
          ],
          "name": "delegate",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "delegationParametersCooldown",
          "outputs": [
            {
              "internalType": "uint32",
              "name": "",
              "type": "uint32"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            }
          ],
          "name": "delegationPools",
          "outputs": [
            {
              "internalType": "uint32",
              "name": "cooldownBlocks",
              "type": "uint32"
            },
            {
              "internalType": "uint32",
              "name": "indexingRewardCut",
              "type": "uint32"
            },
            {
              "internalType": "uint32",
              "name": "queryFeeCut",
              "type": "uint32"
            },
            {
              "internalType": "uint256",
              "name": "updatedAtBlock",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "tokens",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "shares",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "delegationRatio",
          "outputs": [
            {
              "internalType": "uint32",
              "name": "",
              "type": "uint32"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "delegationTaxPercentage",
          "outputs": [
            {
              "internalType": "uint32",
              "name": "",
              "type": "uint32"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "delegationUnbondingPeriod",
          "outputs": [
            {
              "internalType": "uint32",
              "name": "",
              "type": "uint32"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "_allocationID",
              "type": "address"
            }
          ],
          "name": "getAllocation",
          "outputs": [
            {
              "components": [
                {
                  "internalType": "address",
                  "name": "indexer",
                  "type": "address"
                },
                {
                  "internalType": "bytes32",
                  "name": "subgraphDeploymentID",
                  "type": "bytes32"
                },
                {
                  "internalType": "uint256",
                  "name": "tokens",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "createdAtEpoch",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "closedAtEpoch",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "collectedFees",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "effectiveAllocation",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "accRewardsPerAllocatedToken",
                  "type": "uint256"
                }
              ],
              "internalType": "struct IStaking.Allocation",
              "name": "",
              "type": "tuple"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "_allocationID",
              "type": "address"
            }
          ],
          "name": "getAllocationState",
          "outputs": [
            {
              "internalType": "enum IStaking.AllocationState",
              "name": "",
              "type": "uint8"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "_indexer",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "_delegator",
              "type": "address"
            }
          ],
          "name": "getDelegation",
          "outputs": [
            {
              "components": [
                {
                  "internalType": "uint256",
                  "name": "shares",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "tokensLocked",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "tokensLockedUntil",
                  "type": "uint256"
                }
              ],
              "internalType": "struct IStaking.Delegation",
              "name": "",
              "type": "tuple"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "_indexer",
              "type": "address"
            }
          ],
          "name": "getIndexerCapacity",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "_indexer",
              "type": "address"
            }
          ],
          "name": "getIndexerStakedTokens",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "bytes32",
              "name": "_subgraphDeploymentID",
              "type": "bytes32"
            }
          ],
          "name": "getSubgraphAllocatedTokens",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "components": [
                {
                  "internalType": "uint256",
                  "name": "shares",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "tokensLocked",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "tokensLockedUntil",
                  "type": "uint256"
                }
              ],
              "internalType": "struct IStaking.Delegation",
              "name": "_delegation",
              "type": "tuple"
            }
          ],
          "name": "getWithdraweableDelegatedTokens",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "_indexer",
              "type": "address"
            }
          ],
          "name": "hasStake",
          "outputs": [
            {
              "internalType": "bool",
              "name": "",
              "type": "bool"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "_controller",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "_minimumIndexerStake",
              "type": "uint256"
            },
            {
              "internalType": "uint32",
              "name": "_thawingPeriod",
              "type": "uint32"
            },
            {
              "internalType": "uint32",
              "name": "_protocolPercentage",
              "type": "uint32"
            },
            {
              "internalType": "uint32",
              "name": "_curationPercentage",
              "type": "uint32"
            },
            {
              "internalType": "uint32",
              "name": "_channelDisputeEpochs",
              "type": "uint32"
            },
            {
              "internalType": "uint32",
              "name": "_maxAllocationEpochs",
              "type": "uint32"
            },
            {
              "internalType": "uint32",
              "name": "_delegationUnbondingPeriod",
              "type": "uint32"
            },
            {
              "internalType": "uint32",
              "name": "_delegationRatio",
              "type": "uint32"
            },
            {
              "internalType": "uint32",
              "name": "_rebateAlphaNumerator",
              "type": "uint32"
            },
            {
              "internalType": "uint32",
              "name": "_rebateAlphaDenominator",
              "type": "uint32"
            }
          ],
          "name": "initialize",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "_allocationID",
              "type": "address"
            }
          ],
          "name": "isAllocation",
          "outputs": [
            {
              "internalType": "bool",
              "name": "",
              "type": "bool"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "_indexer",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "_delegator",
              "type": "address"
            }
          ],
          "name": "isDelegator",
          "outputs": [
            {
              "internalType": "bool",
              "name": "",
              "type": "bool"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "_operator",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "_indexer",
              "type": "address"
            }
          ],
          "name": "isOperator",
          "outputs": [
            {
              "internalType": "bool",
              "name": "",
              "type": "bool"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "maxAllocationEpochs",
          "outputs": [
            {
              "internalType": "uint32",
              "name": "",
              "type": "uint32"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "minimumIndexerStake",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            }
          ],
          "name": "operatorAuth",
          "outputs": [
            {
              "internalType": "bool",
              "name": "",
              "type": "bool"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "protocolPercentage",
          "outputs": [
            {
              "internalType": "uint32",
              "name": "",
              "type": "uint32"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "name": "rebates",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "fees",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "effectiveAllocatedStake",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "claimedRewards",
              "type": "uint256"
            },
            {
              "internalType": "uint32",
              "name": "unclaimedAllocationsCount",
              "type": "uint32"
            },
            {
              "internalType": "uint32",
              "name": "alphaNumerator",
              "type": "uint32"
            },
            {
              "internalType": "uint32",
              "name": "alphaDenominator",
              "type": "uint32"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "_assetHolder",
              "type": "address"
            },
            {
              "internalType": "bool",
              "name": "_allowed",
              "type": "bool"
            }
          ],
          "name": "setAssetHolder",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint32",
              "name": "_channelDisputeEpochs",
              "type": "uint32"
            }
          ],
          "name": "setChannelDisputeEpochs",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "_controller",
              "type": "address"
            }
          ],
          "name": "setController",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint32",
              "name": "_percentage",
              "type": "uint32"
            }
          ],
          "name": "setCurationPercentage",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint32",
              "name": "_indexingRewardCut",
              "type": "uint32"
            },
            {
              "internalType": "uint32",
              "name": "_queryFeeCut",
              "type": "uint32"
            },
            {
              "internalType": "uint32",
              "name": "_cooldownBlocks",
              "type": "uint32"
            }
          ],
          "name": "setDelegationParameters",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint32",
              "name": "_blocks",
              "type": "uint32"
            }
          ],
          "name": "setDelegationParametersCooldown",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint32",
              "name": "_delegationRatio",
              "type": "uint32"
            }
          ],
          "name": "setDelegationRatio",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint32",
              "name": "_percentage",
              "type": "uint32"
            }
          ],
          "name": "setDelegationTaxPercentage",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint32",
              "name": "_delegationUnbondingPeriod",
              "type": "uint32"
            }
          ],
          "name": "setDelegationUnbondingPeriod",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint32",
              "name": "_maxAllocationEpochs",
              "type": "uint32"
            }
          ],
          "name": "setMaxAllocationEpochs",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "_minimumIndexerStake",
              "type": "uint256"
            }
          ],
          "name": "setMinimumIndexerStake",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "_operator",
              "type": "address"
            },
            {
              "internalType": "bool",
              "name": "_allowed",
              "type": "bool"
            }
          ],
          "name": "setOperator",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint32",
              "name": "_percentage",
              "type": "uint32"
            }
          ],
          "name": "setProtocolPercentage",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint32",
              "name": "_alphaNumerator",
              "type": "uint32"
            },
            {
              "internalType": "uint32",
              "name": "_alphaDenominator",
              "type": "uint32"
            }
          ],
          "name": "setRebateRatio",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "_slasher",
              "type": "address"
            },
            {
              "internalType": "bool",
              "name": "_allowed",
              "type": "bool"
            }
          ],
          "name": "setSlasher",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint32",
              "name": "_thawingPeriod",
              "type": "uint32"
            }
          ],
          "name": "setThawingPeriod",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "_indexer",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "_tokens",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "_reward",
              "type": "uint256"
            },
            {
              "internalType": "address",
              "name": "_beneficiary",
              "type": "address"
            }
          ],
          "name": "slash",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            }
          ],
          "name": "slashers",
          "outputs": [
            {
              "internalType": "bool",
              "name": "",
              "type": "bool"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "_tokens",
              "type": "uint256"
            }
          ],
          "name": "stake",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "_indexer",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "_tokens",
              "type": "uint256"
            }
          ],
          "name": "stakeTo",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            }
          ],
          "name": "stakes",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "tokensStaked",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "tokensAllocated",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "tokensLocked",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "tokensLockedUntil",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "bytes32",
              "name": "",
              "type": "bytes32"
            }
          ],
          "name": "subgraphAllocations",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "thawingPeriod",
          "outputs": [
            {
              "internalType": "uint32",
              "name": "",
              "type": "uint32"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "_indexer",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "_shares",
              "type": "uint256"
            }
          ],
          "name": "undelegate",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "_tokens",
              "type": "uint256"
            }
          ],
          "name": "unstake",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "withdraw",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "_indexer",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "_delegateToIndexer",
              "type": "address"
            }
          ],
          "name": "withdrawDelegated",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ],
      restakeRewards: true,
    }
  },
  components: {
    AllocationSetter,
    IndexerCurrentState,
    SubgraphsTable,
  },
  apollo: {
    indexerCut: {
      query: gql`query indexercut($indexer: String!){
        indexer(id: $indexer){
          indexingRewardCut
          availableStake
        }
      }`,
      variables() {
        return {
          indexer: this.indexer
        }
      },
      update(data) {
        console.log(data);
        this.$store.state.indexingRewardCut = data.indexer.indexingRewardCut;
        this.indexingRewardCut = data.indexer.indexingRewardCut;
        this.availableStake = data.indexer.availableStake;
        return data.indexer;
      },
      result ({ data, loading, networkStatus }) {
        data;
        loading;
        networkStatus;

        this.getRestakeRewardsSetting();
      },
    },
  },
  methods: {
    updateAllocations(){
      this.$store.state.indexer = this.indexer;
      this.$cookies.set("indexer",this.indexer);
    },
    updateIndexerAccount(indexerAccount){
      let activeAccount = this.indexerAccounts.find(e => e.active);
      activeAccount.active = false;
      indexerAccount.active = true;
      this.indexer = indexerAccount.address;
      this.$cookies.set("indexer", this.indexer);
      this.$cookies.set("indexerAccounts", JSON.stringify(this.indexerAccounts));
    },
    addIndexerAccount(indexer, name){
      console.log("test");
      this.dialog = false;
      console.log("test");
      let newAccount = {
        name: name,
        address: indexer,
        active: false,
      }
      if(!this.indexerAccounts.find(e => e.address === indexer)){
        this.indexerAccounts.push(newAccount);
        this.updateIndexerAccount(newAccount);
        this.$cookies.set("indexerAccounts", JSON.stringify(this.indexerAccounts));
      }

      this.newIndexerName = "";
      this.newIndexerAddress = "";

    },
    selectAllocations(allocations){
      console.log(allocations);
      this.selectedAllocations = allocations;
      this.selectedAllocationsCount++;
    },
    selectSubgraphs(subgraphs){
      console.log(subgraphs);
      this.selectedSubgraphs = subgraphs;
      this.rerenderComponent++;
    },
    updateNewAllocations(allocations){
      this.newAllocationSizes = allocations;
    },
    indexerCut(dailyRewards){
      return this.indexingRewardCut == 1000000 ? dailyRewards : dailyRewards.multipliedBy(this.$store.state.indexingRewardCut).dividedBy(1000000).dp(0,1);
    },
    getRestakeRewardsSetting(){
      let restakingRewards = this.restakeRewards;
      restakingRewards;
      this.stakingContract.methods.rewardsDestination(this.indexer).call(function(error, value){
        if(value !== "0x0000000000000000000000000000000000000000")
          restakingRewards = false;
      });
    },
  },
  computed: {
    calculatedAvailableStake() {
      let BigNumber = this.$store.state.bigNumber;
      let totalClosing = this.selectedAllocations.reduce((sum, cur) => sum.plus(cur.allocatedTokens), BigNumber(0));
      let totalRewards = this.selectedAllocations.reduce((sum, cur) => sum.plus(cur.pending_rewards), BigNumber(0));
      console.log("Total Closing");
      console.log(totalClosing);
      let totalOpening = 0;
      for(const i in this.newAllocationSizes){
        totalOpening += this.newAllocationSizes[i];
      }
      console.log(totalOpening);
      //this.newAllocationSizes.reduce((sum,cur) => sum + cur);
      if(this.restakeRewards)
        return BigNumber(this.availableStake).plus(totalClosing).plus(totalRewards).minus(this.$store.state.web3.utils.toWei(totalOpening.toString()));
      else
        return BigNumber(this.availableStake).plus(totalClosing).plus(totalRewards).minus(this.indexerCut(new BigNumber(totalRewards))).minus(this.$store.state.web3.utils.toWei(totalOpening.toString()));
    },
    calculatedClosingAPR() {
      let totalAllocatedStake = new BigNumber(0);
      let totalRewardsPerYear = new BigNumber(0);
      if(this.selectedAllocations.length > 0){
        for(const i in this.selectedAllocations){
          totalAllocatedStake = totalAllocatedStake.plus(this.selectedAllocations[i].allocatedTokens);

          totalRewardsPerYear = totalRewardsPerYear.plus(new BigNumber(this.selectedAllocations[i].subgraphDeployment.signalledTokens)
              .dividedBy(this.$store.state.graphNetwork.totalTokensSignalled)
              .multipliedBy(this.$store.state.graphNetwork.issuancePerYear)
              .multipliedBy(
                  new BigNumber(this.selectedAllocations[i].allocatedTokens).dividedBy(this.selectedAllocations[i].subgraphDeployment.stakedTokens)
              )
          );
        }
      }else{
        return 0;
      }

      return totalRewardsPerYear.dividedBy(totalAllocatedStake).multipliedBy(100).dp(2);
      /*
      return new BigNumber(currentSignalledTokens)
          .dividedBy(this.$store.state.graphNetwork.totalTokensSignalled)
          .multipliedBy(this.$store.state.graphNetwork.issuancePerYear)
          .dividedBy(
              new BigNumber(stakedTokens).plus(this.$store.state.web3.utils.toWei(new_allocation))
          ).multipliedBy(100);
       */
    },
    calculatedOpeningAPR() {
      return false;
    },
    buildCommands(){
      let commands = "";
      for(const i in this.selectedAllocations){
        commands += `graph indexer rules delete ${this.selectedAllocations[i].subgraphDeployment.ipfsHash}\n`
      }
      for(const i in this.newAllocationSizes){
        commands += `graph indexer rules set ${i} allocationAmount ${this.newAllocationSizes[i]} decisionBasis always\n`
      }
      return commands;
    },
    stakingContract() {
      return new this.$store.state.web3.eth.Contract(this.stakingContractABI, "0xF55041E37E12cD407ad00CE2910B8269B01263b9");
    },
  },


}
</script>

<style>
.v-data-table {
  border-radius: 0px;
}
.theme--dark.v-application{
  background: #1E1E1E!important;
}
.v-stepper__content{
  padding: 0!important;
}
.v-stepper__header{
  max-width: 800px;
  margin: auto;
  box-shadow: none!important;
}
</style>