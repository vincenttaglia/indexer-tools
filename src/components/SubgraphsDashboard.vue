<template>
  <div :key="this.indexingRewardCut">
    <v-data-table
        :headers="headers"
        :items="filteredSubgraphs"
        item-key="currentVersion.subgraphDeployment.ipfsHash"
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
        :show-select="this.selectable"
        v-model="selected"
        :key="id_key"
    >
      <template v-slot:header="{ props: { headers } }" v-if="!selectable">
        <tr v-sortable="{onEnd:updateHeaderOrder}">
          <template v-for="header in headers"  >
            <th :key="header.text"> 
              <v-icon left>
                mdi-drag-horizontal
              </v-icon>
            </th>
          </template>
        </tr>
      </template>
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
          <td>
            <v-text-field
                v-model="target_apr"
                type="number"
                label="Target APR"
                @change="updateTargetApr"
                class="mx-4"
            ></v-text-field>
          </td>
          <td>
            <v-select
                v-model="noRewardsFilter"
                :items="[{text: 'Exclude Denied', action: 0}, {text:'Include Denied', action: 1}, {text: 'Only Denied', action: 2}]"
                item-text="text"
                item-value="action"
                label="Subgraphs w/ Denied Rewards"
                style="width: 200px;"
                class="mx-4"
            ></v-select>
          </td>
          <td>
            <v-select
                v-model="networkFilter"
                :items="networks"
                label="Subgraph Networks"
                multiple
                chips
                class="mx-4"
                style="top: -5px"
            ></v-select>
          </td>
          <td>
            <v-checkbox
              v-model="activateBlacklist"
              label="Blacklist"
              class="mr-3"
            ></v-checkbox>
          </td>
          <td>
            <v-checkbox
              v-model="activateSynclist"
              label="Synclist"
            ></v-checkbox>
          </td>
          <td colspan="4"></td>
        </tr>
      </template>
      <template v-slot:item.image="{ item }">
        <v-badge
            :value="item.currentVersion.subgraphDeployment.deniedAt"
            bordered
            color="error"
            icon="mdi-currency-usd-off"
            overlap
            avatar
            v-if="(item.currentVersion.subgraphDeployment.deniedAt && item.currentlyAllocated) || (!item.currentVersion.subgraphDeployment.deniedAt && !item.currentlyAllocated) || (item.currentVersion.subgraphDeployment.deniedAt && !item.currentlyAllocated)"
        >
          <v-avatar size="30">
            <v-img :src="item.image" />
          </v-avatar>
        </v-badge>
        <v-badge
            :value="item.currentlyAllocated"
            bordered
            color="warning"
            icon="mdi-exclamation-thick"
            overlap
            avatar
            v-if="!item.currentVersion.subgraphDeployment.deniedAt && item.currentlyAllocated"
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
      <template v-slot:item.currentVersion.subgraphDeployment.network.id="{ item }">
        {{ item.currentVersion.subgraphDeployment.network ? item.currentVersion.subgraphDeployment.network.id : "null" }}
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
      <template v-slot:item.max_allo="{ item }">
        {{ numeral(item.max_allo).format('0,0') }} GRT
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
import Sortable from 'sortablejs';
export default {
  name: "SubgraphsDashboard",
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
              deniedAt
              network{
                id
              }
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

          // networks
          //if(subgraph.currentVersion.subgraphDeployment.network != null && !this.networks.includes(subgraph.currentVersion.subgraphDeployment.network.id))
          //  this.networks.push(subgraph.currentVersion.subgraphDeployment.network.id);

          // proportion
          if(subgraph.currentVersion.subgraphDeployment.stakedTokens > 0)
            data.subgraphs[i].proportion = subgraph.currentSignalledTokens / subgraph.currentVersion.subgraphDeployment.stakedTokens;
          else
            data.subgraphs[i].proportion = 0;

          // apr, new apr & daily rewards
          if(subgraph.currentSignalledTokens > 0) {
            let stakedTokens;

            let allo = this.simulateClosingAllocations.find(e => {
              return e.subgraphDeployment.ipfsHash === subgraph.currentVersion.subgraphDeployment.ipfsHash;
            });

            if(allo){
              stakedTokens = subgraph.currentVersion.subgraphDeployment.stakedTokens - allo.allocatedTokens;
              data.subgraphs[i].currentlyAllocated = false;
            } else{
              stakedTokens = subgraph.currentVersion.subgraphDeployment.stakedTokens;
              let isAlloed = this.$store.state.allocations.find(e => {
                return e.subgraphDeployment.ipfsHash === subgraph.currentVersion.subgraphDeployment.ipfsHash;
              })
              data.subgraphs[i].currentlyAllocated = isAlloed;
            }
            data.subgraphs[i].apr = this.newapr(subgraph.currentSignalledTokens, subgraph.currentVersion.subgraphDeployment.stakedTokens, "0");
            data.subgraphs[i].newapr = this.newapr(subgraph.currentSignalledTokens, stakedTokens, this.new_allocation);
            data.subgraphs[i].max_allo = this.maxAllo(this.target_apr, subgraph.currentSignalledTokens, stakedTokens);
            data.subgraphs[i].dailyrewards = this.dailyrewards(subgraph.currentSignalledTokens, stakedTokens, this.new_allocation);
            data.subgraphs[i].dailyrewards_cut = this.indexerCut(data.subgraphs[i].dailyrewards);
          } else {
            data.subgraphs[i].apr = 0;
            data.subgraphs[i].newapr = 0;
            data.subgraphs[i].max_allo = 0;
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
        return this.$store.state.subgraphs;
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
          this.updateEstApr();
        }
      },
    },
  },
  directives: {
    'sortable': {
        inserted: function ( el, binding, vNode) {
          vNode;
          new Sortable( el, binding.value || {} )
        }
      }
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
      sortBy: this.$store.state.subgraphSortBy,
      sortDesc: this.$store.state.subgraphSortDesc,
      selected: [],
      noRewardsFilter: 0,
      loading: true,
      networks: ["mainnet", "gnosis", "arbitrum-one", "celo", "polygon", "avalanche", "goerli", "rinkeby"],
      networkFilter: [],
      id_key: 1,
      header_order: this.$store.state.subgraphHeaderOrder,
      activateSynclist: false,
      activateBlacklist: true,
      target_apr: this.$store.state.target_apr,
      header_objects: {
        0: {
          text: 'Img',
          align: 'start',
          sortable: false,
          value: 'image',
        },
        1: { text: 'Name', value: 'displayName' },
        2: { text: 'Created', value: 'currentVersion.subgraphDeployment.createdAt' },
        3: { text: 'Current APR', value: 'apr'},
        4: { text: 'New APR', value: 'newapr'},
        5: { text: 'Est Daily Rewards (Before Cut)', value: 'dailyrewards'},
        6: { text: 'Est Daily Rewards (After Cut)', value: 'dailyrewards_cut'},
        7: {
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
        8: { text: 'Current Proportion', value: 'proportion'},
        9: { text: 'Current Allocations', value: 'currentVersion.subgraphDeployment.stakedTokens'},
        10: { text: 'Total Query Fees', value: 'currentVersion.subgraphDeployment.queryFeesAmount'},
        11: { text: 'Total Indexing Rewards', value: 'currentVersion.subgraphDeployment.indexingRewardAmount'},
        12: { text: 'Deployment ID', value: 'currentVersion.subgraphDeployment.ipfsHash', sortable: false },
        13: { text: 'Network', value: 'currentVersion.subgraphDeployment.network.id'},
        14: { text: 'Max Allocation', value: 'max_allo'}
      },
    }
  },
  computed: {
    headers(){
      let headers = [];
      for(let header_index in this.header_order){
        headers.push(this.header_objects[this.header_order[header_index]])
      }
      return headers;
    },
    filteredSubgraphs(){
      let subgraphs = this.subgraphs;
      let networkFilter = this.networkFilter;

      if(this.noRewardsFilter === 0){
        subgraphs = subgraphs.filter((i) => {
          return !i.currentVersion.subgraphDeployment.deniedAt;
        });
      } else if(this.noRewardsFilter === 2){
        subgraphs = subgraphs.filter((i) => {
          return i.currentVersion.subgraphDeployment.deniedAt;
        });
      }

      if(networkFilter.length) {
        subgraphs = subgraphs.filter((i) => {
          return i.currentVersion.subgraphDeployment.network && networkFilter.includes(i.currentVersion.subgraphDeployment.network.id);
        });
      }

      if(this.activateBlacklist) {
        subgraphs = subgraphs.filter((i) => {
          return !this.$store.state.subgraphBlacklist.includes(i.currentVersion.subgraphDeployment.ipfsHash);
        });
      }

      if(this.activateSynclist) {
        subgraphs = subgraphs.filter((i) => {
          return this.$store.state.subgraphSynclist.includes(i.currentVersion.subgraphDeployment.ipfsHash);
        });
      }
      return subgraphs
    },
  },
  props: {
    indexingRewardCut: Number,
    selectable: Boolean,
    simulateClosingAllocations: Array,
  },
  methods: {
    maxAllo(target_apr_dec, signalledTokens, stakedTokens){
      let BigNumber = this.$store.state.bigNumber;
      let target_apr = new BigNumber(target_apr_dec).dividedBy(100);

      // signalledTokens / totalTokensSignalled * issuancePerYear / apr - stakedTokens = maxAllocation
      try{
        return new BigNumber(signalledTokens)
            .dividedBy(this.$store.state.graphNetwork.totalTokensSignalled)
            .multipliedBy(this.$store.state.graphNetwork.issuancePerYear)
            .dividedBy(target_apr)
            .minus(stakedTokens)
            .dividedBy(new BigNumber(10).pow(18));
      }catch(e){
        return 0;
      }
    },
    updateTargetApr(){
      this.$cookies.set("target_apr", this.target_apr);
      this.$store.state.target_apr = this.target_apr;
      
      for(let i = 0; i < this.$store.state.subgraphs.length; i++){
        let subgraph = this.$store.state.subgraphs[i];
        if(subgraph.currentSignalledTokens > 0) {
          let stakedTokens;

          let allo = this.simulateClosingAllocations.find(e => {
            return e.subgraphDeployment.ipfsHash === subgraph.currentVersion.subgraphDeployment.ipfsHash;
          });

          if(allo){
            stakedTokens = subgraph.currentVersion.subgraphDeployment.stakedTokens - allo.allocatedTokens;
          } else{
            stakedTokens = subgraph.currentVersion.subgraphDeployment.stakedTokens;
          }
          this.$store.state.subgraphs[i].max_allo = this.maxAllo(this.target_apr, subgraph.currentSignalledTokens, stakedTokens);
        }
      }
    },
    updateHeaderOrder ( evt ) {
          let headers = this.header_order;
          let old_index = evt.oldIndex;
          let new_index = evt.newIndex;
          if ( new_index >= headers.length) {
              var k = new_index - headers.length + 1;
              while (k--) {
                  headers.push(undefined);
              }
          }
          headers.splice(new_index, 0, headers.splice(old_index, 1)[0]);
          this.header_order = headers;
          this.$store.state.indexerHeaderOrder = headers;
          this.id_key++;

          this.$cookies.set("subgraph_header_order", JSON.stringify(headers));
          
    },
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
      this.$store.state.new_allocation = this.new_allocation;

      for(let i = 0; i < this.$store.state.subgraphs.length; i++){
        let subgraph = this.$store.state.subgraphs[i];
        if(subgraph.currentSignalledTokens > 0) {
          let stakedTokens;

          let allo = this.simulateClosingAllocations.find(e => {
            return e.subgraphDeployment.ipfsHash === subgraph.currentVersion.subgraphDeployment.ipfsHash;
          });

          if(allo){
            stakedTokens = subgraph.currentVersion.subgraphDeployment.stakedTokens - allo.allocatedTokens;
            this.$store.state.subgraphs[i].currentlyAllocated = false;
          } else{
            stakedTokens = subgraph.currentVersion.subgraphDeployment.stakedTokens;
            let isAlloed = this.$store.state.allocations.find(e => {
              return e.subgraphDeployment.ipfsHash === subgraph.currentVersion.subgraphDeployment.ipfsHash;
            })
            this.$store.state.subgraphs[i].currentlyAllocated = isAlloed;
          }

          this.$store.state.subgraphs[i].newapr = this.newapr(subgraph.currentSignalledTokens, stakedTokens, this.new_allocation);
          this.$store.state.subgraphs[i].dailyrewards = this.dailyrewards(subgraph.currentSignalledTokens, stakedTokens, this.new_allocation);
          this.$store.state.subgraphs[i].dailyrewards_cut = this.indexerCut(this.$store.state.subgraphs[i].dailyrewards);
        }
      }
    },
    updateSubgraphsPerPage: function(){
      this.$cookies.set("subgraphs_per_page", this.subgraphs_per_page);
      this.$store.state.subgraphs_per_page = this.subgraphs_per_page;
    },
    indexerCut: function(dailyRewards){
      if(dailyRewards.isLessThan(1))
        return 0;
      if(this.indexingRewardCut == 1000000)
        return dailyRewards
      return dailyRewards.multipliedBy(this.indexingRewardCut).dividedBy(1000000).dp(0,1);
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
            || index[0] == 'max_allo'
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
    selected: function(value) {
      this.$emit("subgraphs-selected", value);
    },
    loading: function(){
      this.$emit("update-loading");
    },
    sortBy: function(value){
      this.$store.state.subgraphSortBy = value;
      this.$cookies.set("subgraph_sort_by",value);
    },
    sortDesc: function(value){
      this.$store.state.subgraphSortDesc = value;
      this.$cookies.set("subgraph_sort_desc",value);
    }
  }
}
</script>

<style scoped>

</style>