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
            class=" text-center white--text"
        >
          <v-card-text>
            <strong>Allocation Remaining: {{ numeral(web3.utils.fromWei(web3.utils.toBN(this.calculatedAvailableStake))).format('0,0') }}</strong>
          </v-card-text>

          <v-divider></v-divider>

          <v-card-text class="white--text">
            <strong>Allocation Remaining: {{ this.calculatedAvailableStake }}</strong>
          </v-card-text>
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
      allocations: {},
      drawer: false,
      selectedAllocationsCount: 0,
      activator: false,
      indexerAccounts: this.$store.state.indexerAccounts,
      newIndexerName: "",
      newIndexerAddress: "",
      dialog: false,
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
      this.allocations = allocations;
    }
  },
  computed: {
    calculatedAvailableStake() {
      let BigNumber = this.$store.state.bigNumber;
      let totalClosing = this.selectedAllocations.reduce((sum, cur) => sum.plus(cur.allocatedTokens), BigNumber(0));
      let totalRewards = this.selectedAllocations.reduce((sum, cur) => sum.plus(cur.pending_rewards), BigNumber(0));
      console.log("Total Closing");
      console.log(totalClosing);
      let totalOpening = 0;
      for(const i in this.allocations){
        totalOpening += this.allocations[i];
      }
      console.log(totalOpening);
      //this.allocations.reduce((sum,cur) => sum + cur);
      return BigNumber(this.availableStake).plus(totalClosing).plus(totalRewards).minus(this.$store.state.web3.utils.toWei(totalOpening.toString()));
    },
    buildCommands(){
      let commands = "";
      for(const i in this.selectedAllocations){
        commands += `graph indexer rules delete ${this.selectedAllocations[i].subgraphDeployment.ipfsHash}\n`
      }
      for(const i in this.allocations){
        commands += `graph indexer rules set ${i} allocationAmount ${this.allocations[i]} decisionBasis always\n`
      }
      return commands;
    }
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