<template>
  <v-app>
    <v-app-bar
        app
        color="#5a3c57"
        dark
    >
      <div class="d-flex align-center ">
        <h1>
          Allocation Wizard
        </h1>
      </div>

      <v-spacer></v-spacer>

      <v-btn
          href="https://vincenttaglia.eth.link/"
          target="_blank"
          text
          class="hidden-sm-and-down"
      >
        <span class="mr-2">Made with ♥ by vincenttaglia.eth</span>
        <v-icon>mdi-open-in-new</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <template>
        <div>
          <v-stepper alt-labels v-model="currentStep">
            <v-stepper-header>
              <v-stepper-step
                  :complete="currentStep > 1"
                  step="1">
                Close Allocations
              </v-stepper-step>

              <v-divider></v-divider>

              <v-stepper-step
                  :complete="currentStep > 2"
                  step="2">
                Open Allocations
              </v-stepper-step>

              <v-divider></v-divider>

              <v-stepper-step step="3">
                Review Choices
              </v-stepper-step>
            </v-stepper-header>
            <v-stepper-content step="1">
              <IndexerCurrentState :indexer="indexer" selectable />
              <v-btn
                  color="primary"
                  @click="currentStep = 2"
              >
                Continue
              </v-btn>
              <v-btn text>
                Cancel
              </v-btn>
            </v-stepper-content>

            <v-stepper-content step="2">
              <SubgraphsTable :indexingRewardCut="indexingRewardCut" :key="indexingRewardCut" selectable />
              <v-btn
                  color="primary"
                  @click="currentStep = 3"
              >
                Continue
              </v-btn>
              <v-btn text>
                Cancel
              </v-btn>
            </v-stepper-content>
            <v-stepper-content step="3">
              <IndexerCurrentState :indexer="indexer" selectable />
              <v-btn
                  color="primary"
                  @click="currentStep = 1"
              >
                Continue
              </v-btn>
              <v-btn text>
                Cancel
              </v-btn>
            </v-stepper-content>

          </v-stepper>

          <v-stepper
              alt-labels
              class="mt-12"
          >
            <v-stepper-header>
              <v-stepper-step step="1">
                Close Allocations
                <small>Optional</small>
              </v-stepper-step>

              <v-divider></v-divider>

              <v-stepper-step step="2">
                Open Allocations
                <small>Optional</small>
              </v-stepper-step>

              <v-divider></v-divider>

              <v-stepper-step step="3">
                Review Choices
              </v-stepper-step>
            </v-stepper-header>
          </v-stepper>
        </div>
      </template>
    </v-main>
    <v-footer
        dark
        padless
    >
      <v-card
          flat
          tile
          class="white--text text-center"
          style="background-color:#5a3c57; width: 100%"
      >
        <v-card-text>
          <v-btn
              class="mx-4 white--text"
              icon
              href="https://github.com/vincenttaglia/indexer-tools"
              target="_blank"
          >
            <v-icon size="24px">
              mdi-github
            </v-icon>
          </v-btn>
        </v-card-text>
      </v-card>

    </v-footer>
  </v-app>
</template>

<script>
import SubgraphsTable from "@/components/SubgraphsTable";
import IndexerCurrentState from "@/components/IndexerCurrentState";
import gql from "graphql-tag";

export default {
  name: 'indexer-tools',
  apollo: {
    graphNetwork: {
      query: gql`query{
        graphNetwork(id: 1){
          totalTokensSignalled
          networkGRTIssuance
          totalSupply
        }
      }`,
      update(data) {
        let BigNumber = this.$store.state.bigNumber;

        data.graphNetwork.pctIssuancePerBlock = new BigNumber(this.$store.state.web3.utils.fromWei(data.graphNetwork.networkGRTIssuance.toString()).toString()).minus(1);
        data.graphNetwork.pctIssuancePerYear = new BigNumber(data.graphNetwork.pctIssuancePerBlock).plus(1).pow(2354250).minus(1);

        data.graphNetwork.issuancePerBlock = data.graphNetwork.pctIssuancePerBlock.multipliedBy(data.graphNetwork.totalSupply);
        data.graphNetwork.issuancePerYear = data.graphNetwork.pctIssuancePerYear.multipliedBy(data.graphNetwork.totalSupply);

        this.$store.state.graphNetwork = data.graphNetwork;
        return data.graphNetwork;
      },
    },
    indexerCut: {
      query: gql`query indexercut($indexer: String!){
        indexer(id: $indexer){
          indexingRewardCut
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
        return data.indexer;
      },
    },
  },
  components: {
    IndexerCurrentState,
    SubgraphsTable,
  },
  methods: {
    updateAllocations(){
      this.$store.state.indexer = this.indexer;
      this.$cookies.set("indexer",this.indexer);
    },
  },
  data () {
    return {
      indexer: this.$store.state.indexer,
      indexingRewardCut: 0,
      currentStep: 1,
    }
  },
};
</script>

<style>
.v-data-table {
  border-radius: 0px;
}
.theme--dark.v-application{
  background: #1E1E1E!important;
}
</style>
