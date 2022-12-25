<template>
  <v-app>
    <v-overlay :value="loading">
      <v-progress-circular
          indeterminate
          size="64"
      ></v-progress-circular>
    </v-overlay>
    <v-app-bar
      app
      color="#5a3c57"
      dark
    >
      <div class="d-flex grid-list align-center">
        <h1 class="mx-5">
          {{ this.$route.path === "/wizard" ? "Allocation Wizard" : "Indexer 2ools" }}
        </h1>
        <v-btn
            text
            to="/"
            class="ml-5 mr-2"
            :disabled="loading"
        >
          Subgraphs Dashboard
        </v-btn>
        <v-btn
            text
            to="/allocations"
            class="ml-2 mr-2"
            :disabled="loading"
        >
          Allocations Dashboard
        </v-btn>
        <v-btn
            text
            to="/wizard"
            class="ml-2 mr-2"
            :disabled="loading"
        >
          Allocation Wizard
        </v-btn>
        <v-btn
            text
            to="/settings"
            class="ml-2 mr-5"
            :disabled="loading"
        >
          Settings
        </v-btn>
      </div>


      <v-spacer></v-spacer>

      <v-menu offset-y>
        <template v-slot:activator="{ on }">
          <v-btn
              v-on="on"
              text
              :disabled="loading"
          >
            {{ indexerName }}
            -
            {{ indexer.substring(0,6) }}...{{ indexer.substring(indexer.length - 4, indexer.length) }}
          </v-btn>
        </template>
        <v-card>
          <v-list dense>
            <v-subheader>
              <h3 class="pl-2">Accounts</h3>
              <v-dialog
                  v-model="editDialog"
                  width="500"
              >
                <template v-slot:activator="{ on }">
                  <v-icon style="margin: 0 0 5px 8px" small clickable v-on="on">mdi-pencil</v-icon>
                </template>

                <v-card>
                  <v-card-title class="text-h5">
                    Edit Saved Accounts
                  </v-card-title>

                  <v-card-text>
                    <IndexerAccounts ref="accounts"></IndexerAccounts>
                  </v-card-text>

                </v-card>
              </v-dialog>
              <v-spacer></v-spacer>
              <v-dialog
                  v-model="dialog"
                  width="500"
              >
                <template v-slot:activator="{ on }">
                  <v-icon small clickable v-on="on" style="margin-bottom: 5px">mdi-plus</v-icon>
                </template>

                <v-card>
                  <v-card-title class="text-h5">
                    Add Indexer Account
                  </v-card-title>

                  <v-card-text>
                    <v-text-field
                        v-model="newIndexerName"
                        label="Indexer Name"
                        hint="ENS Domains Auto-Filled (broken)"
                        persistent-hint
                        class="mx-6"
                    ></v-text-field>
                    <v-text-field
                        v-model="newIndexerAddress"
                        label="Indexer Address"
                        class="mx-6"
                        @change="getENS(newIndexerAddress)"
                    ></v-text-field>
                  </v-card-text>

                  <v-divider></v-divider>

                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn
                        color="primary"
                        text
                        @click="addIndexerAccount(newIndexerAddress, newIndexerName);"

                    >
                      Add
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-dialog>
            </v-subheader>
            <v-divider></v-divider>
            <v-list-item-group
                color="primary"
            >
              <v-list-item
                  v-for="(indexerAccount) in indexerAccounts"
                  :key="indexerAccount.address"
                  @click="activateIndexerAccount(indexerAccount.address);"
              >
                <v-list-item-content>
                  <v-list-item-title v-text="indexerAccount.name"></v-list-item-title>
                  {{ indexerAccount.address.substring(0,6) }}...{{ indexerAccount.address.substring(indexerAccount.address.length - 4, indexerAccount.address.length) }}
                </v-list-item-content>
              </v-list-item>
            </v-list-item-group>
          </v-list>
        </v-card>
      </v-menu>
    </v-app-bar>

    <v-main>
      <router-view :indexing-reward-cut="indexingRewardCut" :indexer="indexer" :key="indexer" :addIndexerAccount="addIndexerAccount" :loading="loading" @update-loading="updateLoading" :simulateClosingAllocations="[]"></router-view>
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
              href="https://vincenttaglia.eth.link/"
              target="_blank"
              text
          >
            <span class="mr-2">Made with ♥ by vincenttaglia.eth</span>
          </v-btn>
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
import gql from "graphql-tag";
import IndexerAccounts from "../components/IndexerAccounts.vue";

export default {
  name: 'indexer-tools',
  apollo: {
    graphNetwork: {
      query: gql`query{
        graphNetwork(id: 1){
          totalTokensSignalled
          networkGRTIssuance
          totalSupply
          currentEpoch
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
    IndexerAccounts
  },
  computed: {
    indexerName() {
      return this.indexerAccounts.find(e => e.active).name;
    },
    indexer(){
      return this.indexerAccounts.find(e => e.active).address;
    }
  },
  methods: {
    updateLoading(){
      this.loading = false;
    },
    updateAllocations(){
      this.$store.state.indexer = this.indexer;
      this.$cookies.set("indexer",this.indexer);
    },
  },
  data () {
    return {
      indexingRewardCut: 0,
      drawer: false,
      indexerAccounts: this.$store.state.indexerAccounts,
      newIndexerName: "",
      newIndexerAddress: "",
      dialog: false,
      editDialog: false,
      loading: true,
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
.indexer-edit{
  padding: 10px 5px;
}
.indexer-edit:hover{
  background-color: #323131;
}
.v-badge__badge .v-icon{
  font-size: 14px!important;
}
.v-data-table { 
  overflow-x: auto;
}
</style>
