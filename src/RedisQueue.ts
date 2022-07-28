
import RedisConn from './RedisConn';
import Redis from 'ioredis';
import Job from './Job';

interface QueueOptions {
    delayUntil?: number;
}

export default class RedisQueue<T> {
    rConn: Redis;
    redisKeyPattern: string;

    constructor(redisKeyPattern: string) {
        var connInstance = new RedisConn();
        this.rConn = connInstance.connect()
        this.redisKeyPattern = redisKeyPattern
    }

    private list: T[] = [];

    public async size(): Promise<number> {
        this.list = [];
        var queueSize = await this.rConn.keys(`*${this.redisKeyPattern}*`);
        for (var i = 0; i < queueSize.length; i++) {
            var redisItem = await this.rConn.get(queueSize[i])
            if (redisItem) {
                var parsed = JSON.parse(redisItem);
                if (parsed == undefined) continue;
                var j = new Job;
                j.data = parsed.item.data
                this.list.push({ item: j });
            }

        }

        return queueSize.length

    }

    public push(item: T, options: QueueOptions = {}): void {
        this.rConn.set(`${this.redisKeyPattern}-` + item.item.data.uuid, JSON.stringify(item))
        this.list.push(item);
    }

    public shift(): T | undefined {

        var item = this.list.shift();
        if (item == undefined) {
            return undefined
        }
        return item.item
    }

}
