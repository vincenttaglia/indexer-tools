<template>
  <div>
    <v-data-table
        :headers="headers"
        :items="this.$store.state.allocations"
        item-key="subgraphDeployment.ipfsHash"
        class="elevation-1"
        :search="search"
        :custom-sort="customSort"
        :sort-by.sync="sortBy"
        :sort-desc.sync="sortDesc"
        :footer-props="{
          'items-per-page-options': [5, 10, 15, 20, 25, 30, 40, 50]
        }"
        :items-per-page.sync="allocations_per_page"
        @update:items-per-page="updateAllocationsPerPage"
        :loading="this.loading"
        loading-text="Loading... Please wait"
        mobile-breakpoint="0"
        :show-select="this.selectable"
    >
      <!--<template v-slot:top>
        <tr>
          <td  class="mx-4">
            <v-text-field
                v-model="indexer"
                label="Indexer"
                class="mx-6"
                @change="updateAllocations"
            ></v-text-field>
          </td>
        </tr>
      </template>-->
      <template v-slot:item.subgraphDeployment.versions[0].subgraph.image="{ item }">
        <img :src="item.subgraphDeployment.versions[0].subgraph.image" width="25" height="25"/>
      </template>
      <template v-slot:item.allocatedTokens="{ item }">
        {{ numeral(web3.utils.fromWei(item.allocatedTokens.toString())).format('0,0') }} GRT
      </template>
      <template v-slot:item.createdAt="{ item }">
        <span :timestamp="item.createdAt">{{ item.createdAt | moment("MMM D, YYYY HH:mm") }}</span>
      </template>
      <template v-slot:item.activeDuration="{ item }">
        <span :timestamp="item.activeDuration">{{ item.readableDuration }}</span>
      </template>
      <template v-slot:item.subgraphDeployment.signalledTokens="{ item }">
        {{ numeral(web3.utils.fromWei(item.subgraphDeployment.signalledTokens.toString())).format('0,0') }} GRT
      </template>
      <template v-slot:item.subgraphDeployment.indexingRewardAmount="{ item }">
        {{ numeral(web3.utils.fromWei(item.subgraphDeployment.indexingRewardAmount.toString())).format('0,0') }} GRT
      </template>
      <template v-slot:item.subgraphDeployment.queryFeesAmount="{ item }">
        {{ numeral(web3.utils.fromWei(item.subgraphDeployment.queryFeesAmount.toString())).format('0,0') }} GRT
      </template>
      <template v-slot:item.subgraphDeployment.stakedTokens="{ item }">
        {{ numeral(web3.utils.fromWei(item.subgraphDeployment.stakedTokens.toString())).format('0,0') }} GRT
      </template>
      <template v-slot:item.proportion="{ item }">
        {{ numeral(item.proportion*100).format('0,0.000') }}%
      </template>
      <template v-slot:item.apr="{ item }">
        {{ numeral(item.apr).format('0,0.00') }}%
      </template>
      <template v-slot:item.newapr="{ item }">
        {{ numeral(item.newapr).format('0,0.00') }}%
      </template>
      <template v-slot:item.dailyrewards="{ item }">
        {{ numeral(web3.utils.fromWei(web3.utils.toBN(item.dailyrewards))).format('0,0') }} GRT
      </template>
      <template v-slot:item.dailyrewards_cut="{ item }">
        {{ numeral(web3.utils.fromWei(web3.utils.toBN(item.dailyrewards_cut))).format('0,0') }} GRT
      </template>
      <template v-slot:body.append>

      </template>
    </v-data-table>
  </div>
</template>

