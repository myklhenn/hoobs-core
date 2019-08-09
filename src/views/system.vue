<template>
    <div v-if="user.admin" id="system">
        <div class="info">
            <a href="#software">{{ $t("software") }}</a>
            <div v-for="(section, title) in info" :key="title">
                <a :href="`#h-${title}`">{{ humanize(title) }}</a>
            </div>
        </div>
        <div class="content">
            <div class="system-content">
                <h2 id="software">{{ $t("software") }}</h2>
                <div class="update-card">
                    <b>HOOBS Core</b>
                    <span v-if="status">Current Version: {{ status.hoobs_version }}</span>
                    <div v-if="checking" class="update-actions">
                        <loading-marquee :height="3" color="--title-text" background="--title-text-dim" />
                    </div>
                    <div v-else-if="updates.length > 0" class="update-actions">
                        <b>{{ updates[0].version }} {{ $t("update_available") }}</b><br>
                        <div class="button button-primary">{{ $t("update") }}</div>
                    </div>
                    <div v-else class="update-actions">
                        <b>{{ $t("up_to_date") }}</b>
                    </div>
                </div>
            </div>
            <div v-if="info" class="system-content">
                <div v-for="(section, title) in info" :key="title">
                    <h2 :id="`h-${title}`">{{ humanize(title) }}</h2>
                    <table>
                        <tbody>
                            <tr v-for="(value, name) in section" :key="name">
                                <td style="min-width: 250px;">{{ humanize(name) }}</td>
                                <td style="width: 100%;">{{ value }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import Decamelize from "decamelize";
    import Inflection from "inflection";

    import Marquee from "@/components/loading-marquee.vue";
    import { setTimeout } from 'timers';

    export default {
        name: "system",

        components: {
            "loading-marquee": Marquee
        },

        computed: {
            user() {
                return this.$store.state.user;
            }
        },

        data() {
            return {
                info: null,
                status: null,
                checking: true,
                updates: []
            }
        },

        async mounted() {
            this.info = await this.api.get("/system");
            this.status = await this.api.get("/");

            this.checkVersion();
        },

        methods: {
            async checkVersion() {
                this.checking = true;
                this.updates = await this.api.get("/system/updates");

                setTimeout(() => {
                    this.checking = false;
                }, 1000);
            },

            humanize(string) {
                return Inflection.titleize(Decamelize(string.replace(/-/gi, " ").replace(/homebridge/gi, "").trim()));
            }
        }
    }
</script>

<style scoped>
    #system {
        flex: 1;
        padding: 0;
        display: flex;
        overflow: hidden;
    }

    #system .info {
        width: 210px;
        padding: 20px 0 20px 20px;
    }

    #system .info a,
    #system .info a:link,
    #system .info a:active,
    #system .info a:visited {
        padding: 10px;
        border-bottom: 1px var(--border) solid;
        color: var(--text);
        text-decoration: none;
        display: block;
    }

    #system .info a:hover {
        color: var(--text-dark);
    }

    #system .content {
        flex: 1;
        padding: 20px;
        display: flex;
        flex-direction: column;
        overflow: auto;
    }

    #system .system-content {
        width: 100%;
        max-width: 780px;
        margin: 20px 0 0 0;
    }

    #system .system-content:first-child {
        margin: 0;
    }

    #system .update-card {
        padding: 20px;
        display: flex;
        flex-direction: column;
        background: var(--background);
        box-shadow: var(--elevation-small);
        border-radius: 3px;
        color: var(--text) !important;
    }

    #system .update-card .update-actions {
        margin: 20px 0 0 0;
    }

    #system .update-card .update-actions .button {
        margin: 10px 10px 0 0;
    }

    #system h2 {
        margin: 20px 0 5px 0;
        padding: 0;
        line-height: normal;
        font-size: 22px;
        color: var(--title-text);
    }

    #system  h2:first-child {
        margin: 0 0 5px 0;
    }

    #system .system-content table {
        width: 100%;
        border-spacing: 0;
        margin: 0 0 30px 0;
    }

    #system .system-content table tr th {
        padding: 10px;
        text-align: left;
        border-bottom: 2px var(--border-dark) solid;
        color: var(--pin-color);
    }

    #system .system-content table tr td {
        padding: 10px;
        text-align: left;
        border-bottom: 1px var(--border) solid;
    }

    #system .system-content table tr:last-child td {
        border-bottom: 0 none;
    }

    #system .system-content table .empty {
        padding: 30px;
        text-align: center;
    }
</style>