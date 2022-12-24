<template>
    <div>
        <div v-for="indexerAccount in indexerAccounts" :key="indexerAccount.address" class="indexer-edit">
            <v-text-field
                v-model="indexerAccount.name"
                label="Indexer Name"
                @change="updateIndexerAccounts"
            ></v-text-field>
            <v-text-field
                v-model="indexerAccount.address"
                label="Indexer Address"
                @change="updateIndexerAccounts"
            ></v-text-field>
            <v-icon @click="deleteIndexerAccount(indexerAccount)" v-if="!indexerAccount.active">mdi-delete</v-icon>
            <span v-if="indexerAccount.active">(Active)</span>
        </div>
    </div>
    </template>
    <script>
    export default {
      name: "IndexerAccounts",
      data () {
        return {
            indexerAccounts: this.$store.state.indexerAccounts,
        }
      },
      props: {

      },
      created(){
        console.log("test");
        this.$emit("update-loading", false);
      },
      methods: {
       
      }
    }
    </script>
    
    <style scoped>
    
    </style>