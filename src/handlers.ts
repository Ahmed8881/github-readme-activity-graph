import { Utilities } from './utils';
import { Request, Response } from 'express';
import { Fetcher } from './fetcher';
import { invalidUserSvg } from './svgs';
import { ParsedQueryOption, UserDetails } from './interfaces/interface';

export class Handlers {
    public getRoot(_req: Request, res: Response) {
        res.send(`<h1>GitHub Readme Activity Graph 📈</h1>`);
    }

    public async getGraph(req: Request, res: Response) {
        try {
            const utils = new Utilities(req.query);

            const fetcher = new Fetcher(utils.username);
            const options = new ParsedQueryOption(req.query, utils.username);
            let fetchCalendarData: string | UserDetails;
            const [ok, range] = options.checkAllValidationsForDateRange();
            if (ok) {
                fetchCalendarData = await fetcher.fetchContributionsWithCustomDates(
                    range,
                    options.from?.toISOString(),
                    options.to?.toISOString()
                );
            } else {
                fetchCalendarData = await fetcher.fetchContributions();
            }
            const { finalGraph, header } = await utils.buildGraph(fetchCalendarData, options);
            utils.setHttpHeader(res, header.maxAge);

            res.status(200).send(finalGraph);
        } catch (error) {
            res.setHeader('Cache-Control', 'no-store, max-age=0');
            res.set('Content-Type', 'image/svg+xml');
            res.send(invalidUserSvg('Something unexpected happened 💥'));
        }
    }

    public async getData(req: Request, res: Response) {
        try {
            const utils = new Utilities(req.query);

            const fetcher = new Fetcher(utils.username);
            const fetchCalendarData: UserDetails | string = await fetcher.fetchContributions();

            if (typeof fetchCalendarData === 'object') {
                res.status(200).send(fetchCalendarData);
            } else {
                res.send(invalidUserSvg(fetchCalendarData));
            }
        } catch (error) {
            res.send(invalidUserSvg('Something unexpected happened 💥'));
        }
    }
}
