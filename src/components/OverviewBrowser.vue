<template>
  <v-main>
    <IndexerDashboard :indexer="indexer" :subgraph_loading="loading"/>
    <SubgraphsDashboard :indexingRewardCut="indexingRewardCut" :key="indexingRewardCut" @update-loading="updateLoading" :simulateClosingAllocations="[]"/>
  </v-main>
</template>

<script>
import SubgraphsDashboard from "./SubgraphsDashboard";
import IndexerDashboard from "./IndexerDashboard";
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
    SubgraphsDashboard,
    IndexerDashboard,
  },
}
</script>

<style scoped>

</style>