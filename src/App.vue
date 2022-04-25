<template>
  <v-app>
    <v-app-bar
      app
      color="#5a3c57"
      dark
    >
      <div class="d-flex align-center ">
        <h1>
          Indexer Tools
        </h1>
      </div>

      <v-spacer></v-spacer>

      <v-btn
        href="https://vincenttaglia.eth.link/"
        target="_blank"
        text
        class="hidden-sm-and-down"
      >
        <span class="mr-2">Made with ♥ by vincenttaglia.eth</span>
        <v-icon>mdi-open-in-new</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <IndexerCurrentState/>
      <SubgraphsTable/>
    </v-main>
    <v-footer
    dark
    padless
    >
      <v-card
        flat
        tile
        class="white--text text-center"
        style="background-color:#5a3c57; width: 100%"
      >
        <v-card-text>
          <v-btn
            class="mx-4 white--text"
            icon
            href="https://github.com/vincenttaglia/indexer-tools"
            target="_blank"
          >
            <v-icon size="24px">
              mdi-github
            </v-icon>
          </v-btn>
        </v-card-text>
      </v-card>

    </v-footer>
  </v-app>
</template>

<script>
import SubgraphsTable from "@/components/SubgraphsTable";
import IndexerCurrentState from "@/components/IndexerCurrentState";

export default {
  name: 'indexer-tools',

  components: {
    IndexerCurrentState,
    SubgraphsTable,
  },

  data: () => ({
    //
  }),
};
</script>

<style>
body{
  background-color: #999;
  color: #000;
}
</style>
