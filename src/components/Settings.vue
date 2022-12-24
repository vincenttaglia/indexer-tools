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
                ></v-switch>
                <p>
                    * Disable if there are issues with allocation wizard.
                </p>
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
                Fusce a quam. Phasellus nec sem in justo pellentesque facilisis. Nam eget dui. Proin viverra, ligula sit amet ultrices semper, ligula arcu tristique sapien, a accumsan nisi mauris ac eros. In dui magna, posuere eget, vestibulum et, tempor auctor, justo.
                </p>

                <p class="mb-0">
                Cras sagittis. Phasellus nec sem in justo pellentesque facilisis. Proin sapien ipsum, porta a, auctor quis, euismod ut, mi. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nam at tortor in tellus interdum sagittis.
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
            automaticIndexingRewards: this.$store.state.automaticIndexingRewards
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
      }
    }
    </script>
    
    <style scoped>
    
    </style>