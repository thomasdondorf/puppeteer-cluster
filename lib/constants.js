
module.exports = {
    CLUSTER_CONCURRENCY_PAGE: 1, // shares cookies, etc.
    CLUSTER_CONCURRENCY_CONTEXT: 2, // no cookie sharing
    CLUSTER_CONCURRENCY_BROWSER: 3, // no cookie sharing and individual processes (also uses contexts)

    CLUSTER_MONITORING_INTERVAL: 500,
};