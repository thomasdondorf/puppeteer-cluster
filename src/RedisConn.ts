import Redis, { RedisOptions } from 'ioredis'


export default class RedisConn<T> {

    public connect(): Redis {
        var options: RedisOptions = {
            maxRetriesPerRequest: 2,
            connectTimeout: 1000,
            host: process.env.REDIS_HOST,

            port: process.env.REDIS_PORT,
            //password: '',
            //tls: false,
            retryStrategy() {
                return 0;
            },
            db: process.env.REDIS_DB,
        };
        return new Redis(options);

    }
}