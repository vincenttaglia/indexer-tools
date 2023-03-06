import Vue from 'vue'
import Vuex from 'vuex'
import App from './App.vue'
import vuetify from '../plugins/vuetify'
import VueApollo from 'vue-apollo'
import { ApolloClient } from 'apollo-client'
import { createHttpLink } from 'apollo-link-http'
import { InMemoryCache } from 'apollo-cache-inmemory'
import Web3 from 'web3';
import t from 'typy';
import BigNumber from "bignumber.js";
import numeral from 'numeral';

import VueCookies from 'vue-cookies';
import AllocationWizard from "../components/AllocationWizard";
import SubgraphsDashboard from "../components/SubgraphsDashboard";
import AllocationsDashboard from "../components/AllocationsDashboard";
import VueRouter from "vue-router";
import BookmarkSupport from "../components/BookmarkSupport";
import Settings from "../components/Settings";
import namehash from "@ensdomains/eth-ens-namehash";


Vue.use(Vuex)

Vue.use(VueCookies);



Vue.$cookies.config(-1, "/", "",false, "Strict")

const store = new Vuex.Store({
  state: {
    subgraphs: [],
    subgraph_ids: [],
    subgraphCount: 0,
    allocations: [],
    indexer: Vue.$cookies.get("indexer") ? Vue.$cookies.get("indexer") : "0xeddd4ec5d3775de964416b7b9d4da885f530f90a",
    indexerAccounts: Vue.$cookies.isKey("indexerAccounts") ? JSON.parse(Vue.$cookies.get("indexerAccounts")) : [{name: "vincenttaglia.eth", active: true, address: Vue.$cookies.get("indexer") ? Vue.$cookies.get("indexer") : "0xeddd4ec5d3775de964416b7b9d4da885f530f90a" }],
    new_allocation: Vue.$cookies.isKey("new_allocation") ? Vue.$cookies.get("new_allocation") : "100000",
    target_apr: Vue.$cookies.isKey("target_apr") ? Vue.$cookies.get("target_apr"): "10",
    allocations_per_page: Vue.$cookies.isKey("allocations_per_page") ? parseInt(Vue.$cookies.get("allocations_per_page")) : 15,
    subgraphs_per_page: Vue.$cookies.isKey("subgraphs_per_page") ? parseInt(Vue.$cookies.get("subgraphs_per_page")) : 15,
    indexingRewardCut: 0,
    automaticIndexingRewards: Vue.$cookies.get("automatic_indexing_rewards") === "true",
    indexerHeaderOrder: Vue.$cookies.isKey("indexer_header_order") ? JSON.parse(Vue.$cookies.get("indexer_header_order")) : [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
    subgraphHeaderOrder: Vue.$cookies.isKey("subgraph_header_order") ? JSON.parse(Vue.$cookies.get("subgraph_header_order")) : [0,1,13,2,3,4,14,5,6,7,8,9,10,11,12],
    indexerSortBy: Vue.$cookies.isKey("indexer_sort_by") ? Vue.$cookies.get("indexer_sort_by") : 'activeDuration',
    indexerSortDesc: Vue.$cookies.isKey("indexer_sort_desc")? Vue.$cookies.get("indexer_sort_desc") === "true" : true,
    subgraphSortBy: Vue.$cookies.isKey("subgraph_sort_by") ? Vue.$cookies.get("subgraph_sort_by") : 'newapr',
    subgraphSortDesc: Vue.$cookies.isKey("subgraph_sort_desc") ? Vue.$cookies.get("subgraph_sort_desc") === "true" : true,
    subgraphBlacklist: Vue.$cookies.get("subgraph_blacklist") ? Vue.$cookies.get("subgraph_blacklist") : "",
    subgraphSynclist: Vue.$cookies.get("subgraph_synclist") ? Vue.$cookies.get("subgraph_synclist") : "",
  },
  mutations: {

  }
})

Vue.use(VueRouter)

const routes = [
  { path: '/', component: SubgraphsDashboard }, //, props: { indexer: store.state.indexer, indexingRewardCut: store.state.indexingRewardCut }
  { path: '/allocations', component: AllocationsDashboard },
  { path: '/wizard', component: AllocationWizard },
  { path: '/indexer/:urlIndexer', component: BookmarkSupport, props: true },
  { path: '/settings', component: Settings },
]

const router = new VueRouter({
  routes // short for `routes: routes`
})

store.state.bigNumber = BigNumber;
store.state.bigNumber.config({ POW_PRECISION: 1000 });

if (window.ethereum) {
  if(window.ethereum.networkVersion === "1"){
    store.state.web3 = new Web3(window.ethereum);
    console.log("Using provided RPC");
  }else{
    store.state.web3 = new Web3("https://mainnet.infura.io/v3/659344f230804542a4e653f875172105");
    console.log("Using backup RPC");
  }
  window.ethereum.on('networkChanged', function(networkId){
    console.log('networkChanged',networkId);
    if(networkId === "1"){
      store.state.web3 = new Web3(window.ethereum);
    }else{
      store.state.web3 = new Web3("https://mainnet.infura.io/v3/659344f230804542a4e653f875172105");
    }
  });
} else { // Non-dapp browsers...
  store.state.web3 = new Web3("https://mainnet.infura.io/v3/659344f230804542a4e653f875172105");
  console.log('No window.ethereum detected. Using backup RPC.');
}
Vue.use(Vuex)
Vue.use(VueApollo)
Vue.use(require('vue-moment'))

Vue.config.productionTip = false



// HTTP connection to the API
const httpLink = createHttpLink({
  // You should use an absolute URL here
  uri: 'https://api.thegraph.com/subgraphs/name/graphprotocol/graph-network-mainnet',
})

// Cache implementation
const cache = new InMemoryCache()

// Create the apollo client
const apolloClient = new ApolloClient({
  link: httpLink,
  cache,
  defaultOptions: {
    fetchPolicy: 'network-only'
  },
})

const apolloProvider = new VueApollo({
  defaultClient: apolloClient,
})

Vue.mixin({
  methods: {
    async getENS(address) {
        var lookup=address.toLowerCase().substr(2) + '.addr.reverse'
        var ResolverContract=await store.state.web3.eth.ens.resolver(lookup);
        var nh=namehash.hash(lookup);
        var name=await ResolverContract.methods.name(nh).call()
        return name;
    },
    setAutomaticIndexingRewards(setting){
      store.state.automaticIndexingRewards = setting;
      Vue.$cookies.set("automatic_indexing_rewards", setting);
    },
    updateIndexerAccounts(indexerAccounts){
        store.state.indexerAccounts = indexerAccounts;
        Vue.$cookies.set("indexerAccounts", JSON.stringify(store.state.indexerAccounts));
    },
    deleteIndexerAccount(indexerAccount){
        let account = store.state.indexerAccounts.find(e => e.address === indexerAccount.address);
        if(!account.active)
          this.updateIndexerAccounts(store.state.indexerAccounts.filter(function(e) { return e.address !== indexerAccount.address; }));
    },
    updateIndexerName(indexer, name){
      let indexerAccount = store.state.indexerAccounts.find(e => e.address == indexer);
      indexerAccount.name = name;
    },
    activateIndexerAccount(indexer){
      let activeAccount = store.state.indexerAccounts.find(e => e.active);
      let indexerAccount = store.state.indexerAccounts.find(e => e.address === indexer);
      activeAccount.active = false;
      indexerAccount.active = true;
      store.state.indexer = indexerAccount.address;
      Vue.$cookies.set("indexer", indexerAccount.address);
      Vue.$cookies.set("indexerAccounts", JSON.stringify(store.state.indexerAccounts));
    },
    addIndexerAccount(indexer, name){
        let lookup = store.state.indexerAccounts.find(e => e.address === indexer);
        if(!lookup){

            let newAccount = {
            name: name,
            address: indexer,
            active: false,
            }
            if(name === "") {
            this.getENS(indexer).then((name) => {
                newAccount.name = name;
                store.state.indexerAccounts.push(newAccount);
                this.activateIndexerAccount(indexer);
                Vue.$cookies.set("indexerAccounts", JSON.stringify(store.state.indexerAccounts));
            }).catch(()=>{
                newAccount.name = "New Account";
            });
            }else{
            store.state.indexerAccounts.push(newAccount);
            this.activateIndexerAccount(indexer);
            Vue.$cookies.set("indexerAccounts", JSON.stringify(store.state.indexerAccounts));
            }

        }else{
            this.activateIndexerAccount(lookup);
        }

    },
  }
})


new Vue({
  vuetify,
  apolloProvider,
  t,
  BigNumber,
  numeral,
  store,
  router,
  render: h => h(App)
}).$mount('#app')