<script>
import gql from 'graphql-tag';
import t from "typy";
import numeral from 'numeral';
export default {
  name: "IndexerCurrentState",
  apollo: {
    allocations: {
      query: gql`query allocations($indexer: String!){
        allocations(where: {indexer: $indexer}, orderBy:createdAtBlockNumber, orderDirection:desc){
          id
          activeForIndexer{
            id
          }
          subgraphDeployment{
            versions(first:1, orderBy:version, orderDirection:desc){
              subgraph{
                image
                displayName
              }
            }
            ipfsHash
            createdAt
            originalName
            stakedTokens
            indexingRewardAmount
            signalledTokens
            queryFeesAmount
          }
          allocatedTokens
          effectiveAllocation
          createdAt
          createdAtEpoch
          createdAtBlockHash
          createdAtBlockNumber
          indexingRewards
          indexingIndexerRewards
          indexingDelegatorRewards
        }

      }`,
      variables(){
        return{
          indexer: this.indexer
        }
      },
      update (data) {
        this.$store.state.allocations = [];

        for(let i = 0; i < data.allocations.length; i++){
          let allocation = data.allocations[i];

          // activeDuration & readableDuration
          if(allocation.activeForIndexer != null) {
            allocation.activeDuration = this.$moment().unix() - allocation.createdAt;
            allocation.readableDuration = this.readableDuration(allocation.activeDuration);
            console.log(allocation.activeDuration);
            console.log(allocation.readableDuration);

            // proportion
            if (allocation.subgraphDeployment.stakedTokens > 0)
              allocation.proportion = allocation.subgraphDeployment.signalledTokens / allocation.subgraphDeployment.stakedTokens;
            else
              allocation.proportion = 0;

            // apr, new apr & daily rewards
            if (allocation.subgraphDeployment.signalledTokens > 0) {
              allocation.apr = this.apr(allocation.subgraphDeployment.signalledTokens, allocation.subgraphDeployment.stakedTokens);
              allocation.dailyrewards = this.dailyrewards(allocation.subgraphDeployment.signalledTokens, allocation.allocatedTokens, allocation.subgraphDeployment.stakedTokens);
              allocation.dailyrewards_cut = this.indexerCut(allocation.dailyrewards);

            } else {
              allocation.apr = 0;
              allocation.dailyrewards = 0;
              allocation.dailyrewards_cut = 0;
            }

            this.$store.state.allocations.push(allocation);
          }
        }
        return this.$store.state.allocations;
      },
      result ({ data, loading, networkStatus }) {
        data;
        loading;
        networkStatus;
        /*if(data.allocations.length == 100){
          //this.$apollo.queries.subgraphs.setVariables({skip: this.$store.state.subgraphCount});
          this.$apollo.queries.subgraphs.setOptions({
            fetchPolicy: 'network-only'
          });
          this.$apollo.queries.subgraphs.refetch({skip: this.$store.state.subgraphCount});
        }else{
          this.loading = false;
        }*/
        this.loading = false;
      },
    },
  },
  data () {
    return {
      search: '',
      max_signal: '',
      min_signal: '',
      new_allocation: '100000',
      web3: this.$store.state.web3,
      allocations: this.$store.state.allocations,
      allocations_per_page: this.$store.state.allocations_per_page,
      numeral,
      sortBy: 'activeDuration',
      sortDesc: true,
      loading: true,
      moment: this.$moment,
    }
  },
  props: {
    indexer: String,
    selectable: Boolean,
  },
  computed: {
    headers () {
      return [
        {
          text: 'Img',
          align: 'start',
          sortable: false,
          value: 'subgraphDeployment.versions[0].subgraph.image',
        },
        { text: 'Name', value: 'subgraphDeployment.versions[0].subgraph.displayName' },
        { text: 'Allocated', value: 'allocatedTokens'},
        { text: 'Created', value: 'createdAt' },
        { text: 'Allocation Duration', value: 'activeDuration'},
        { text: 'Current APR', value: 'apr'},
        { text: 'Est Daily Rewards (Before Cut)', value: 'dailyrewards'},
        { text: 'Est Daily Rewards (After Cut)', value: 'dailyrewards_cut'},
        {
          text: 'Current Signal',
          value: 'subgraphDeployment.signalledTokens',
          filter: value => {
            let BigNumber = this.$store.state.bigNumber;
            if(parseInt(this.max_signal) && BigNumber(value).isGreaterThan(new BigNumber(this.$store.state.web3.utils.toWei(this.max_signal))))
              return false;
            if(parseInt(this.min_signal) && BigNumber(value).isLessThan(new BigNumber(this.$store.state.web3.utils.toWei(this.min_signal))))
              return false;
            return true;
          },
        },
        { text: 'Current Proportion', value: 'proportion'},
        { text: 'Current Allocations', value: 'subgraphDeployment.stakedTokens'},
        { text: 'Total Query Fees', value: 'subgraphDeployment.queryFeesAmount'},
        { text: 'Total Indexing Rewards', value: 'subgraphDeployment.indexingRewardAmount'},
        { text: 'Deployment ID', value: 'subgraphDeployment.ipfsHash', sortable: false },
      ]
    },
  },
  methods: {
    apr: function(signalledTokens, stakedTokens){
      let BigNumber = this.$store.state.bigNumber;

      // signalledTokens / totalTokensSignalled * issuancePerYear / stakedTokens * 100
      return new BigNumber(signalledTokens)
          .dividedBy(this.$store.state.graphNetwork.totalTokensSignalled)
          .multipliedBy(this.$store.state.graphNetwork.issuancePerYear)
          .dividedBy(stakedTokens)
          .multipliedBy(100);
    },
    dailyrewards: function(signalledTokens, allocatedTokens, stakedTokens){
      let BigNumber = this.$store.state.bigNumber;

      // currentSignalledTokens / totalTokensSignalled * issuancePerBlock * blocks per day * (new_allocation / (stakedTokens + new_allocation))
      return new BigNumber(signalledTokens)
          .dividedBy(this.$store.state.graphNetwork.totalTokensSignalled)
          .multipliedBy(this.$store.state.graphNetwork.issuancePerBlock)
          .multipliedBy(6450)
          .multipliedBy(
              new BigNumber(new BigNumber(allocatedTokens)).dividedBy(new BigNumber(stakedTokens))
          ).dp(0);
    },
    indexerCut: function(dailyRewards){
      return this.$store.state.indexingRewardCut == 1000000 ? dailyRewards : Math.floor(dailyRewards * this.$store.state.indexingRewardCut / 1000000);
    },
    updateAllocationsPerPage: function(){
      this.$cookies.set("allocations_per_page", this.allocations_per_page);
      this.$store.state.allocations_per_page = this.allocations_per_page;
    },
    customSort: function(items, index, isDesc) {
      console.log(items);
      items.sort((a, b) => {
        if (index[0] == 'createdAt'
            || index[0] == 'subgraphDeployment.signalledTokens'
            || index[0] == 'subgraphDeployment.stakedTokens'
            || index[0] == 'subgraphDeployment.indexingRewardAmount'
            || index[0] == 'subgraphDeployment.queryFeesAmount'
            || index[0] == 'proportion'
            || index[0] == 'apr'
            || index[0] == 'newapr'
            || index[0] == 'dailyrewards'
            || index[0] == 'activeDuration'
            || index[0] == 'allocatedTokens'
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
    updateAllocations: function(){
      this.$store.state.indexer = this.indexer;
      this.$cookies.set("indexer",this.indexer);
    },
    readableDuration: function(seconds) {
      seconds = Number(seconds);
      let d = Math.floor(seconds / (3600*24));
      let h = Math.floor(seconds % (3600*24) / 3600);
      let m = Math.floor(seconds % 3600 / 60);
      return `${d}d ${h}h ${m}m`;
    }
  },
}
</script>

<style scoped>

</style>