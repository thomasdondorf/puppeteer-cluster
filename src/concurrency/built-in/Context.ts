
import * as puppeteer from 'puppeteer';
import { BROWSER_TIMEOUT, timeoutExecute } from '../../util';

import { ResourceData } from '../ConcurrencyImplementation';
import SingleBrowserImplementation from '../SingleBrowserImplementation';

export default class Context extends SingleBrowserImplementation {

    protected async createResources(): Promise<ResourceData> {
        const context = await (this.browser as puppeteer.Browser)
            .createIncognitoBrowserContext();
        const page = await context.newPage();
        return {
            context,
            page,
        };
    }

    protected async freeResources(resources: ResourceData): Promise<void> {
        await timeoutExecute(BROWSER_TIMEOUT,  resources.context.close());
    }

}
