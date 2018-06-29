
export { default as Cluster } from './Cluster';

// In case of an unexpected promise error, throw!
//
process.on('unhandledRejection', (error) => {
    throw error;
});
