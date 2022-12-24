<template>
  <div :key="this.indexingRewardCut">
    <v-data-table
        :headers="headers"
        :items="subgraphsToAllocate"
        item-key="currentVersion.subgraphDeployment.ipfsHash"
        class="elevation-1"
        :custom-sort="customSort"
        :sort-by.sync="sortBy"
        :sort-desc.sync="sortDesc"
        :footer-props="{
          'items-per-page-options': [10, 15, 20, 25, 30, 40, 50]
        }"
        :items-per-page="subgraphs_per_page"
        mobile-breakpoint="0"
        show-expand
        :expanded="expandedItems"
    >
      <template v-slot:item.image="{ item }">
        <v-badge
            :value="item.currentVersion.subgraphDeployment.deniedAt"
            bordered
            color="error"
            icon="mdi-currency-usd-off"
            overlap
            avatar
        >
          <v-avatar size="30">
            <v-img :src="item.image" />
          </v-avatar>
        </v-badge>
      </template>
      <template v-slot:item.currentVersion.subgraphDeployment.createdAt="{ item }">
        <span :timestamp="item.currentVersion.subgraphDeployment.createdAt">{{ item.currentVersion.subgraphDeployment.createdAt | moment("MMM D, YYYY HH:mm") }}</span>
      </template>
      <template v-slot:item.currentSignalledTokens="{ item }">
        {{ numeral(web3.utils.fromWei(item.currentSignalledTokens.toString())).format('0,0') }} GRT
      </template>
      <template v-slot:item.currentVersion.subgraphDeployment.indexingRewardAmount="{ item }">
        {{ numeral(web3.utils.fromWei(item.currentVersion.subgraphDeployment.indexingRewardAmount.toString())).format('0,0') }} GRT
      </template>
      <template v-slot:item.currentVersion.subgraphDeployment.queryFeesAmount="{ item }">
        {{ numeral(web3.utils.fromWei(item.currentVersion.subgraphDeployment.queryFeesAmount.toString())).format('0,0') }} GRT
      </template>
      <template v-slot:item.currentVersion.subgraphDeployment.stakedTokens="{ item }">
        {{ numeral(web3.utils.fromWei(item.currentVersion.subgraphDeployment.stakedTokens.toString())).format('0,0') }} GRT
      </template>
      <template v-slot:item.proportion="{ item }">
        {{ numeral(item.proportion*100).format('0,0.000') }}%
      </template>
      <template v-slot:item.apr="{ item }">
        {{ numeral(item.apr).format('0,0.00') }}%
      </template>
      <template v-slot:item.newapr="{ item }">
        {{ numeral(newAllocationCalcs[item.currentVersion.subgraphDeployment.ipfsHash].newapr).format('0,0.00') }}%
      </template>
      <template v-slot:item.dailyrewards="{ item }">
        {{ numeral(web3.utils.fromWei(web3.utils.toBN(newAllocationCalcs[item.currentVersion.subgraphDeployment.ipfsHash].dailyrewards))).format('0,0') }} GRT
      </template>
      <template v-slot:item.dailyrewards_cut="{ item }">
        {{ numeral(web3.utils.fromWei(web3.utils.toBN(newAllocationCalcs[item.currentVersion.subgraphDeployment.ipfsHash].dailyrewards_cut))).format('0,0') }} GRT
      </template>
      <template v-slot:body.append>

      </template>
      <template v-slot:expanded-item="{ headers, item }">
        <td :colspan="headers.length">
          <v-slider
              :max="parseInt(web3.utils.fromWei(web3.utils.toBN(calculatedAvailableStake))) + (newAllocationSizes[item.currentVersion.subgraphDeployment.ipfsHash] ? newAllocationSizes[item.currentVersion.subgraphDeployment.ipfsHash] : 0)"
              min="0"
              v-model="newAllocationSizes[item.currentVersion.subgraphDeployment.ipfsHash]"
              style="max-width: 500px"
              :key="refreshSlider"
              @change="updateAllocations"
              class="mt-4"
          >
            <template v-slot:prepend>
              <v-text-field
                  class="mt-0 pt-0"
                  type="number"
                  style="width: 100px"
                  v-model="newAllocationSizes[item.currentVersion.subgraphDeployment.ipfsHash]"
                  @change="updateAllocations"
              ></v-text-field>
            </template>
          </v-slider>
        </td>
      </template>
    </v-data-table>
  </div>
