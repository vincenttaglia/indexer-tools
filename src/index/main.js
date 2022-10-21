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
import OverviewBrowser from "../components/OverviewBrowser";
import AllocationWizard from "../components/AllocationWizard";
import VueRouter from "vue-router";
import BookmarkSupport from "../components/BookmarkSupport";


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
    indexerAccounts: Vue.$cookies.get("indexerAccounts") ? JSON.parse(Vue.$cookies.get("indexerAccounts")) : [{name: "vincenttaglia.eth", active: true, address: Vue.$cookies.get("indexer") ? Vue.$cookies.get("indexer") : "0xeddd4ec5d3775de964416b7b9d4da885f530f90a" }],
    new_allocation: Vue.$cookies.get("new_allocation") ? Vue.$cookies.get("new_allocation") : "100000",
    allocations_per_page: Vue.$cookies.get("allocations_per_page") ? parseInt(Vue.$cookies.get("allocations_per_page")) : 15,
    subgraphs_per_page: Vue.$cookies.get("subgraphs_per_page") ? parseInt(Vue.$cookies.get("subgraphs_per_page")) : 15,
    indexingRewardCut: 0,
  },
  mutations: {

  }
})

Vue.use(VueRouter)

const routes = [
  { path: '/', component: OverviewBrowser }, //, props: { indexer: store.state.indexer, indexingRewardCut: store.state.indexingRewardCut }
  { path: '/wizard', component: AllocationWizard },
  { path: '/indexer/:urlIndexer', component: BookmarkSupport, props: true },
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
