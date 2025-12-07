import express from 'express';
import { 
    aboutRouter,
    donationsRouter,
    newsRouter,
    packsRouter,
    rulesRouter,
    weeklyEventsRouter,
    worldEventsRouter,
    adminAboutRouter,
    adminDonationsRouter,
    adminNewsRouter,
    adminPacksRouter,
    adminRulesRouter,
    adminWeeklyEventsRouter,
    adminWorldEventsRouter,
    healthRouter,
} from './routes';
import { startScheduler } from './scheduler/eventsScheduler';

const app = express();
app.use(express.json());

app.use('/health', healthRouter);

app.use('/about', aboutRouter);
app.use('/admin/about', adminAboutRouter);

app.use('/donations', donationsRouter);
app.use('/admin/donations', adminDonationsRouter);

app.use('/news', newsRouter);
app.use('/admin/news', adminNewsRouter);

app.use('/packs', packsRouter);
app.use('/admin/packs', adminPacksRouter);

app.use('/rules', rulesRouter);
app.use('/admin/rules', adminRulesRouter);

app.use('/weekly-events', weeklyEventsRouter);
app.use('/admin/weekly-events', adminWeeklyEventsRouter);

app.use('/world-events', worldEventsRouter);
app.use('/admin/world-events', adminWorldEventsRouter);

const PORT = process.env.PORT ?? 4000;
app.listen(PORT, () => {
    console.log(`VM API listening on :${PORT}`);
    startScheduler();
});
