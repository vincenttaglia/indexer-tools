<template>
  <v-main>
    <IndexerCurrentState :indexer="indexer"/>
    <SubgraphsTable :indexingRewardCut="indexingRewardCut" :key="indexingRewardCut" :simulateClosingAllocations="[]"/>
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
  },
  methods: {
    updateAllocations(){
      this.$store.state.indexer = this.indexer;
      this.$cookies.set("indexer",this.indexer);
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