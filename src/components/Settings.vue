<template>
    <div>
    <v-container>
        <v-toolbar
        flat
        color="#5a3c57"
        dark
        >
        <v-toolbar-title>Settings</v-toolbar-title>
        </v-toolbar>
        <v-tabs vertical>
        <v-tab>
            <v-icon left>
            mdi-cog
            </v-icon>
            General
        </v-tab>
        <v-tab>
            <v-icon left>
            mdi-account
            </v-icon>
            Accounts
        </v-tab>
        <v-tab>
            <v-icon left>
            mdi-table-border
            </v-icon>
            Table Config
        </v-tab>
        <v-tab>
            <v-icon left>
            mdi-access-point
            </v-icon>
            Agent Connect
        </v-tab>

        <v-tab-item>
            <v-card flat>
            <v-card-text>
                <v-switch
                v-model="automaticIndexingRewards"
                :label="`Automatic Indexing Rewards*`"
                class="mb-0"
                ></v-switch>
                <p class="mb-8">
                    * Disable if there are issues with allocation wizard.
                </p>
                <h3>Subgraph Sync List (Manual)</h3>
                <v-textarea rows="3" v-model="subgraphSynclist"></v-textarea>
                <h3>Subgraph Blacklist</h3>
                <v-textarea rows="3" v-model="subgraphBlacklist"></v-textarea>
            </v-card-text>
            </v-card>
        </v-tab-item>
        <v-tab-item>
            <v-card flat>
            <v-card-text>
                <IndexerAccounts></IndexerAccounts>
            </v-card-text>
            </v-card>
        </v-tab-item>
        <v-tab-item>
            <v-card flat>
            <v-card-text>
                <p>
                    Soon: more columns and control over which columns are shown. Change order of columns now on dashboard pages.
                </p>
            </v-card-text>
            </v-card>
        </v-tab-item>
        <v-tab-item>
            <v-card flat>
            <v-card-text>
                <p>
                Coming soon ;)
                </p>
            </v-card-text>
            </v-card>
        </v-tab-item>
        </v-tabs>
    </v-container>
    </div>
    </template>
    
    <script>
import IndexerAccounts from './IndexerAccounts.vue';
    export default {
  components: { IndexerAccounts },
      name: "Settings",
      data () {
        return {
            indexerAccounts: this.$store.state.indexerAccounts,
            automaticIndexingRewards: this.$store.state.automaticIndexingRewards,
            subgraphSynclist: this.$store.state.subgraphSynclist,
            subgraphBlacklist: this.$store.state.subgraphBlacklist,
        }
      },
      props: {

      },
      created(){
        console.log("test");
        this.$emit("update-loading", false);
      },
      watch: {
        automaticIndexingRewards: function(value) {
          this.setAutomaticIndexingRewards(value);
        },
        subgraphSynclist: function(value){
            this.$store.state.subgraphSynclist = value;
            this.$cookies.set("subgraph_synclist",value);
        },
        subgraphBlacklist: function(value){
            this.$store.state.subgraphBlacklist = value;
            this.$cookies.set("subgraph_blacklist",value);
        },
      }
    }
    </script>
    
    <style scoped>
    
    </style>