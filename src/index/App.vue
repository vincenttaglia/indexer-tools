<template>
  <v-app>
    <v-app-bar
      app
      color="#5a3c57"
      dark
    >
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <div class="d-flex align-center ">
        <h1>
          Indexer Tools
        </h1>
      </div>

      <v-spacer></v-spacer>

      <v-menu offset-y>
        <template v-slot:activator="{ on }">
          <v-btn
              v-on="on"
              text
          >
            {{ indexerName }}
            -
            {{ indexer.substring(0,6) }}...{{ indexer.substring(indexer.length - 4, indexer.length) }}
          </v-btn>
        </template>
        <v-card>
          <v-list dense>
            <v-subheader>
              <h3>Accounts</h3>
              <v-dialog
                  v-model="editDialog"
                  width="500"
              >
                <template v-slot:activator="{ on }">
                  <v-icon style="padding: 0 0 5px 8px" small clickable v-on="on">mdi-pencil</v-icon>
                </template>

                <v-card>
                  <v-card-title class="text-h5">
                    Edit Saved Accounts
                  </v-card-title>

                  <v-card-text>
                    <div v-for="indexerAccount in indexerAccounts" :key="indexerAccount.address" class="indexer-edit">
                      <v-text-field
                        v-model="indexerAccount.name"
                        label="Indexer Name"
                        @change="editIndexerAccounts"
                      ></v-text-field>
                      <v-text-field
                          v-model="indexerAccount.address"
                          label="Indexer Address"
                          @change="editIndexerAccounts"
                      ></v-text-field>
                      <v-icon @click="deleteIndexerAccount(indexerAccount)" v-if="!indexerAccount.active">mdi-delete</v-icon>
                      <span v-if="indexerAccount.active">(Active)</span>
                    </div>
                  </v-card-text>

                </v-card>
              </v-dialog>
              <v-spacer></v-spacer>
              <v-dialog
                  v-model="dialog"
                  width="500"
              >
                <template v-slot:activator="{ on }">
                  <v-icon small clickable v-on="on" style="padding-bottom: 5px">mdi-plus</v-icon>
                </template>

                <v-card>
                  <v-card-title class="text-h5">
                    Add Indexer Account
                  </v-card-title>

                  <v-card-text>
                    <v-text-field
                        v-model="newIndexerName"
                        label="Indexer Name"
                        class="mx-6"
                    ></v-text-field>
                    <v-text-field
                        v-model="newIndexerAddress"
                        label="Indexer Address"
                        class="mx-6"
                    ></v-text-field>
                  </v-card-text>

                  <v-divider></v-divider>

                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn
                        color="primary"
                        text
                        @click="addIndexerAccount(newIndexerAddress, newIndexerName)"

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
                  @click="updateIndexerAccount(indexerAccount)"
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

    <v-navigation-drawer
        v-model="drawer"
        absolute
        bottom
        temporary
    >
      <v-list
          nav
          dense
      >
        <v-list-item-group
            active-class="deep-purple--text text--accent-4"
        >


          <v-list-item to="/">
            Indexer Tools
          </v-list-item>
          <v-list-item to="/wizard">
            Allocation Wizard
          </v-list-item>
        </v-list-item-group>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <router-view :indexing-reward-cut="indexingRewardCut" :indexer="indexer" :addIndexerAccount="addIndexerAccount"></router-view>
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
              class="hidden-sm-and-down"
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

  },
  computed: {
    indexerName() {
      return this.indexerAccounts.find(e => e.active).name;
    },
  },
  methods: {
    updateAllocations(){
      this.$store.state.indexer = this.indexer;
      this.$cookies.set("indexer",this.indexer);
    },
    editIndexerAccounts(){
      this.$store.state.indexerAccounts = this.indexerAccounts;
      this.$cookies.set("indexerAccounts", JSON.stringify(this.indexerAccounts));
    },
    deleteIndexerAccount(indexerAccount){
      let account = this.indexerAccounts.find(e => e.address === indexerAccount.address);
      if(!account.active){
        this.indexerAccounts = this.indexerAccounts.filter(function(e) { return e.address !== indexerAccount.address; });
        this.editIndexerAccounts();
      }
    },
    updateIndexerAccount(indexerAccount){
      let activeAccount = this.indexerAccounts.find(e => e.active);
      activeAccount.active = false;
      indexerAccount.active = true;
      this.indexer = indexerAccount.address;
      this.$store.state.indexer = this.indexer;
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
      let lookup = this.indexerAccounts.find(e => e.address === indexer);
      if(!lookup){
        this.indexerAccounts.push(newAccount);
        this.updateIndexerAccount(newAccount);
        this.$cookies.set("indexerAccounts", JSON.stringify(this.indexerAccounts));
      }else{
        this.updateIndexerAccount(lookup);
      }

      this.newIndexerName = "";
      this.newIndexerAddress = "";

    },
  },
  data () {
    return {
      indexer: this.$store.state.indexer,
      indexingRewardCut: 0,
      drawer: false,
      indexerAccounts: this.$store.state.indexerAccounts,
      newIndexerName: "",
      newIndexerAddress: "",
      dialog: false,
      editDialog: false,
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
  font-size: 12px!important;
}
</style>
