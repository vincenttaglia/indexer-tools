<template>
<div>

</div>
</template>

<script>
export default {
  name: "BookmarkSupport.vue",
  props: {
    indexer: String,
    indexingRewardCut: Number,
    urlIndexer: String,
    addIndexerAccount: Function,
  },
  created(){
    console.log(this.urlIndexer);
    this.addIndexerAccount(this.urlIndexer, "New Account");
    this.$router.push('/');
  },
}
</script>

<style scoped>

</style>