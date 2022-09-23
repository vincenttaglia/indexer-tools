<template>
  <v-main>
    <IndexerCurrentState :indexer="indexer" :subgraph_loading="loading"/>
    <SubgraphsTable :indexingRewardCut="indexingRewardCut" :key="indexingRewardCut" @update-loading="updateLoading" :simulateClosingAllocations="[]"/>
  </v-main>
</template>

<script>
import SubgraphsTable from "./SubgraphsTable";
import IndexerCurrentState from "./IndexerCurrentState";
export default {
  name: "OverviewBrowser.vue",
  data() {
    return{

    }
  },
  computed: {

  },
  props: {
    indexer: String,
    indexingRewardCut: Number,
    loading: Boolean,
  },
  methods: {
    updateAllocations(){
      this.$store.state.indexer = this.indexer;
      this.$cookies.set("indexer",this.indexer);
    },
    updateLoading(){
      this.$emit("update-loading", false);
    },
  },
  components: {
    SubgraphsTable,
    IndexerCurrentState,
  },
}
</script>

<style scoped>

</style>