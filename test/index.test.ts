
import { Cluster } from '../src/index';

test('Cluster is exported', () => {
    expect(Cluster).toBeDefined();
    expect(typeof Cluster.launch).toBe('function');
});