</template>


<script>
//import gql from 'graphql-tag';
import t from "typy";
import numeral from 'numeral';
import BigNumber from "bignumber.js";
export default {
  name: "AllocationSetter",
  props: {
    indexingRewardCut: Number,
    selectable: Boolean,
    subgraphsToAllocate: Array,
    calculatedAvailableStake: BigNumber,
    allocationsToClose: Array,
  },
  data () {
    return {
      new_allocation: this.$store.state.new_allocation,
      web3: this.$store.state.web3,
      subgraphs: this.$store.state.subgraphs,
      subgraphs_per_page: this.$store.state.subgraphs_per_page,
      numeral,
      sortBy: 'newapr',
      sortDesc: true,
      loading: true,
      selected: [],
      expandedItems: this.subgraphsToAllocate,
      availableStake: this.calculatedAvailableStake,
      refreshSlider: 0,
      newAllocationSizes: {},
    }
  },
  computed: {
    headers () {
      return [
        {
          text: 'Img',
          align: 'start',
          sortable: false,
          value: 'image',
        },
        { text: 'Name', value: 'displayName' },
        { text: 'Created', value: 'currentVersion.subgraphDeployment.createdAt' },
        { text: 'Current APR', value: 'apr'},
        { text: 'New APR', value: 'newapr'},
        { text: 'Est Daily Rewards (Before Cut)', value: 'dailyrewards'},
        { text: 'Est Daily Rewards (After Cut)', value: 'dailyrewards_cut'},
        {
          text: 'Current Signal',
          value: 'currentSignalledTokens',
        },
        { text: 'Current Proportion', value: 'proportion'},
        { text: 'Current Allocations', value: 'currentVersion.subgraphDeployment.stakedTokens'},
        { text: 'Total Query Fees', value: 'currentVersion.subgraphDeployment.queryFeesAmount'},
        { text: 'Total Indexing Rewards', value: 'currentVersion.subgraphDeployment.indexingRewardAmount'},
        { text: 'Deployment ID', value: 'currentVersion.subgraphDeployment.ipfsHash', sortable: false },
      ]
    },
    newAllocationCalcs() {
      let BigNumber = this.$store.state.bigNumber;
      let settings = {};
      for(const i in this.subgraphsToAllocate){
        let thisAllocation = this.allocationsToClose.filter(e => e.subgraphDeployment.ipfsHash === this.subgraphsToAllocate[i].currentVersion.subgraphDeployment.ipfsHash)[0];
        let closingAllocationSize = "0";
        if(thisAllocation != null){
          closingAllocationSize = thisAllocation.allocatedTokens;
        }
        let futureStakedTokens = BigNumber(this.subgraphsToAllocate[i].currentVersion.subgraphDeployment.stakedTokens).minus(closingAllocationSize);
        let newSize = this.newAllocationSizes[this.subgraphsToAllocate[i].currentVersion.subgraphDeployment.ipfsHash] ? this.newAllocationSizes[this.subgraphsToAllocate[i].currentVersion.subgraphDeployment.ipfsHash] : 0;
        let dailyrewards = this.dailyrewards(this.subgraphsToAllocate[i].currentSignalledTokens.toString(), futureStakedTokens.toString(), newSize.toString());

        let setting = {
          size: newSize,
          newapr: this.newapr(this.subgraphsToAllocate[i].currentSignalledTokens.toString(), futureStakedTokens.toString(), newSize.toString()),
          dailyrewards: dailyrewards,
          dailyrewards_cut: this.indexerCut(dailyrewards),
        };
        settings[this.subgraphsToAllocate[i].currentVersion.subgraphDeployment.ipfsHash] = setting;
      }
      return settings;
    },
  },
  methods: {
    updateAllocations: function(){
      this.$emit("allocations-update", this.newAllocationSizes);
      //this.calculateMetrics();
    },
    newapr: function(currentSignalledTokens, stakedTokens, new_allocation){
      let BigNumber = this.$store.state.bigNumber;

      // signalledTokens / totalTokensSignalled * issuancePerYear / (stakedTokens + new_allocation)
      let apr = new BigNumber(currentSignalledTokens)
          .dividedBy(this.$store.state.graphNetwork.totalTokensSignalled)
          .multipliedBy(this.$store.state.graphNetwork.issuancePerYear)
          .dividedBy(
              new BigNumber(stakedTokens).plus(this.$store.state.web3.utils.toWei(new_allocation))
          ).multipliedBy(100);
      return apr.isNaN() ? new BigNumber(0) : apr;
    },
    dailyrewards: function(currentSignalledTokens, stakedTokens, new_allocation){
      let BigNumber = this.$store.state.bigNumber;

      // currentSignalledTokens / totalTokensSignalled * issuancePerBlock * blocks per day * (new_allocation / (stakedTokens + new_allocation))
      let dr = new BigNumber(currentSignalledTokens)
          .dividedBy(this.$store.state.graphNetwork.totalTokensSignalled)
          .multipliedBy(this.$store.state.graphNetwork.issuancePerBlock)
          .multipliedBy(6450)
          .multipliedBy(
              new BigNumber(this.$store.state.web3.utils.toWei(new_allocation)).dividedBy(new BigNumber(stakedTokens).plus(this.$store.state.web3.utils.toWei(new_allocation)))
          ).dp(0);

      return dr.isNaN() ? new BigNumber(0) : dr;
    },
    updateEstApr: function(){
      this.$cookies.set("new_allocation", this.new_allocation);

      for(let i = 0; i < this.$store.state.subgraphs.length; i++){
        let subgraph = this.$store.state.subgraphs[i];
        if(subgraph.currentSignalledTokens > 0) {
          this.$store.state.subgraphs[i].newapr = this.newapr(subgraph.currentSignalledTokens, subgraph.currentVersion.subgraphDeployment.stakedTokens, this.new_allocation);
          this.$store.state.subgraphs[i].dailyrewards = this.dailyrewards(subgraph.currentSignalledTokens, subgraph.currentVersion.subgraphDeployment.stakedTokens, this.new_allocation);
          this.$store.state.subgraphs[i].dailyrewards_cut = this.indexerCut(this.$store.state.subgraphs[i].dailyrewards);
        }
      }
    },
    updateSubgraphsPerPage: function(){
      this.$cookies.set("subgraphs_per_page", this.subgraphs_per_page);
      this.$store.state.subgraphs_per_page = this.subgraphs_per_page;
    },
    indexerCut: function(dailyRewards){
      return this.indexingRewardCut == 1000000 ? dailyRewards : dailyRewards.multipliedBy(this.indexingRewardCut).dividedBy(1000000).dp(0,1);
    },
    customSort: function(items, index, isDesc) {
      items.sort((a, b) => {
        if (index[0] == 'currentVersion.subgraphDeployment.createdAt'
            || index[0] == 'currentSignalledTokens'
            || index[0] == 'currentVersion.subgraphDeployment.stakedTokens'
            || index[0] == 'currentVersion.subgraphDeployment.indexingRewardAmount'
            || index[0] == 'currentVersion.subgraphDeployment.queryFeesAmount'
            || index[0] == 'proportion'
            || index[0] == 'apr'
            || index[0] == 'newapr'
            || index[0] == 'dailyrewards'
            || index[0] == 'dailyrewards_cut'
        ) {
          if (!isDesc[0]) {
            return t(a, index[0]).safeObject - t(b, index[0]).safeObject;
          } else {
            return t(b, index[0]).safeObject - t(a, index[0]).safeObject;
          }
        } else {
          if(typeof t(a, index[0]) !== 'undefined'){
            let objA = t(a, index[0]).safeObject;
            let objB = t(b, index[0]).safeObject;
            if(objA == null || objB == null)
              return objA != null && !isDesc[0];

            if (!isDesc[0]) {
              return objA.toString().toLowerCase().localeCompare(objB.toString().toLowerCase());
            } else {
              return objB.toString().toLowerCase().localeCompare(objA.toString().toLowerCase());
            }
          }
        }

      });
      return items;
    },
  },
  watch: {
    newAllocationSizes: function(value){
      this.$emit("allocations-set", value);
      this.refreshSlider++;
      let theAvailableStake = this.calculatedAvailableStake;
      for(const prop in value){
        theAvailableStake = theAvailableStake.minus(value[prop]);
      }
      this.availableStake = theAvailableStake;
    }
  }
}
</script>

<style scoped>

</style>