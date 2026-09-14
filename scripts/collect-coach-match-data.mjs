#!/usr/bin/env node
/**
 * Incremental, read-only API-Football research collector (Node 22+).
 * node --experimental-strip-types scripts/collect-coach-match-data.mjs --manifest /absolute/manifest.json [--plan-only|--validate-only|--offline]
 * Manifest: {output, envFile?, baseCollection?, cacheDirs?: collection directories,
 * profileModules:[{path,exportName}], identityCacheDirs:[], allowedLeagueIds:[],
 * minSeason:2022,maxSeason:2026,maxClubRoles:3,maxSeasonsPerClub:3,
 * expectedNewCoaches?:36,maxRequests:1500,minRequestIntervalMs:2100}
 * Relative paths resolve against the manifest directory. Module arrays are imported as TypeScript,
 * never extracted from source text. No database or published-snapshot writes. No tenure fallback.
 * Request budget is cumulative per output directory, including failures. Cache hits cost no calls.
 * A directory lock prevents concurrent collectors from bypassing spacing/budget. Interrupted runs
 * replay cached successful responses; STOPPED.json explains hard stops. No automatic error retries.
 * Add modules/identity caches to the manifest for later expansion. Use a new output directory to
 * intentionally refresh finished fixtures; immutable successful caches are reused by default.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { deriveCoachMatchMetrics } from '../src/lib/integrations/coach-match-metrics.ts';
const BASE_URL = 'https://v3.football.api-sports.io';
const hash = s => crypto.createHash('sha256').update(s).digest('hex');
const read = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const positive = v => Number.isInteger(v) && v > 0;
const errorFree = d => d && Object.keys(d.errors ?? {}).length === 0 && Array.isArray(d.response) && !(d.paging?.total > 1);
const canonical = q => { const [endpoint, query = ''] = q.split('?'); const p = new URLSearchParams(query); p.sort(); return endpoint + '?' + p; };
const norm = s => String(s ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const emptyScore = s => !s || Object.values(s).every(v => v === null);
const validGoals = s => s && Number.isInteger(s.home) && s.home >= 0 && Number.isInteger(s.away) && s.away >= 0;
const toInput = f => ({ fixture: f, ...Object.fromEntries(['events', 'lineups', 'statistics'].filter(k => Array.isArray(f[k])).map(k => [k, { fixtureId: f.fixture.id, data: f[k], complete: true }])) });
export function eligibleFixture(f, period, leagues, allowed, cutoff) {
    const meta = leagues.get(f.league?.id);
    if (!meta || !allowed.has(f.league.id) || meta.league.type !== 'League' || !meta.country?.name || meta.country.name === 'World')
        return 'not-approved-domestic-league';
    if (!/^(Regular Season|1st Phase|2nd Phase|Apertura|Clausura) - \d+$/i.test(f.league.round ?? ''))
        return 'not-approved-regular-season-round';
    if (f.fixture?.status?.short !== 'FT' || !emptyScore(f.score?.extratime) || !emptyScore(f.score?.penalty))
        return 'not-normal-FT';
    if (f.league.season !== period.season || ![f.teams?.home?.id, f.teams?.away?.id].includes(period.teamId))
        return 'team-season-mismatch';
    if (!positive(f.fixture.id) || !positive(f.teams.home.id) || !positive(f.teams.away.id) || f.teams.home.id === f.teams.away.id)
        return 'invalid-identity';
    const time = Date.parse(f.fixture.date);
    if (!Number.isFinite(time) || time > cutoff)
        return 'invalid-or-future-date';
    const season = meta.seasons.find(s => s.year === period.season);
    const day = new Date(time).toISOString().slice(0, 10);
    if (!season?.start || !season.end || day < season.start || day > season.end)
        return 'outside-verified-season-dates';
    if (!validGoals(f.goals) || (validGoals(f.score?.fulltime) && (f.goals.home !== f.score.fulltime.home || f.goals.away !== f.score.fulltime.away)))
        return 'invalid-final-score';
    return null;
}
export function exactLineup(f, coachId, periods) {
    const lines = (f.lineups ?? []).filter(l => l.coach?.id === coachId && [f.teams.home.id, f.teams.away.id].includes(l.team?.id) && periods.some(p => p.teamId === l.team.id && p.season === f.league.season));
    if (lines.length !== 1)
        return null;
    if (f.lineups.filter(l => l.team?.id === lines[0].team.id).length !== 1)
        return null;
    return lines[0];
}
function coverage(fixtures) { return { fixtures: fixtures.length, withLineups: fixtures.filter(f => f.lineups?.length).length, withEvents: fixtures.filter(f => f.events?.length).length, withStatistics: fixtures.filter(f => f.statistics?.some(t => t.statistics?.some(s => s.value !== null && s.value !== undefined))).length, withPlayers: fixtures.filter(f => f.players?.some(t => t.players?.length)).length, withExpectedGoals: fixtures.filter(f => f.statistics?.some(t => t.statistics?.some(s => s.type === 'expected_goals' && s.value !== null && s.value !== undefined))).length }; }
export async function collect(manifestPath, options = {}) {
    const m = read(manifestPath), home = path.dirname(path.resolve(manifestPath));
    const resolve = p => path.resolve(home, p);
    const out = resolve(m.output);
    fs.mkdirSync(out, { recursive: true });
    const save = (name, data) => { const f = path.join(out, name); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f + '.tmp', JSON.stringify(data, null, 2) + '\n'); fs.renameSync(f + '.tmp', f); };
    const lock = path.join(out, '.collector.lock');
    if (fs.existsSync(lock)) {
        const prior = read(lock);
        let alive = true;
        try {
            process.kill(prior.pid, 0);
        }
        catch (e) {
            if (e.code === 'ESRCH')
                alive = false;
        }
        if (alive)
            throw Error('Collector output already locked');
        fs.unlinkSync(lock);
    }
    fs.writeFileSync(lock, JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }), { flag: 'wx' });
    let requestCount = 0;
    try {
        for (const dir of ['raw', 'coaches'])
            fs.mkdirSync(path.join(out, dir), { recursive: true });
        const maxRequests = m.maxRequests ?? 1500, spacing = m.minRequestIntervalMs ?? 2100;
        assert.ok(positive(maxRequests) && maxRequests <= 1500, 'maxRequests must be <=1500');
        assert.ok(spacing >= 2000, 'request interval must be >=2000ms');
        assert.ok(positive(m.maxClubRoles ?? 3) && (m.maxClubRoles ?? 3) <= 3);
        assert.ok(positive(m.maxSeasonsPerClub ?? 3) && (m.maxSeasonsPerClub ?? 3) <= 3);
        const min = m.minSeason ?? 2022, max = m.maxSeason ?? new Date().getUTCFullYear();
        assert.ok(Number.isInteger(min) && Number.isInteger(max) && min <= max);
        const allowed = new Set(m.allowedLeagueIds);
        assert.ok(allowed.size && [...allowed].every(positive));
        const ledger = path.join(out, 'requests.jsonl');
        const prior = fs.existsSync(ledger) ? fs.readFileSync(ledger, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse) : [];
        requestCount = prior.length;
        let lastStart = prior.length ? Date.parse(prior.at(-1).startedAt) : 0;
        const queryCache = new Map(), fullCache = new Map(), lru = new Map();
        const cacheRoots = [...(m.baseCollection ? [resolve(m.baseCollection)] : []), ...(m.cacheDirs ?? []).map(resolve), out];
        const indexRaw = (raw, file) => { if (raw.httpStatus !== 200 || !errorFree(raw.data) || !raw.query)
            return; queryCache.set(canonical(raw.query), file); if (raw.query.startsWith('/fixtures?ids='))
            for (const f of raw.data.response)
                if (positive(f.fixture?.id))
                    fullCache.set(f.fixture.id, { source: path.relative(out, file), retrievedAt: raw.retrievedAt }); };
        // Byte-preserving copies keep base provenance resolvable and prevent writes through shared links.
        for (const root of [...new Set(cacheRoots)]) {
            if (!fs.existsSync(path.join(root, 'raw')))
                continue;
            for (const name of fs.readdirSync(path.join(root, 'raw')).filter(n => n.endsWith('.json'))) {
                const origin = path.join(root, 'raw', name);
                const target = path.join(out, 'raw', name);
                if (origin !== target && !fs.existsSync(target))
                    fs.copyFileSync(origin, target);
                indexRaw(read(target), target);
            }
        }
        const loadEnvelope = file => { if (lru.has(file)) {
            const v = lru.get(file);
            lru.delete(file);
            lru.set(file, v);
            return v;
        } const v = read(file); lru.set(file, v); if (lru.size > 8)
            lru.delete(lru.keys().next().value); return v; };
        const fixture = id => { const s = fullCache.get(id); if (!s)
            return null; const envelope = loadEnvelope(path.resolve(out, s.source)); return (s.format === 'coach-export' ? envelope.fixtures : envelope.data.response).find(f => f.fixture.id === id); };
        async function api(endpoint, params = {}) {
            const query = endpoint + '?' + new URLSearchParams(params), key = canonical(query);
            if (queryCache.has(key)) {
                const file = queryCache.get(key);
                return { ...loadEnvelope(file), cacheFile: path.relative(out, file) };
            }
            if (options.offline || options.validateOnly)
                throw Error('Offline cache miss: ' + query);
            if (requestCount >= maxRequests)
                throw Error('Cumulative request budget reached');
            if (!process.env.API_FOOTBALL_KEY && m.envFile)
                process.loadEnvFile(resolve(m.envFile));
            const credential = process.env.API_FOOTBALL_KEY?.trim();
            if (!credential)
                throw Error('API_FOOTBALL_KEY is not loaded');
            await new Promise(r => setTimeout(r, Math.max(0, spacing - (Date.now() - lastStart))));
            lastStart = Date.now();
            requestCount++;
            fs.appendFileSync(ledger, JSON.stringify({ requestCount, query, startedAt: new Date(lastStart).toISOString() }) + '\n');
            let res;
            try { res = await fetch(BASE_URL + query, { headers: { 'x-apisports-key': credential }, signal: AbortSignal.timeout(60000) }); }
            catch (error) { fs.appendFileSync(path.join(out, 'request-failures.jsonl'), JSON.stringify({requestCount, query, kind:'transport', errorName:error.name, causeCode:error.cause?.code??null})+'\n'); throw error; }
            let data;
            try {
                data = await res.json();
            }
            catch {
                throw Error('Non-JSON provider response (not logged)');
            }
            const raw = { query, url: BASE_URL + query, retrievedAt: new Date().toISOString(), httpStatus: res.status, rateLimitRemaining: res.headers.get('x-ratelimit-requests-remaining'), data };
            const name = 'raw/' + hash(query) + '.json';
            save(name, raw);
            if (!res.ok || !errorFree(data))
                throw Error('Provider error or incomplete response; collection stopped: ' + query + ' HTTP ' + res.status);
            indexRaw(raw, path.join(out, name));
            if (raw.rateLimitRemaining !== null && Number(raw.rateLimitRemaining) <= 0)
                throw Error('Provider daily quota exhausted');
            return { ...raw, cacheFile: name };
        }
        const base = m.baseCollection ? read(path.join(resolve(m.baseCollection), 'index.json')) : { coaches: [], totals: {} };
        if (m.baseCollection)
            assert.equal(base.status, 'complete');
        // Some legacy fixtures exist only in a coach export, not an ids-batch envelope.
        // Copy those files before indexing them; preserve the original per-fixture provenance separately.
        for (const c of base.coaches) {
            const origin = path.join(resolve(m.baseCollection), c.path), target = path.join(out, c.path);
            fs.mkdirSync(path.dirname(target), { recursive: true });
            fs.copyFileSync(origin, target);
            const body = read(target);
            for (const f of body.fixtures)
                if (!fullCache.has(f.fixture.id))
                    fullCache.set(f.fixture.id, { source: c.path, format: 'coach-export', retrievedAt: body.retrievedAt, originalSource: body.fixtureSources?.[f.fixture.id] ?? null });
        }
        const baseIds = new Set(base.coaches.map(c => c.coachApiId));
        const profiles = [];
        for (const entry of m.profileModules) {
            const imported = await import(pathToFileURL(resolve(entry.path)));
            const rows = imported[entry.exportName];
            assert.ok(Array.isArray(rows), 'Missing module export ' + entry.exportName);
            profiles.push(...rows);
        }
        assert.equal(new Set(profiles.map(p => p.apiId)).size, profiles.length, 'Duplicate profile IDs');
        assert.ok(profiles.every(p => positive(p.apiId) && !baseIds.has(p.apiId)), 'New/base profile collision');
        if (m.expectedNewCoaches !== undefined)
            assert.equal(profiles.length, m.expectedNewCoaches);
        const identities = [];
        for (const root of m.identityCacheDirs.map(resolve))
            for (const name of fs.readdirSync(root).filter(n => n.endsWith('.json'))) {
                const file = path.join(root, name);
                const raw = read(file), body = raw.body ?? raw.data ?? raw;
                if (!Array.isArray(body.response) || body.errors && Object.keys(body.errors).length)
                    continue;
                for (const c of body.response)
                    if (positive(c.id) && Array.isArray(c.career))
                        identities.push({ record: c, source: file, retrievedAt: raw.retrievedAt ?? null });
            }
        const metadata = await api('/leagues');
        const leagues = new Map(metadata.data.response.map(l => [l.league.id, l]));
        for (const id of allowed) {
            const l = leagues.get(id);
            assert.ok(l && l.league.type === 'League' && l.country.name !== 'World', 'Unverified allowed league ' + id);
        }
        save('league-policy.json', { metadataSource: metadata.cacheFile, allowed: [...allowed].map(id => ({ id, name: leagues.get(id).league.name, country: leagues.get(id).country.name })), roundPolicy: 'Numbered Regular Season/1st Phase/2nd Phase/Apertura/Clausura rounds only; cups, knockout and post-split/championship rounds excluded.' });
        const plans = [], identityAudit = [];
        for (const p of profiles) {
            const matches = identities.filter(x => x.record.id === p.apiId);
            assert.ok(matches.length, 'No cached provider career for ' + p.apiId);
            const chosen = matches.sort((a, b) => String(b.retrievedAt ?? '').localeCompare(String(a.retrievedAt ?? '')))[0];
            const candidateNames = new Set([p.name, ...p.aliases].map(norm));
            const variants = identities.filter(x => x.record.id !== p.apiId && [x.record.name, [x.record.firstname, x.record.lastname].filter(Boolean).join(' ')].some(n => candidateNames.has(norm(n))));
            identityAudit.push({ coachApiId: p.apiId, name: p.name, selectedSource: chosen.source, providerName: chosen.record.name, birth: chosen.record.birth, variants: [...new Map(variants.map(x => [x.record.id, { id: x.record.id, name: x.record.name, birth: x.record.birth, career: x.record.career, source: x.source }])).values()], decision: 'Exact selected ID only; variants never merged.' });
            const rejectedRoles = [], clubRoles = new Map();
            for (const role of [...chosen.record.career].sort((a, b) => String(b.start ?? '').localeCompare(String(a.start ?? '')))) {
                if (!positive(role.team?.id) || !role.start || !Number.isFinite(Date.parse(role.start)) || (role.end !== null && !Number.isFinite(Date.parse(role.end)))) {
                    rejectedRoles.push({ role, reason: 'missing-team-id-or-invalid-dates' });
                    continue;
                }
                if (role.end && role.end < min + '-01-01' || role.start > max + '-12-31') {
                    rejectedRoles.push({ role, reason: 'outside-selected-years' });
                    continue;
                }
                if (/\bU\d{2}\b|\bII\b|\b B$| XI$|\bAmateurs\b/i.test(role.team.name)) {
                    rejectedRoles.push({ role, reason: 'youth-reserve-or-exhibition-role' });
                    continue;
                }
                if (clubRoles.has(role.team.id)) {
                    clubRoles.get(role.team.id).push(role);
                    continue;
                }
                if (clubRoles.size >= (m.maxClubRoles ?? 3)) {
                    rejectedRoles.push({ role, reason: 'older-than-latest-club-limit' });
                    continue;
                }
                const t = await api('/teams', { id: role.team.id });
                const team = t.data.response.find(x => x.team?.id === role.team.id)?.team;
                if (!team || team.national !== false) {
                    rejectedRoles.push({ role, reason: 'not-verified-club-team' });
                    continue;
                }
                clubRoles.set(role.team.id, [role]);
            }
            const requestedPeriods = [];
            for (const [teamId, roles] of clubRoles) {
                const years = new Set();
                for (const role of roles) {
                    const start = Math.max(min, Number(role.start.slice(0, 4)) - 1), end = Math.min(max, role.end ? Number(role.end.slice(0, 4)) : max);
                    for (let year = start; year <= end; year++)
                        years.add(year);
                }
                for (const season of [...years].sort((a, b) => b - a).slice(0, m.maxSeasonsPerClub ?? 3)) {
                    requestedPeriods.push({ teamId, season, teamName: roles[0].team.name, selectionEvidence: chosen.source, providerCareerStart: roles[0].start, providerCareerEnd: roles[0].end, providerCareerRows: roles });
                }
            }
            plans.push({ coachApiId: p.apiId, name: p.name, requestedPeriods, rejectedRoles });
            console.log('PLAN', p.apiId, p.name, 'periods', requestedPeriods.length, 'requests', requestCount);
        }
        save('plan.json', { createdAt: new Date().toISOString(), manifest: m, plans });
        save('identity-audit.json', identityAudit);
        if (options.planOnly)
            return { planned: plans.length, requests: requestCount };
        const periodMap = new Map(), eligible = new Map(), excluded = [];
        for (const p of plans)
            for (const period of p.requestedPeriods) {
                const key = period.teamId + '-' + period.season;
                if (periodMap.has(key))
                    continue;
                const raw = await api('/fixtures', { team: period.teamId, season: period.season, status: 'FT' });
                const ids = [];
                const seen = new Set();
                for (const f of raw.data.response) {
                    assert.ok(!seen.has(f.fixture?.id), 'Duplicate listed fixture');
                    seen.add(f.fixture?.id);
                    const reason = eligibleFixture(f, period, leagues, allowed, Date.parse(raw.retrievedAt));
                    if (reason) {
                        excluded.push({ fixtureId: f.fixture?.id, period: key, leagueId: f.league?.id, round: f.league?.round, reason });
                        continue;
                    }
                    ids.push(f.fixture.id);
                    eligible.set(f.fixture.id, f);
                }
                periodMap.set(key, { ...period, listedCount: raw.data.response.length, eligibleFixtureIds: ids, source: raw.cacheFile, retrievedAt: raw.retrievedAt });
                console.log('LIST', key, 'eligible', ids.length, 'requests', requestCount);
            }
        save('periods.json', [...periodMap.values()]);
        save('excluded-fixtures.json', excluded);
        const pending = [...eligible.keys()].filter(id => !fullCache.has(id));
        console.log('BATCH PLAN', pending.length, 'uncached fixtures;', Math.ceil(pending.length / 20), 'requests;', eligible.size - pending.length, 'reused fixtures');
        for (let i = 0; i < pending.length; i += 20) {
            const ids = pending.slice(i, i + 20), raw = await api('/fixtures', { ids: ids.join('-') });
            const got = new Set();
            for (const f of raw.data.response) {
                assert.ok(ids.includes(f.fixture.id) && !got.has(f.fixture.id), 'Unexpected batch fixture');
                got.add(f.fixture.id);
            }
            assert.equal(got.size, ids.length, 'Missing batch fixture');
            console.log('FULL', Math.min(i + 20, pending.length) + '/' + pending.length, 'requests', requestCount);
        }
        const index = [], normalizations = [], now = new Date().toISOString(), baseHashes = [];
        for (const c of base.coaches) {
            const source = path.join(resolve(m.baseCollection), c.path), target = path.join(out, c.path);
            const bytes = fs.readFileSync(source);
            fs.mkdirSync(path.dirname(target), { recursive: true });
            fs.writeFileSync(target, bytes);
            baseHashes.push({ coachApiId: c.coachApiId, path: c.path, sha256: hash(bytes) });
            index.push(c);
        }
        for (const p of plans) {
            const ids = new Set(p.requestedPeriods.flatMap(x => periodMap.get(x.teamId + '-' + x.season).eligibleFixtureIds));
            const attributed = [], rejected = [];
            for (const id of ids) {
                const f = fixture(id), list = eligible.get(id);
                assert.ok(f, 'Missing cached full fixture');
                assert.equal(f.league.id, list.league.id);
                assert.equal(f.league.season, list.league.season);
                assert.equal(f.fixture.date, list.fixture.date);
                assert.equal(f.teams.home.id, list.teams.home.id);
                assert.equal(f.teams.away.id, list.teams.away.id);
                const line = exactLineup(f, p.coachApiId, p.requestedPeriods);
                if (!line) {
                    rejected.push({ fixtureId: id, reason: (f.lineups ?? []).some(l => positive(l.coach?.id)) ? 'different-or-missing-target-coach-id' : 'missing-lineup-coach-ids', observedCoaches: (f.lineups ?? []).map(l => ({ teamId: l.team?.id, coachId: l.coach?.id ?? null, name: l.coach?.name ?? null })) });
                    continue;
                }
                const period = p.requestedPeriods.find(x => x.teamId === line.team.id && x.season === f.league.season), reason = eligibleFixture(f, period, leagues, allowed, Date.parse(fullCache.get(id).retrievedAt ?? now));
                if (reason) {
                    rejected.push({ fixtureId: id, reason });
                    continue;
                }
                const exported = structuredClone(f);
                // A successful envelope containing [] does not establish a complete event feed, even for 0-0.
                // Preserve the exact provider object in raw/; omit empty event arrays only in derived coach exports.
                if (Array.isArray(exported.events) && exported.events.length === 0) {
                    delete exported.events;
                    normalizations.push({ coachApiId: p.coachApiId, fixtureId: id, field: 'events', action: 'omitted-empty-array-as-unknown', rawSource: fullCache.get(id).source });
                }
                attributed.push(exported);
            }
            attributed.sort((a, b) => Date.parse(a.fixture.date) - Date.parse(b.fixture.date) || a.fixture.id - b.fixture.id);
            const periods = p.requestedPeriods.map(x => { const a = attributed.filter(f => f.league.season === x.season && f.lineups.some(l => l.team.id === x.teamId && l.coach?.id === p.coachApiId)); return { ...x, eligibleCount: periodMap.get(x.teamId + '-' + x.season).eligibleFixtureIds.length, observedCount: a.length, firstObservedAt: a[0]?.fixture.date ?? null, lastObservedAt: a.at(-1)?.fixture.date ?? null, firstFiveObservedFixtureIds: a.slice(0, 5).map(f => f.fixture.id) }; });
            const counts = coverage(attributed), file = 'coaches/' + p.coachApiId + '.json';
            const limitations = ['Selected recent club/team-season sample, not a complete career or a causal measure of coaching impact.', 'Only approved domestic League metadata and numbered regular league rounds; FT, valid results and official season date bounds required.', 'Exact selected lineup coach ID on the selected club is mandatory. Alias IDs and missing identities are never merged or inferred; no tenure fallback.', 'Provider career records only select searches, never establish present employment or match attribution. Dates are not corrected.', 'Missing feeds remain missing; empty event arrays are omitted in derived exports, with exact original responses preserved in raw/.', 'First-five IDs mean first five observed matches in each selected team-season, not first five tenure matches.', 'Raw provider data is verified for internal consistency, not independently audited against match reports. Metrics require their individual coverage; unresolved own goals and substitution/event discrepancies remain excluded.'];
            save(file, { coachApiId: p.coachApiId, name: p.name, retrievedAt: now, fixtures: attributed, requestedPeriods: periods, limitations, coverage: counts, rejectedCandidates: rejected, fixtureSources: Object.fromEntries(attributed.map(f => [f.fixture.id, fullCache.get(f.fixture.id)])) });
            index.push({ coachApiId: p.coachApiId, name: p.name, path: file, ...counts, firstObservedAt: attributed[0]?.fixture.date ?? null, lastObservedAt: attributed.at(-1)?.fixture.date ?? null, requestedPeriods: periods });
        }
        save('base-preservation.json', { source: m.baseCollection, baseTotals: base.totals, coaches: baseHashes });
        save('normalizations.json', normalizations);
        const unique = new Set(), metricsRows = [], preview = [], issues = [];
        let observations = 0;
        for (const entry of index) {
            const c = read(path.join(out, entry.path)), ids = new Set(), periods = [];
            assert.equal(c.coachApiId, entry.coachApiId);
            for (const f of c.fixtures) {
                assert.ok(!ids.has(f.fixture.id));
                ids.add(f.fixture.id);
                unique.add(f.fixture.id);
                observations++;
                const line = exactLineup(f, c.coachApiId, c.requestedPeriods);
                assert.ok(line, 'Invalid attribution');
                const period = c.requestedPeriods.find(x => x.teamId === line.team.id && x.season === f.league.season);
                assert.equal(eligibleFixture(f, period, leagues, allowed, Date.parse(c.retrievedAt)), null);
                assert.ok(c.fixtureSources[f.fixture.id]);
            }
            for (const p of c.requestedPeriods) {
                const fixtures = c.fixtures.filter(f => f.league.season === p.season && f.lineups.some(l => l.team.id === p.teamId && l.coach?.id === c.coachApiId));
                assert.equal(fixtures.length, p.observedCount);
                assert.deepEqual(fixtures.slice(0, 5).map(f => f.fixture.id), p.firstFiveObservedFixtureIds);
                if (!fixtures.length)
                    continue;
                const metrics = deriveCoachMatchMetrics({ teamId: p.teamId, coachId: c.coachApiId, matches: fixtures.map(toInput) });
                assert.equal(metrics.selection.includedMatches, fixtures.length);
                assert.equal(metrics.selection.tenureFallbackMatches, 0);
                const dates = fixtures.map(f => f.fixture.date).sort();
                periods.push({ club: p.teamName, season: p.season, first: dates[0], last: dates.at(-1), metrics });
            }
            periods.sort((a, b) => b.season - a.season || b.metrics.selection.includedMatches - a.metrics.selection.includedMatches);
            const substantial = periods.findIndex(p => p.metrics.selection.includedMatches >= 10);
            if (substantial > 0)
                periods.unshift(...periods.splice(substantial, 1));
            const row = { coachApiId: c.coachApiId, name: c.name, fixtures: c.fixtures.length, periods: periods.length, coverage: Object.fromEntries(['possession', 'xgFor', 'xgAgainst', 'pointsFromLosingPositions', 'goalsBySubstitutes', 'averageFirstSubstitutionMinute'].map(k => [k, periods.reduce((n, p) => n + p.metrics[k].coverage.coveredMatches, 0)])), diagnostics: {} };
            for (const p of periods)
                for (const x of p.metrics.diagnostics) {
                    const key = x.scope + ':' + x.reason;
                    row.diagnostics[key] = (row.diagnostics[key] ?? 0) + 1;
                }
            metricsRows.push(row);
            preview.push({ apiId: c.coachApiId, name: c.name, periods, limitations: c.limitations });
        }
        for (const c of baseHashes)
            assert.equal(hash(fs.readFileSync(path.join(out, c.path))), c.sha256);
        const calls = fs.existsSync(ledger) ? fs.readFileSync(ledger, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse) : [];
        assert.ok(calls.length <= maxRequests);
        let minSpacing = null;
        for (let i = 1; i < calls.length; i++) {
            const delta = Date.parse(calls[i].startedAt) - Date.parse(calls[i - 1].startedAt);
            minSpacing = minSpacing === null ? delta : Math.min(minSpacing, delta);
            assert.ok(delta >= 2000);
        }
        const requestedIds = new Set(), priorAttempts = new Map();
        const failuresFile=path.join(out,'request-failures.jsonl');
        const transportFailures=new Set(fs.existsSync(failuresFile)?fs.readFileSync(failuresFile,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse).filter(f=>f.kind==='transport').map(f=>f.requestCount):[]);
        for (const call of calls)
            if (call.query.startsWith('/fixtures?ids=')) {
                const ids = new URLSearchParams(call.query.split('?')[1]).get('ids').split('-').map(Number);
                assert.ok(ids.length <= 20);
                for (const id of ids) {
                    assert.ok(!requestedIds.has(id) || transportFailures.has(priorAttempts.get(id)), 'Duplicate full fixture request without recorded transport failure');
                    requestedIds.add(id); priorAttempts.set(id, call.requestCount);
                }
            }
        const zero = index.filter(c => c.fixtures === 0).map(c => ({ coachApiId: c.coachApiId, name: c.name }));
        const totals = { coaches: index.length, baseCoaches: base.coaches.length, newCoaches: profiles.length, uniqueAttributedFixtures: unique.size, coachFixtureObservations: observations, uniqueTeamSeasons: new Set(index.flatMap(c => c.requestedPeriods.map(p => p.teamId + '-' + p.season))).size, newCandidateTeamSeasons: periodMap.size, newCandidateFixtures: eligible.size, newFullFixturesRequested: requestedIds.size, apiRequests: calls.length, transportFailures: transportFailures.size, reusedCandidateFixtures: [...eligible.keys()].filter(id=>!requestedIds.has(id)).length, zeroCoverageCoaches: zero.length };
        save('validation.json', { status: 'passed', validatedAt: new Date().toISOString(), totals, minRequestSpacingMs: minSpacing, basePreservedByteForByte: true, checks: ['TS module imports and unique IDs', 'verified career team IDs', 'approved domestic league metadata and season date bounds', 'normal FT valid results', 'exact lineup coach and team-season; no tenure fallback', 'unique successful fixture requests; explicit transport failures logged; batch <=20; cumulative budget; >=2s spacing', 'unchanged base coach files', 'robust metrics, missing values and diagnostic coverage', 'builder-compatible index and offline preview'], zeroCoverage: zero, identityVariants: identityAudit.filter(x => x.variants.length), issues, coaches: metricsRows });
        save('snapshot-preview.json', { retrievedAt: now, coaches: preview });
        save('index.json', { retrievedAt: now, status: 'complete', totals, coaches: index });
        fs.rmSync(path.join(out, 'STOPPED.json'), { force: true });
        const notes = `# Expanded coach match collection\n\nValidated ${now}. Builder input: ${out}/index.json. Published snapshot untouched.\n\n${JSON.stringify(totals, null, 2)}\n\n${base.coaches.length} base coach files copied byte for byte (base-preservation.json). ${profiles.length} added coaches. All source IDs came from cached API careers; team metadata confirms club status. League policy and official season dates are checked. Max three recent club teams and three season labels per team; career dates only select searches. Exact lineup ID is required, including in cached fixtures. No identity aliases merged.\n\nRequests: ${calls.length}/${maxRequests}; minimum observed spacing ${minSpacing ?? 'n/a'} ms. Reused candidate fixtures: ${totals.reusedCandidateFixtures}. Full batches <=20. Provider failures/quota errors stop the process. Source envelopes include query, retrieval timestamp and provider body; requests.jsonl contains no credentials.\n\nNumbered Regular Season, 1st Phase, 2nd Phase, Apertura and Clausura rounds only; post-split rounds, playoff stages, cups and internationals are excluded. Zero coverage means unknown in this sample, never zero performance. First-five means first observed team-season matches.\n\n| Coach | ID | Matches | Possession | xG for | Reconciled events | Sub goals |\n|---|---:|---:|---:|---:|---:|---:|\n${metricsRows.map(c => `| ${c.name} | ${c.coachApiId} | ${c.fixtures} | ${c.coverage.possession} | ${c.coverage.xgFor} | ${c.coverage.pointsFromLosingPositions} | ${c.coverage.goalsBySubstitutes} |`).join('\n')}\n\nZero coverage: ${zero.map(c => c.name + ' (' + c.coachApiId + ')').join(', ') || 'none'}.\n\n## Files and integration\n\n- index.json + coaches/*.json: compatible with scripts/build-coach-match-snapshot.mjs; parent alone publishes.\n- snapshot-preview.json: offline derivation using the robust metrics module; no published files written.\n- validation.json: actual per-metric coverage and diagnostics, alias review, budget checks.\n- identity-audit.json: selected identity and unmerged cached alternatives.\n- plan.json + periods.json: exact search periods, rejected roles and eligible fixture lists.\n- excluded-fixtures.json: competition/date/result exclusions.\n- normalizations.json: empty event arrays omitted only from new derived exports; exact provider responses remain in raw/.\n- base-preservation.json: base byte hashes.\n- raw/*.json: full successful/error API envelopes, including reused original cache.\n- requests.jsonl: new outgoing calls only; cumulative across resumptions.\n\nOfficial batch source (opened): https://www.api-football.com/news/post/how-to-get-all-fixtures-data-from-one-league\n\n## Limits\n\nProvider consistency checking is not independent match-report corroboration. Null career end dates and newer club rows establish neither employment nor availability. Alternate coach/team IDs may create incomplete coverage. Inspect each rejectedCandidates list; never fill it from tenure dates. Missing xG, feeds and unresolved own-goal/event/substitution records are excluded from their respective denominators by the metrics module. Original 14 data remains unmodified, including its historical limitations.\n`;
        fs.writeFileSync(path.join(out, 'REPORT.md'), notes);
        console.log('COMPLETE', JSON.stringify(totals));
        return totals;
    }
    catch (e) {
        save('STOPPED.json', { at: new Date().toISOString(), requestCount, error: e.message });
        throw e;
    }
    finally {
        fs.rmSync(lock, { force: true });
    }
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
    const args = process.argv.slice(2), i = args.indexOf('--manifest');
    if (i < 0 || !args[i + 1]) {
        console.error('Usage: node --experimental-strip-types scripts/collect-coach-match-data.mjs --manifest FILE [--plan-only|--offline|--validate-only]');
        process.exitCode = 1;
    }
    else
        collect(path.resolve(args[i + 1]), { planOnly: args.includes('--plan-only'), offline: args.includes('--offline'), validateOnly: args.includes('--validate-only') }).catch(e => { console.error('STOPPED:', e.message); process.exitCode = 1; });
}
