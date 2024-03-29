<template>
  <div :key="this.indexingRewardCut">
    <v-data-table
        :headers="headers"
        :items="this.$store.state.subgraphs"
        item-key="name"
        class="elevation-1"
        :search="search"
        :custom-sort="customSort"
        :sort-by.sync="sortBy"
        :sort-desc.sync="sortDesc"
        :footer-props="{
          'items-per-page-options': [10, 15, 20, 25, 30, 40, 50]
        }"
        :items-per-page.sync="subgraphs_per_page"
        @update:items-per-page="updateSubgraphsPerPage"
        :loading="this.loading"
        loading-text="Loading... Please wait"
        mobile-breakpoint="0"
    >
      <template v-slot:top>
        <tr>
          <td  class="mx-4">
            <v-text-field
                v-model="search"
                label="Search"
                class="mx-4"
            ></v-text-field>
          </td>
          <td class="mx-4">
            <v-text-field
                v-model="min_signal"
                type="number"
                label="Min Signal"
                class="mx-4"
            ></v-text-field>
          </td>
          <td>
            <v-text-field
                v-model="max_signal"
                type="number"
                label="Max Signal"
                class="mx-4"
            ></v-text-field>
          </td>
          <td>
            <v-text-field
                v-model="new_allocation"
                type="number"
                label="New Allocation"
                @change="updateEstApr"
                class="mx-4"
            ></v-text-field>
          </td>
          <td colspan="4"></td>
        </tr>
      </template>
      <template v-slot:item.image="{ item }">
        <img :src="item.image" width="25" height="25"/>
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
  name: "SubgraphsTable",
  apollo: {
    subgraphs: {
      query: gql`query subgraphs($skip: Int!){
        subgraphs (skip: $skip){
          id
          displayName
          createdAt
          currentSignalledTokens
          image
          currentVersion{
            subgraphDeployment{
              ipfsHash
              indexingRewardAmount
              queryFeesAmount
              stakedTokens
              createdAt
            }
          }
        }
      }`,
      variables(){
        return{
          skip: 0
        }
      },
      update (data) {
        for(let i = 0; i < data.subgraphs.length; i++){
          let subgraph = data.subgraphs[i];

          // proportion
          if(subgraph.currentVersion.subgraphDeployment.stakedTokens > 0)
            data.subgraphs[i].proportion = subgraph.currentSignalledTokens / subgraph.currentVersion.subgraphDeployment.stakedTokens;
          else
            data.subgraphs[i].proportion = 0;

          // apr, new apr & daily rewards
          if(subgraph.currentSignalledTokens > 0) {
            data.subgraphs[i].apr = this.newapr(subgraph.currentSignalledTokens, subgraph.currentVersion.subgraphDeployment.stakedTokens, "0");
            data.subgraphs[i].newapr = this.newapr(subgraph.currentSignalledTokens, subgraph.currentVersion.subgraphDeployment.stakedTokens, this.$store.state.new_allocation);
            data.subgraphs[i].dailyrewards = this.dailyrewards(subgraph.currentSignalledTokens, subgraph.currentVersion.subgraphDeployment.stakedTokens, this.$store.state.new_allocation);
            data.subgraphs[i].dailyrewards_cut = this.indexerCut(data.subgraphs[i].dailyrewards);
          } else {
            data.subgraphs[i].apr = 0;
            data.subgraphs[i].newapr = 0;
            data.subgraphs[i].dailyrewards = 0;
            data.subgraphs[i].dailyrewards_cut = 0;
          }

          // exclude duplicates
          if(!this.$store.state.subgraph_ids.includes(subgraph.currentVersion.subgraphDeployment.ipfsHash)){
            this.$store.state.subgraphs.push(subgraph);
            this.$store.state.subgraph_ids.push(subgraph.currentVersion.subgraphDeployment.ipfsHash);
          }

        }
        this.$store.state.subgraphCount += data.subgraphs.length;
        console.log(this.$store.state.subgraphCount);
        return data.subgraphs;
      },
      result ({ data, loading, networkStatus }) {
        data;
        loading;
        networkStatus;
        //console.log(data.subgraphs.length);
        if(networkStatus == 7 && data.subgraphs.length == 100){
          //this.$apollo.queries.subgraphs.setVariables({skip: this.$store.state.subgraphCount});
          this.$apollo.queries.subgraphs.setOptions({
            fetchPolicy: 'network-only'
          });
          this.$apollo.queries.subgraphs.refetch({skip: this.$store.state.subgraphCount});
        }else{
          this.loading = false;
        }
      },
    },
  },
  data () {
    return {
      search: '',
      max_signal: '',
      min_signal: '',
      new_allocation: this.$store.state.new_allocation,
      web3: this.$store.state.web3,
      subgraphs: this.$store.state.subgraphs,
      subgraphs_per_page: this.$store.state.subgraphs_per_page,
      numeral,
      sortBy: 'newapr',
      sortDesc: true,
      loading: true,
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
        { text: 'Current Allocations', value: 'currentVersion.subgraphDeployment.stakedTokens'},
        { text: 'Total Query Fees', value: 'currentVersion.subgraphDeployment.queryFeesAmount'},
        { text: 'Total Indexing Rewards', value: 'currentVersion.subgraphDeployment.indexingRewardAmount'},
        { text: 'Deployment ID', value: 'currentVersion.subgraphDeployment.ipfsHash', sortable: false },
      ]
    },
  },
  props: {
    indexingRewardCut: Number,
  },
  methods: {
    newapr: function(currentSignalledTokens, stakedTokens, new_allocation){
      let BigNumber = this.$store.state.bigNumber;

      // signalledTokens / totalTokensSignalled * issuancePerYear / (stakedTokens + new_allocation)
      return new BigNumber(currentSignalledTokens)
          .dividedBy(this.$store.state.graphNetwork.totalTokensSignalled)
          .multipliedBy(this.$store.state.graphNetwork.issuancePerYear)
          .dividedBy(
              new BigNumber(stakedTokens).plus(this.$store.state.web3.utils.toWei(new_allocation))
          ).multipliedBy(100);
    },
    dailyrewards: function(currentSignalledTokens, stakedTokens, new_allocation){
      let BigNumber = this.$store.state.bigNumber;

      // currentSignalledTokens / totalTokensSignalled * issuancePerBlock * blocks per day * (new_allocation / (stakedTokens + new_allocation))
      return new BigNumber(currentSignalledTokens)
          .dividedBy(this.$store.state.graphNetwork.totalTokensSignalled)
          .multipliedBy(this.$store.state.graphNetwork.issuancePerBlock)
          .multipliedBy(6450)
          .multipliedBy(
              new BigNumber(this.$store.state.web3.utils.toWei(new_allocation)).dividedBy(new BigNumber(stakedTokens).plus(this.$store.state.web3.utils.toWei(new_allocation)))
          ).dp(0);
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
}
</script>

<style scoped>

</style>